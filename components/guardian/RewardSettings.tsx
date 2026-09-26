"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { errorMessage, isApiError } from "@/lib/api/client";
import { deleteReward, getRewardBoard, setReward } from "@/lib/api/parents";
import type { RewardBoardResponse } from "@/lib/api/types";

/** 입력 칸에서 고를 수 있는 목표치 수 (다음 목표부터) */
const MILESTONE_CHOICES = 6;
const REWARD_MAX_LENGTH = 100;

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "loaded"; board: RewardBoardResponse };

export default function RewardSettings({ studentId }: { studentId: number }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getRewardBoard(studentId)
      .then((board) => !cancelled && setState({ status: "loaded", board }))
      .catch((error: unknown) => !cancelled && setState({ status: "error", message: errorMessage(error) }));
    return () => {
      cancelled = true;
    };
  }, [studentId, attempt]);

  if (state.status === "loading") return <p className="text-[14px] text-[#8A909C]">보상을 불러오는 중…</p>;
  if (state.status === "error") {
    return (
      <div className="flex flex-wrap items-center gap-[12px] text-[14px] text-[#A8402B]">
        {state.message}
        <button
          type="button"
          onClick={() => {
            setState({ status: "loading" });
            setAttempt((n) => n + 1);
          }}
          className={secondaryButtonClassName}
        >
          다시 불러오기
        </button>
      </div>
    );
  }
  return <RewardBoard key={studentId} studentId={studentId} board={state.board} onChange={(board) => setState({ status: "loaded", board })} />;
}

const secondaryButtonClassName =
  "h-[36px] shrink-0 cursor-pointer rounded-full border border-[#E6E8EC] px-[14px] text-[13px] font-medium text-[#4B5260] transition hover:bg-[#F7F8FA] disabled:cursor-default disabled:opacity-50";

function RewardBoard({
  studentId,
  board,
  onChange,
}: {
  studentId: number;
  board: RewardBoardResponse;
  onChange: (board: RewardBoardResponse) => void;
}) {
  const nameId = useId();
  const milestoneId = useId();
  const [milestone, setMilestone] = useState(board.nextMilestone);
  const [name, setName] = useState(() => board.rewards.find((r) => r.milestone === board.nextMilestone)?.name ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: "error" | "success" } | null>(null);

  // 다음 목표부터 몇 개 + 이미 정해 둔(아직 달성 전) 목표
  const choices = [
    ...new Set([
      ...Array.from({ length: MILESTONE_CHOICES }, (_, i) => board.nextMilestone + i * board.stampsPerReward),
      ...board.rewards.filter((r) => !r.achieved).map((r) => r.milestone),
    ]),
  ].sort((a, b) => a - b);
  const existing = board.rewards.find((r) => r.milestone === milestone);

  function pick(target: number) {
    setMilestone(target);
    setName(board.rewards.find((r) => r.milestone === target)?.name ?? "");
    setMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      onChange(await setReward(studentId, milestone, { name: name.trim() }));
      setMessage({ text: `도장 ${milestone}개 보상을 저장했어요`, tone: "success" });
    } catch (error) {
      setMessage({ text: isApiError(error, 409) ? "이미 달성한 목표는 바꿀 수 없어요" : errorMessage(error), tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(target: number) {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      await deleteReward(studentId, target);
      // DELETE는 204라 보상판을 다시 받아 온다.
      onChange(await getRewardBoard(studentId));
      if (target === milestone) setName("");
      setMessage({ text: `도장 ${target}개 보상을 지웠어요`, tone: "success" });
    } catch (error) {
      setMessage({ text: isApiError(error, 409) ? "이미 달성한 목표는 지울 수 없어요" : errorMessage(error), tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="text-[14px] text-[#4B5260]">
        지금까지 도장 <strong className="text-[#111418]">{board.stampTotal}개</strong>를 모았어요. 도장 {board.stampsPerReward}개마다 보상을 하나씩 받아요.
      </p>

      {board.rewards.length === 0 ? (
        <p className="mt-[14px] rounded-[12px] bg-[#F7F8FA] px-[16px] py-[14px] text-[14px] text-[#8A909C]">아직 정한 보상이 없어요.</p>
      ) : (
        <ul className="mt-[14px] flex flex-col divide-y divide-[#EEF0F3]">
          {board.rewards.map((reward) => (
            <li key={reward.milestone} className="flex items-center gap-[12px] py-[10px]">
              <span className="w-[72px] shrink-0 text-[13px] font-bold text-[#8A909C] tabular-nums">도장 {reward.milestone}개</span>
              <span className="min-w-0 flex-1 text-[15px] break-keep text-[#111418]">{reward.name}</span>
              {reward.achieved ? (
                <span className="rounded-full bg-[#E9F4E3] px-[10px] py-[3px] text-[12px] font-bold text-[#2E6B3A]">✓ 달성</span>
              ) : (
                <span className="flex gap-[6px]">
                  <button type="button" onClick={() => pick(reward.milestone)} disabled={busy} className={secondaryButtonClassName}>
                    수정
                  </button>
                  <button type="button" onClick={() => handleDelete(reward.milestone)} disabled={busy} className={secondaryButtonClassName}>
                    삭제
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="mt-[16px] flex flex-wrap items-end gap-[10px]">
        <label htmlFor={milestoneId} className="flex flex-col gap-[6px] text-[13px] font-medium text-[#4B5260]">
          목표
          <select
            id={milestoneId}
            value={milestone}
            onChange={(event) => pick(Number(event.target.value))}
            className="h-[44px] rounded-[12px] bg-[#F3F4F6] px-[12px] text-[15px] text-[#111418] outline-none focus:ring-2 focus:ring-[#D2651F]/40"
          >
            {choices.map((choice) => (
              <option key={choice} value={choice}>
                도장 {choice}개
              </option>
            ))}
          </select>
        </label>
        <label htmlFor={nameId} className="flex min-w-[200px] flex-1 flex-col gap-[6px] text-[13px] font-medium text-[#4B5260]">
          아이에게 줄 보상
          <input
            id={nameId}
            value={name}
            maxLength={REWARD_MAX_LENGTH}
            onChange={(event) => setName(event.target.value)}
            placeholder="예: 주말에 공원 가기"
            className="h-[44px] rounded-[12px] bg-[#F3F4F6] px-[14px] text-[15px] text-[#111418] outline-none placeholder:text-[#A3A8B2] focus:ring-2 focus:ring-[#D2651F]/40"
          />
        </label>
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="h-[44px] cursor-pointer rounded-full bg-[#E8672A] px-[22px] text-[15px] font-bold text-white transition hover:brightness-105 disabled:cursor-default disabled:opacity-50"
        >
          {existing ? "수정하기" : "저장하기"}
        </button>
      </form>
      {message && (
        <p role={message.tone === "error" ? "alert" : "status"} className={`mt-[8px] text-[13px] ${message.tone === "error" ? "text-[#A8402B]" : "text-[#2E6B3A]"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
