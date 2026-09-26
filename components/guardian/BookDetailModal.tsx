"use client";

import Image from "next/image";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import type { LearningRecord } from "@/lib/guardianHome";
import { StatusChip } from "./guardianUi";
import { OpenBookIcon } from "./guardianIcons";

/** 홈에서 책을 누르면 뜨는 팝업: 아이가 그린 표지와 그 그림을 설명한 말(음성 인식으로 받아 적은 글) */
export default function BookDetailModal({ record, onClose }: { record: LearningRecord | null; onClose: () => void }) {
  if (!record) return null;
  // 홈은 화면에 맞춰 통째로 확대·축소되므로, 팝업은 그 밖(body)에 띄워 실제 크기로 보여 준다.
  return createPortal(<Dialog record={record} onClose={onClose} />, document.body);
}

function Dialog({ record, onClose }: { record: LearningRecord; onClose: () => void }) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const [year, month, day] = record.date?.split("-").map(Number) ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#111418]/40 p-4 font-kr backdrop-blur-[2px]"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-full w-[720px] max-w-full flex-col overflow-hidden rounded-[24px] bg-white text-[#111418] shadow-[0_24px_60px_rgba(16,24,40,0.24)] sm:flex-row"
      >
        <div
          className="relative aspect-[652/636] w-full shrink-0 border-[#EEF0F3] max-sm:border-b sm:w-[340px] sm:border-r"
          style={
            record.coverUrl
              ? { background: "#FFFFFF" }
              : { background: `linear-gradient(150deg, ${record.coverColor}, color-mix(in srgb, ${record.coverColor} 72%, #1F2937))` }
          }
        >
          {record.coverUrl ? (
            <Image src={record.coverUrl} alt="아이가 그린 표지" fill sizes="340px" className="object-contain" unoptimized />
          ) : (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-[8px] text-white/90">
              <OpenBookIcon className="size-[48px]" />
              <span className="text-[14px] font-medium">{record.status === "IN_PROGRESS" ? "아직 표지를 그리기 전이에요" : "표지 그림 준비 중"}</span>
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto p-[28px] max-sm:p-[20px]">
          <p className="text-[14px] font-medium text-[#8A909C]">{record.date ? `${year}년 ${month}월 ${day}일 다 읽음` : "지금 읽는 책"}</p>
          <h2 id={titleId} className="mt-[4px] pr-[36px] text-[26px] leading-[34px] font-bold tracking-[-0.01em] break-keep">
            {record.title}
          </h2>
          <div className="flex">
            <StatusChip record={record} />
          </div>

          <p className="mt-[24px] text-[14px] font-semibold text-[#8A909C]">표지 그림 설명</p>
          {record.reflection ? (
            <>
              <p className="mt-[6px] text-[17px] leading-[28px] break-keep text-[#2A2F37]">“{record.reflection}”</p>
              {record.reflectionMs !== undefined && (
                <p className="mt-[8px] text-[13px] text-[#A3A8B2]">아이가 {Math.max(1, Math.round(record.reflectionMs / 1000))}초 동안 말한 내용을 받아 적었어요</p>
              )}
            </>
          ) : (
            <p className="mt-[6px] text-[15px] leading-[24px] break-keep text-[#8A909C]">
              책을 다 읽고 표지를 그리면, 아이가 그림을 설명한 말이 여기에 보여요.
            </p>
          )}
        </div>

        <button
          ref={closeRef}
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="absolute top-[16px] right-[16px] flex size-[36px] cursor-pointer items-center justify-center rounded-full bg-white/90 text-[#4B5260] shadow-[0_1px_2px_rgba(16,24,40,0.1)] transition hover:bg-[#F3F4F6]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden className="size-[18px]">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
