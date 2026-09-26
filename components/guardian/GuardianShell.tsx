"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { getLinkedStudents } from "@/lib/api/parents";
import type { LinkedStudent } from "@/lib/api/types";
import GuardianSideNav from "./GuardianSideNav";
import { ActionButton, ActionLink, StatusCard } from "./guardianUi";
import { useLoad } from "./useLoad";

type GuardianContext = {
  /** 연결된 아이 전체 */
  students: LinkedStudent[];
  /** 지금 보고 있는 아이 */
  child: LinkedStudent;
  selectChild: (studentId: number) => void;
};

const Context = createContext<GuardianContext | null>(null);

/** 보호자 페이지 안에서 지금 고른 아이 (GuardianShell 안에서만 쓴다) */
export function useGuardian(): GuardianContext {
  const value = useContext(Context);
  if (!value) throw new Error("useGuardian은 GuardianShell 안에서만 쓸 수 있어요.");
  return value;
}

/**
 * 보호자 페이지 공통 틀(app/guardian/layout). 왼쪽 메뉴를 그리고, 연결된 아이 목록(GET /parents/me/students)을 한 번만 불러
 * 모든 보호자 페이지가 같은 아이를 보게 한다. 레이아웃이라 페이지를 옮겨도 고른 아이가 유지된다.
 */
export default function GuardianShell({ children }: { children: ReactNode }) {
  const [students, reload] = useLoad(getLinkedStudents, "students");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  let content: ReactNode;
  if (students.status === "loading") content = <ShellMessage>연결된 아이를 불러오는 중…</ShellMessage>;
  else if (students.status === "error") {
    content = students.needsLogin ? (
      <ShellMessage action={<ActionLink href="/">보호자로 로그인하기</ActionLink>}>보호자 계정으로 로그인해야 볼 수 있어요.</ShellMessage>
    ) : (
      <ShellMessage action={<ActionButton onClick={reload}>다시 불러오기</ActionButton>}>{students.message}</ShellMessage>
    );
  } else {
    const list = students.data;
    const child = list.find((s) => s.studentId === selectedId) ?? list[0];
    content = child ? (
      <Context value={{ students: list, child, selectChild: setSelectedId }}>{children}</Context>
    ) : (
      <ShellMessage>연결된 아이가 없어요. 아이가 가입하고 받은 학생 코드로 연결할 수 있어요.</ShellMessage>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-[#F5F6F8] font-kr text-[#111418] max-lg:flex-col lg:h-screen lg:overflow-hidden">
      <GuardianSideNav />
      <main className="relative min-w-0 flex-1 lg:overflow-y-auto">{content}</main>
    </div>
  );
}

function ShellMessage({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[720px] px-[16px] pt-[80px]">
      <StatusCard action={action}>{children}</StatusCard>
    </div>
  );
}

/** 아이가 여럿일 때만 보이는 아이 고르기 탭 */
export function ChildPicker() {
  const { students, child, selectChild } = useGuardian();
  if (students.length < 2) return null;
  return (
    <div role="tablist" aria-label="아이 선택" className="mb-[16px] flex shrink-0 flex-wrap gap-[8px]">
      {students.map((student) => {
        const selected = student.studentId === child.studentId;
        return (
          <button
            key={student.studentId}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => selectChild(student.studentId)}
            className={`h-[36px] cursor-pointer rounded-full px-[16px] text-[14px] font-semibold transition ${
              selected ? "bg-[#111418] text-white" : "border border-[#E6E8EC] bg-white text-[#4B5260] hover:bg-[#F7F8FA]"
            }`}
          >
            {student.name}
          </button>
        );
      })}
    </div>
  );
}

/** 홈 외 페이지 공통 머리글 + 본문 폭 (스크롤하는 페이지) */
export function GuardianPage({ title, description, actions, children }: { title: string; description: string; actions?: ReactNode; children: ReactNode }) {
  const { child } = useGuardian();
  return (
    <div className="@container mx-auto w-full max-w-[1120px] px-[16px] pt-[20px] pb-[48px] lg:px-[48px] lg:pt-[44px]">
      <ChildPicker />
      <header className="mb-[24px] flex flex-wrap items-end justify-between gap-[16px]">
        <div>
          <p className="text-[15px] font-medium text-[#8A909C]">{child.name}</p>
          <h1 className="mt-[4px] text-[34px] leading-[44px] font-bold tracking-[-0.02em] max-sm:text-[26px] max-sm:leading-[34px]">{title}</h1>
          <p className="mt-[6px] text-[15px] break-keep text-[#6B7280]">{description}</p>
        </div>
        {actions}
      </header>
      {children}
    </div>
  );
}
