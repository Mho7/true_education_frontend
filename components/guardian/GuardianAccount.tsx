"use client";

import { useRouter } from "next/navigation";
import { getMe, logout } from "@/lib/api/auth";
import { signOut, useCurrentMember } from "@/lib/session";
import { GuardianPage, useGuardian } from "./GuardianShell";
import { UsersIcon } from "./guardianIcons";
import { ActionButton, Panel, StatusCard } from "./guardianUi";
import { useLoad } from "./useLoad";

/** 계정 관리: 보호자 정보(GET /me) · 연결된 아이(GET /parents/me/students) · 로그아웃 */
export default function GuardianAccount() {
  const router = useRouter();
  const { students, child, selectChild } = useGuardian();
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

        <Panel title="연결된 아이" description="가입할 때 입력한 학생 코드로 연결된 아이예요">
          <ul className="flex flex-col gap-[8px]">
            {students.map((student) => {
              const selected = student.studentId === child.studentId;
              return (
                <li key={student.studentId} className="flex items-center gap-[12px] rounded-[14px] border border-[#EEF0F3] px-[14px] py-[12px]">
                  <span className="flex size-[36px] shrink-0 items-center justify-center rounded-[10px] bg-[#EEF0FD] text-[#4F5BD5]">
                    <UsersIcon className="size-[20px]" />
                  </span>
                  <span className="min-w-0 flex-1 text-[16px] font-semibold">{student.name}</span>
                  {selected ? (
                    <span className="text-[13px] font-semibold text-[#E8672A]">보는 중</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => selectChild(student.studentId)}
                      className="h-[32px] cursor-pointer rounded-full border border-[#E6E8EC] px-[12px] text-[13px] font-medium text-[#4B5260] transition hover:bg-[#F7F8FA]"
                    >
                      이 아이 보기
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>

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
