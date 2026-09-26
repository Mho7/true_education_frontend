"use client";

import { useId, useState, type FormEvent } from "react";
import { errorMessage, isApiError } from "@/lib/api/client";
import { deleteReward, getRewardBoard, setReward } from "@/lib/api/parents";
import type { RewardBoardResponse } from "@/lib/api/types";
import { GuardianPage, useGuardian } from "./GuardianShell";
import { CheckIcon, GiftIcon } from "./guardianIcons";
import { ActionButton, cardClassName, Panel, StatusCard } from "./guardianUi";
import { useLoad } from "./useLoad";

/** 보여 줄 앞으로의 목표 칸 수 (다음 목표부터) */
const UPCOMING_COUNT = 4;
const REWARD_MAX_LENGTH = 100;

/** 리워드 설정: 도장 5개마다 받을 보상을 목표별로 정한다 (GET·PUT·DELETE /parents/me/students/{id}/rewards) */
export default function GuardianRewards() {
  const { child } = useGuardian();
  const [load, reload] = useLoad(() => getRewardBoard(child.studentId), `rewards-${child.studentId}`);
  // 저장·삭제 뒤 받은 새 보상판 (다시 불러오기 전까지 이걸 쓴다)
  const [updated, setUpdated] = useState<{ key: number; board: RewardBoardResponse } | null>(null);

  return (
    <GuardianPage title="리워드 설정" description="아이가 도장을 모으면 받을 보상을 정해 주세요. 정한 보상은 아이의 도장 화면에 보여요.">
      {load.status === "loading" ? (
        <StatusCard>보상판을 불러오는 중…</StatusCard>
      ) : load.status === "error" ? (
        <StatusCard action={<ActionButton onClick={reload}>다시 불러오기</ActionButton>}>{load.message}</StatusCard>
      ) : (
        <RewardBoard
          studentId={child.studentId}
          board={updated?.key === child.studentId ? updated.board : load.data}
          onChange={(board) => setUpdated({ key: child.studentId, board })}
        />
      )}
    </GuardianPage>
  );
}

type Row = { milestone: number; name?: string; achieved: boolean };

function RewardBoard({ studentId, board, onChange }: { studentId: number; board: RewardBoardResponse; onChange: (board: RewardBoardResponse) => void }) {
  const step = board.stampsPerReward;
  const current = Math.min(Math.max(step - (board.nextMilestone - board.stampTotal), 0), step);

  // 정해 둔 보상 + 다음 목표부터 몇 칸 (목표치 오름차순)
  const byMilestone = new Map(board.rewards.map((reward) => [reward.milestone, reward]));
  const milestones = new Set(board.rewards.map((reward) => reward.milestone));
  for (let i = 0; i < UPCOMING_COUNT; i++) milestones.add(board.nextMilestone + i * step);
  const rows: Row[] = [...milestones]
    .sort((a, b) => a - b)
    .map((milestone) => ({
      milestone,
      name: byMilestone.get(milestone)?.name,
      achieved: board.stampTotal >= milestone,
    }));

  return (
    <div className="flex flex-col gap-[20px]">
      <section className={`${cardClassName} flex flex-wrap items-center gap-[24px] p-[24px] max-sm:p-[16px]`}>
        <span className="flex size-[72px] shrink-0 items-center justify-center rounded-[20px] bg-[#FFF1E8] text-[#E8672A]">
          <GiftIcon className="size-[36px]" />
        </span>
        <div className="min-w-[220px] flex-1">
          <p className="text-[15px] font-medium text-[#6B7280]">지금까지 모은 도장</p>
          <p className="mt-[2px] text-[30px] leading-[38px] font-bold tabular-nums">
            {board.stampTotal}
            <span className="ml-[3px] text-[20px] font-semibold text-[#4B5260]">개</span>
          </p>
          <p className="mt-[4px] text-[14px] break-keep text-[#4B5260]">도장 {step}개를 모을 때마다 보상을 하나 받아요.</p>
        </div>
        <div className="w-full max-w-[320px]">
          <div className="flex justify-between text-[13px] text-[#8A909C] tabular-nums">
            <span>보상까지</span>
            <span>
              {current} / {step}
            </span>
          </div>
          <ol className="mt-[8px] flex gap-[6px]" aria-label={`${step}개 중 ${current}개 모음`}>
            {Array.from({ length: step }, (_, i) => (
              <li key={i} className={`h-[10px] flex-1 rounded-full ${i < current ? "bg-[#E8672A]" : "bg-[#E3E6EB]"}`} />
            ))}
          </ol>
        </div>
      </section>

      <Panel title="목표별 보상" description="이미 받은 보상은 바꿀 수 없어요">
        <ul className="flex flex-col divide-y divide-[#EEF0F3]">
          {rows.map((row) => (
            <RewardRow key={row.milestone} studentId={studentId} row={row} onChange={onChange} />
          ))}
        </ul>
      </Panel>
    </div>
  );
}

const smallButton =
  "h-[36px] shrink-0 cursor-pointer rounded-full border border-[#E6E8EC] px-[14px] text-[13px] font-medium text-[#4B5260] transition hover:bg-[#F7F8FA] disabled:cursor-default disabled:opacity-50";

function RewardRow({ studentId, row, onChange }: { studentId: number; row: Row; onChange: (board: RewardBoardResponse) => void }) {
  const inputId = useId();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(row.name ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await setReward(studentId, row.milestone, { name: draft.trim() }));
      setEditing(false);
    } catch (caught) {
      setError(isApiError(caught, 409) ? "이미 받은 보상은 바꿀 수 없어요." : errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await deleteReward(studentId, row.milestone);
      // DELETE는 204라 보상판을 다시 받아 온다.
      onChange(await getRewardBoard(studentId));
      setDraft("");
    } catch (caught) {
      setError(isApiError(caught, 409) ? "이미 받은 보상은 지울 수 없어요." : errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="py-[14px]">
      <div className="flex flex-wrap items-center gap-[14px]">
        <span
          className={`flex h-[32px] w-[92px] shrink-0 items-center justify-center rounded-full text-[13px] font-bold tabular-nums ${
            row.achieved ? "bg-[#E9F6EF] text-[#1B7A45]" : "bg-[#F3F4F6] text-[#4B5260]"
          }`}
        >
          도장 {row.milestone}개
        </span>

        {editing ? (
          <form onSubmit={save} className="flex min-w-[240px] flex-1 flex-wrap items-center gap-[8px]">
            <label htmlFor={inputId} className="sr-only">
              도장 {row.milestone}개 보상
            </label>
            <input
              id={inputId}
              autoFocus
              value={draft}
              maxLength={REWARD_MAX_LENGTH}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="예: 주말에 공원 가기"
              className="h-[40px] min-w-0 flex-1 rounded-[12px] bg-[#F3F4F6] px-[14px] text-[15px] outline-none placeholder:text-[#A3A8B2] focus:ring-2 focus:ring-[#E8672A]/40"
            />
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              className="h-[40px] cursor-pointer rounded-full bg-[#E8672A] px-[18px] text-[14px] font-semibold text-white transition hover:brightness-105 disabled:cursor-default disabled:opacity-50"
            >
              {busy ? "저장 중…" : "저장"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setDraft(row.name ?? "");
                setError(null);
              }}
              className={smallButton}
            >
              취소
            </button>
          </form>
        ) : (
          <>
            <p className={`min-w-[180px] flex-1 text-[16px] break-keep ${row.name ? "font-semibold text-[#111418]" : "text-[#A3A8B2]"}`}>
              {row.name ?? "아직 정하지 않았어요"}
            </p>
            {row.achieved ? (
              <span className="flex items-center gap-[4px] text-[13px] font-semibold text-[#1B7A45]">
                <CheckIcon className="size-[16px]" />
                받았어요
              </span>
            ) : (
              <span className="ml-auto flex gap-[6px]">
                <button type="button" onClick={() => setEditing(true)} disabled={busy} className={smallButton}>
                  {row.name ? "수정" : "정하기"}
                </button>
                {row.name && (
                  <button type="button" onClick={() => void remove()} disabled={busy} className={smallButton}>
                    삭제
                  </button>
                )}
              </span>
            )}
          </>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-[6px] pl-[106px] text-[13px] text-[#C4472F] max-sm:pl-0">
          {error}
        </p>
      )}
    </li>
  );
}
