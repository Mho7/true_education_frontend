"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { LearningRecord } from "@/lib/guardianHome";
import { ChatBubbleIcon, CheckIcon, ChevronIcon, OpenBookIcon, SproutIcon } from "./guardianIcons";

// 보호자 화면 공통 조각 (카드·섹션 제목·상태 안내·버튼)

export const cardClassName = "rounded-[20px] border border-[#E6E8EC] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]";

/** 카드 제목. action과 href를 주면 오른쪽에 "더 보기" 링크를 단다 */
export function SectionHeader({ title, description, action, href }: { title: string; description?: string; action?: string; href?: string }) {
  return (
    <div className="flex items-start justify-between gap-[12px]">
      <div>
        <h2 className="text-[20px] font-bold tracking-[-0.01em]">{title}</h2>
        {description && <p className="mt-[2px] text-[14px] text-[#8A909C]">{description}</p>}
      </div>
      {action && href && (
        <Link
          href={href}
          className="flex shrink-0 items-center gap-[2px] rounded-full px-[6px] py-[2px] text-[14px] font-medium text-[#6B7280] transition hover:bg-[#F3F4F6] hover:text-[#111418]"
        >
          {action}
          <ChevronIcon className="size-[16px]" />
        </Link>
      )}
    </div>
  );
}

/** 제목이 있는 흰 카드 */
export function Panel({ title, description, action, href, className = "", children }: {
  title: string;
  description?: string;
  action?: string;
  href?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`${cardClassName} p-[24px] max-sm:p-[16px] ${className}`}>
      <SectionHeader title={title} description={description} action={action} href={href} />
      <div className="mt-[16px]">{children}</div>
    </section>
  );
}

/** 카드 안 빈 상태 안내 */
export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-[14px] bg-[#F7F8FA] px-[20px] py-[24px] text-center text-[15px] break-keep text-[#8A909C]">{children}</p>;
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

export function StatusChip({ record }: { record: Pick<LearningRecord, "status" | "stageLabel"> }) {
  return record.status === "IN_PROGRESS" ? (
    <span className="mt-[6px] flex items-center gap-[6px] rounded-full bg-[#FFF1E8] px-[10px] py-[3px] text-[13px] font-medium text-[#B4560F]">
      <span aria-hidden className="size-[6px] rounded-full bg-[#E8672A]" />
      {record.stageLabel} 하는 중
    </span>
  ) : (
    <span className="mt-[6px] flex items-center gap-[4px] rounded-full bg-[#F3F4F6] py-[3px] pr-[10px] pl-[7px] text-[13px] font-medium text-[#4B5260]">
      <CheckIcon className="size-[14px] text-[#1E8A4F]" />
      독서 활동 완료
    </span>
  );
}

export function Cover({ record, size = "md" }: { record: Pick<LearningRecord, "coverColor" | "coverUrl">; size?: "md" | "sm" }) {
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-[12px] ${size === "sm" ? "size-[56px]" : "size-[64px] @[640px]:size-[84px]"} ${
        record.coverUrl ? "border border-[#E6E8EC]" : ""
      }`}
      style={{
        background: record.coverUrl ? "#FFFFFF" : `linear-gradient(150deg, ${record.coverColor}, color-mix(in srgb, ${record.coverColor} 72%, #1F2937))`,
      }}
    >
      {record.coverUrl ? (
        <Image src={record.coverUrl} alt="아이가 그린 표지" fill sizes="84px" className="object-contain" unoptimized />
      ) : (
        <OpenBookIcon className={`${size === "sm" ? "size-[26px]" : "size-[32px]"} text-white/90`} />
      )}
    </span>
  );
}

export function StoryCard({ tone, title, text }: { tone: "good" | "help"; title: string; text: string }) {
  const good = tone === "good";
  return (
    <div className={`rounded-[16px] px-[20px] py-[18px] ${good ? "bg-[#F0F8F3]" : "bg-[#FFF4EE]"}`}>
      <p className="flex items-center gap-[10px] text-[16px] font-bold break-keep">
        <span className={`flex size-[32px] items-center justify-center rounded-[10px] bg-white ${good ? "text-[#2E9E5B]" : "text-[#E8672A]"}`}>
          {good ? <SproutIcon className="size-[20px]" /> : <ChatBubbleIcon className="size-[20px]" />}
        </span>
        {title}
      </p>
      <p className="mt-[10px] line-clamp-5 text-[14px] leading-[23px] break-keep text-[#3A404B]">{text}</p>
    </div>
  );
}
