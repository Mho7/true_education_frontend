"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type FormEvent } from "react";
import { getMe, logout } from "@/lib/api/auth";
import { errorMessage } from "@/lib/api/client";
import { cancelLinkRequest, getLinkedStudents, getLinkRequests, requestStudentLink } from "@/lib/api/parents";
import type { LinkRequest } from "@/lib/api/types";
import { signOut, useCurrentMember } from "@/lib/session";
import { GuardianPage, useLinkedStudents } from "./GuardianShell";
import { UsersIcon } from "./guardianIcons";
import { ActionButton, Empty, Panel, StatusCard } from "./guardianUi";
import { useLoad } from "./useLoad";

/** 계정 관리: 보호자 정보(GET /me) · 연결된 아이(GET /parents/me/students, 학생 코드로 추가) · 로그아웃 */
export default function GuardianAccount() {
  const router = useRouter();
  const member = useCurrentMember();
  const [me, reload] = useLoad(getMe, "me");

  function handleLogout() {
    logout().catch(() => {});
    signOut();
    router.push("/");
  }

  return (
    <GuardianPage title="계정 관리" description="보호자 계정 정보와 연결된 아이를 확인해요.">
      <div className="grid grid-cols-1 gap-[20px] @[900px]:grid-cols-2">
        <Panel title="보호자 정보">
          {me.status === "loading" ? (
            <p className="text-[15px] text-[#8A909C]">불러오는 중…</p>
          ) : me.status === "error" ? (
            <StatusCard action={<ActionButton onClick={reload}>다시 불러오기</ActionButton>}>{me.message}</StatusCard>
          ) : (
            <dl className="grid grid-cols-[88px_1fr] gap-y-[12px] text-[15px]">
              <dt className="text-[#8A909C]">이름</dt>
              <dd className="font-semibold">{me.data.name}</dd>
              {member?.loginId && (
                <>
                  <dt className="text-[#8A909C]">아이디</dt>
                  <dd className="font-semibold">{member.loginId}</dd>
                </>
              )}
              <dt className="text-[#8A909C]">계정 유형</dt>
              <dd className="font-semibold">{me.data.role === "PARENT" ? "보호자" : "학생"}</dd>
            </dl>
          )}
        </Panel>

        <LinkedChildrenPanel />

        <Panel title="로그아웃" description="이 기기에서 보호자 계정의 로그인을 끝내요" className="@[900px]:col-span-2">
          <button
            type="button"
            onClick={handleLogout}
            className="h-[44px] cursor-pointer rounded-full border border-[#E6E8EC] px-[20px] text-[15px] font-semibold text-[#C4472F] transition hover:bg-[#FDECE8]"
          >
            로그아웃
          </button>
        </Panel>
      </div>
    </GuardianPage>
  );
}

const smallButton =
  "h-[36px] shrink-0 cursor-pointer rounded-full border border-[#E6E8EC] px-[14px] text-[13px] font-medium text-[#4B5260] transition hover:bg-[#F7F8FA] disabled:cursor-default disabled:opacity-50";

async function loadLinks() {
  const [students, pending] = await Promise.all([getLinkedStudents(), getLinkRequests()]);
  return { students, pending };
}

/**
 * 연결된 아이 + 학생 코드로 아이 추가. 다자녀라 몇 명이든 추가할 수 있고,
 * 요청은 아이가 설정에서 수락해야 연결되므로 그 전까지는 대기중(주황)으로 보인다.
 */
function LinkedChildrenPanel() {
  const shell = useLinkedStudents();
  // 아이가 수락하면 대기 목록에서 빠지고 연결된 아이로 옮겨 가므로 두 목록을 함께 불러온다.
  const [links, reloadLinks] = useLoad(loadLinks, "links");
  const inputId = useId();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const students = links.status === "loaded" ? links.data.students : shell.students;
  const pending = links.status === "loaded" ? links.data.pending : [];

  // 페이지를 연 사이 아이가 수락했으면 다른 보호자 페이지(아이 고르기)도 새 목록을 보게 한다.
  const shellCount = shell.students.length;
  const loadedCount = links.status === "loaded" ? links.data.students.length : shellCount;
  useEffect(() => {
    if (loadedCount !== shellCount) shell.reload();
  }, [loadedCount, shellCount, shell]);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !code.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      await requestStudentLink(code);
      setCode("");
      setMessage({ tone: "success", text: "연결을 요청했어요. 아이가 설정에서 수락하면 연결돼요." });
      reloadLinks();
    } catch (caught) {
      setMessage({ tone: "error", text: errorMessage(caught) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="연결된 아이" description="아이의 학생 코드로 추가하면, 아이가 설정에서 수락했을 때 연결돼요">
      <form onSubmit={handleAdd} className="flex gap-[8px]">
        <label htmlFor={inputId} className="sr-only">
          학생 코드
        </label>
        <input
          id={inputId}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="학생 코드 6자리"
          autoComplete="off"
          spellCheck={false}
          className="h-[44px] min-w-0 flex-1 rounded-[12px] bg-[#F3F4F6] px-[14px] text-[15px] tracking-[0.08em] outline-none placeholder:tracking-normal placeholder:text-[#A3A8B2] focus:ring-2 focus:ring-[#4F5BD5]/30"
        />
        <button
          type="submit"
          disabled={busy || !code.trim()}
          className="h-[44px] shrink-0 cursor-pointer rounded-full bg-[#111418] px-[20px] text-[15px] font-semibold text-white transition hover:bg-[#2A2F37] disabled:cursor-default disabled:opacity-50"
        >
          {busy ? "요청 중…" : "아이 추가"}
        </button>
      </form>
      {message && (
        <p role={message.tone === "error" ? "alert" : "status"} className={`mt-[8px] text-[13px] ${message.tone === "error" ? "text-[#C4472F]" : "text-[#1B7A45]"}`}>
          {message.text}
        </p>
      )}

      <div className="mt-[16px]">
        {students.length === 0 && pending.length === 0 ? (
          links.status === "error" ? (
            <StatusCard action={<ActionButton onClick={reloadLinks}>다시 불러오기</ActionButton>}>{links.message}</StatusCard>
          ) : (
            <Empty>아직 연결된 아이가 없어요. 아이 설정에 있는 학생 코드로 추가해 주세요.</Empty>
          )
        ) : (
          <ul className="flex flex-col gap-[8px]">
            {students.map((student) => (
              <li key={student.studentId} className="flex items-center gap-[12px] rounded-[14px] border border-[#EEF0F3] px-[14px] py-[12px]">
                <span className="flex size-[36px] shrink-0 items-center justify-center rounded-[10px] bg-[#EEF0FD] text-[#4F5BD5]">
                  <UsersIcon className="size-[20px]" />
                </span>
                <span className="min-w-0 flex-1 text-[16px] font-semibold">{student.name}</span>
                {/* 초록 동그라미 = 이 보호자 계정과 연결됨 */}
                <span className="flex items-center gap-[6px] text-[13px] font-semibold text-[#1B7A45]">
                  <span aria-hidden className="size-[10px] rounded-full bg-[#22A45D] ring-[3px] ring-[#E3F5EA]" />
                  연결됨
                </span>
              </li>
            ))}
            {pending.map((request) => (
              <PendingRow key={request.requestId} request={request} onCancelled={reloadLinks} />
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}

/** 아이가 아직 수락하지 않은 요청. 아이 이름은 수락 전에는 모르므로 학생 코드로 보여 준다 */
function PendingRow({ request, onCancelled }: { request: LinkRequest; onCancelled: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await cancelLinkRequest(request.requestId);
      onCancelled();
    } catch (caught) {
      setError(errorMessage(caught));
      setBusy(false);
    }
  }

  return (
    <li className="rounded-[14px] border border-[#FCE3C8] bg-[#FFF8F1] px-[14px] py-[12px]">
      <div className="flex items-center gap-[12px]">
        <span className="flex size-[36px] shrink-0 items-center justify-center rounded-[10px] bg-[#FFEBD6] text-[#D9730D]">
          <UsersIcon className="size-[20px]" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[16px] font-semibold tracking-[0.08em]">{request.studentCode}</span>
          <span className="text-[13px] text-[#8A909C]">아이가 수락하면 연결돼요</span>
        </span>
        {/* 주황 동그라미 = 아이의 수락을 기다리는 중 */}
        <span className="flex shrink-0 items-center gap-[6px] text-[13px] font-semibold text-[#C2610C]">
          <span aria-hidden className="size-[10px] rounded-full bg-[#F59E0B] ring-[3px] ring-[#FDEFD8]" />
          대기중
        </span>
        <button type="button" onClick={handleCancel} disabled={busy} className={smallButton}>
          {busy ? "취소 중…" : "요청 취소"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-[6px] text-[13px] text-[#C4472F]">
          {error}
        </p>
      )}
    </li>
  );
}
