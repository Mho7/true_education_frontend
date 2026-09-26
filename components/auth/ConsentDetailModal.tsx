"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import type { ConsentDetail } from "@/lib/signupConsents";

type ConsentDetailModalProps = {
  /** null이면 닫혀 있다 */
  detail: ConsentDetail | null;
  onClose: () => void;
};

// 도장 선물 팝업(components/stamp/RewardModal)과 같은 톤. 내용이 길어 본문만 스크롤한다.
export default function ConsentDetailModal({ detail, onClose }: ConsentDetailModalProps) {
  if (!detail) return null;
  return createPortal(<ConsentDetailDialog detail={detail} onClose={onClose} />, document.body);
}

function ConsentDetailDialog({ detail, onClose }: { detail: ConsentDetail; onClose: () => void }) {
  const titleId = useId();
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#5A4032]/25 p-4 font-kr backdrop-blur-[3px]"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[min(640px,100%)] w-[520px] max-w-full flex-col rounded-[24px] border border-white/90 bg-white/[0.95] px-[36px] pt-[30px] pb-[28px] shadow-[0_20px_50px_rgba(140,106,79,0.18)] backdrop-blur-[12px] max-sm:px-6"
      >
        <h2 id={titleId} className="shrink-0 text-center font-display text-[26px] leading-[32px] text-[#8B6650]">
          {detail.title}
        </h2>

        <div className="mt-[18px] min-h-0 flex-1 overflow-y-auto rounded-[14px] bg-[#FBF7F2] px-[20px] py-[18px] text-[14px] leading-[22px] break-keep text-[#5A4032]">
          {detail.sections.map((section, sectionIndex) => (
            <section key={sectionIndex} className={sectionIndex > 0 ? "mt-[18px]" : undefined}>
              {section.heading && <h3 className="mb-[6px] text-[15px] font-bold text-[#6B4A36]">{section.heading}</h3>}
              <div className="flex flex-col gap-[6px]">
                {section.blocks.map((block, blockIndex) =>
                  typeof block === "string" ? (
                    <p key={blockIndex}>{block}</p>
                  ) : (
                    <ul key={blockIndex} className="list-disc pl-[20px] marker:text-[#B89A84]">
                      {block.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  ),
                )}
              </div>
            </section>
          ))}
        </div>

        <button
          ref={confirmButtonRef}
          type="button"
          onClick={onClose}
          className="mt-[20px] flex h-[52px] w-full shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#E87B3D] text-[16px] font-medium text-white shadow-[0_6px_14px_rgba(90,62,46,0.18)] transition hover:brightness-105 active:scale-[0.99]"
        >
          {detail.confirmLabel}
        </button>
      </div>
    </div>
  );
}
