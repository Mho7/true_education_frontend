"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { GiftIcon } from "./RewardStamp";

type RewardModalProps = {
  /** 선물이 걸린 도장 번호 (5, 10, …). null이면 닫혀 있다. */
  stampNumber: number | null;
  /** 지금까지 모은 도장 수 */
  stampCount: number;
  /** 보호자가 정한 보상 (GET /students/me/rewards). 아직 안 정했으면 undefined */
  rewardName: string | undefined;
  onClose: () => void;
};

// 설정 팝업(components/settings/SettingsModal)과 같은 톤. 학생이 보호자가 정한 선물을 본다(보호자는 보호자 대시보드에서 정한다).
export default function RewardModal({ stampNumber, stampCount, rewardName, onClose }: RewardModalProps) {
  if (stampNumber === null) return null;
  return createPortal(
    <RewardDialog key={stampNumber} stampNumber={stampNumber} stampCount={stampCount} reward={rewardName} onClose={onClose} />,
    document.body,
  );
}

function RewardDialog({
  stampNumber,
  stampCount,
  reward,
  onClose,
}: {
  stampNumber: number;
  stampCount: number;
  reward: string | undefined;
  onClose: () => void;
}) {
  const reached = stampCount >= stampNumber;
  const remaining = stampNumber - stampCount;
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
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
      onKeyDown={(event) => event.stopPropagation()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-[440px] max-w-full rounded-[24px] border border-white/90 bg-white/[0.92] px-[40px] pt-[34px] pb-[32px] shadow-[0_20px_50px_rgba(140,106,79,0.18)] backdrop-blur-[12px]"
      >
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="absolute top-[18px] right-[18px] flex size-9 cursor-pointer items-center justify-center rounded-full text-[#8B6650] transition hover:bg-[#FBF4EC]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden className="size-5">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        <header className="flex flex-col items-center text-center">
          <GiftIcon className="size-[56px]" />
          <h2 id={titleId} className="mt-[6px] font-display text-[30px] leading-[36px] text-[#8B6650]">
            {stampNumber}번째 도장 선물
          </h2>
          <p className="mt-[4px] font-pen text-[22px] leading-[28px] text-[#6B5446]">
            {reached ? "도장을 다 모았어요!" : `도장 ${remaining}개만 더 모으면 받을 수 있어요`}
          </p>
        </header>

        <div className="mt-[24px] rounded-[16px] bg-[#FFF6EC] px-[20px] py-[22px] text-center">
          {reward ? (
            <p className="font-display text-[24px] leading-[32px] break-keep text-[#5A4032]">{reward}</p>
          ) : (
            <p className="text-[15px] text-[#8A7F76]">보호자님이 아직 선물을 정하지 않았어요</p>
          )}
        </div>
      </div>
    </div>
  );
}
