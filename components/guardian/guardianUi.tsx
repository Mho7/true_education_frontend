"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronIcon } from "./guardianIcons";

// 보호자 화면 공통 조각 (카드·섹션 제목·상태 안내·버튼)

export const cardClassName = "rounded-[20px] border border-[#E6E8EC] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]";

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-[12px]">
      <h2 className="text-[20px] font-bold tracking-[-0.01em]">{title}</h2>
      {action && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="flex cursor-pointer items-center gap-[2px] rounded-full px-[6px] py-[2px] text-[14px] font-medium text-[#6B7280] transition hover:bg-[#F3F4F6] hover:text-[#111418]"
        >
          {action}
          <ChevronIcon className="size-[16px]" />
        </button>
      )}
    </div>
  );
}

export function StatusCard({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div role="status" className={`${cardClassName} flex flex-col items-center gap-[16px] px-[20px] py-[56px] text-center`}>
      <p className="text-[16px] break-keep text-[#4B5260]">{children}</p>
      {action}
    </div>
  );
}

const actionClassName =
  "flex h-[44px] cursor-pointer items-center justify-center rounded-full bg-[#111418] px-[22px] text-[15px] font-semibold text-white transition hover:bg-[#2A2F37]";

export function ActionButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={actionClassName}>
      {children}
    </button>
  );
}

export function ActionLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={actionClassName}>
      {children}
    </Link>
  );
}
