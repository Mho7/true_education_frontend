"use client";

import Image from "next/image";
import { useEffect, useId, useRef, type CSSProperties } from "react";
import { createPortal } from "react-dom";

type DailyStudyCompleteModalProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * 오늘 학습을 이미 끝냈다고 알려 주는 팝업 (시안 design-reference/popup_book_Yeoul.png).
 * 설정 팝업처럼 body에 포털로 붙여 홈·책장 등 어느 화면에서 열어도 화면 한가운데에 뜬다.
 * 버튼 없이 X·바깥 누르기·Esc로 닫고, 닫으면 지금 화면에 그대로 머문다.
 */
export default function DailyStudyCompleteModal({
  open,
  onClose,
}: DailyStudyCompleteModalProps) {
  if (!open) return null;
  return createPortal(
    <DailyStudyCompleteDialog onClose={onClose} />,
    document.body,
  );
}

// 시안 카드(약 1355×880)를 640×416으로 옮긴 자리에 둔 반짝이·새싹 장식
const SPARKLES = [
  { left: 145, top: 104, size: 19 },
  { left: 478, top: 136, size: 21 },
  { left: 456, top: 176, size: 11 },
  { left: 32, top: 330, size: 19 },
];
const SPROUTS = [
  { left: 141, top: 208, size: 32, color: "#B9BE72" },
  { left: 482, top: 208, size: 34, color: "#B9BE72" },
  { left: 38, top: 360, size: 23, color: "#D8B36A" },
  { left: 576, top: 360, size: 23, color: "#D8B36A" },
];

function DailyStudyCompleteDialog({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  const descriptionId = useId();
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
    // 팝업 안에서 누른 키(Space/방향키)가 홈 화면의 여울이 조작으로 새지 않도록 막는다.
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-[rgba(36,54,75,0.2)] p-4 font-kr"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {/* 두꺼운 금빛 테두리 + 안쪽 밝은 테두리 한 줄 */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative flex h-[416px] w-[640px] max-w-full animate-pop-in flex-col items-center rounded-[32px] border-[7px] border-[#D9AE68] bg-[#FCF5E4] pt-[30px] text-center shadow-[inset_0_0_0_3px_#F4E1B8,0_20px_50px_rgba(90,62,46,0.18)]"
      >
        {/* 안쪽 점선 틀 */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[14px] rounded-[20px] border-2 border-dashed border-[#EBCD8E]"
        />

        {/* 반짝이는 저마다 다른 박자로 은은하게 깜빡인다 */}
        {SPARKLES.map((sparkle, i) => (
          <Sparkle
            key={`sparkle-${i}`}
            style={{
              left: sparkle.left,
              top: sparkle.top,
              width: sparkle.size,
              height: sparkle.size,
              animationDuration: "2.4s",
              animationDelay: `${i * 0.6}s`,
            }}
          />
        ))}
        {SPROUTS.map((sprout, i) => (
          <Sprout
            key={`sprout-${i}`}
            color={sprout.color}
            style={{
              left: sprout.left,
              top: sprout.top,
              width: sprout.size,
              height: sprout.size,
            }}
          />
        ))}

        <button
          ref={closeButtonRef}
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="absolute top-[20px] right-[20px] z-10 flex size-[44px] cursor-pointer items-center justify-center rounded-full border-2 border-[#E2C084] bg-[#FBF0D9] text-[#6B4A36] shadow-[0_2px_4px_rgba(140,106,79,0.18)] transition hover:brightness-[0.97] active:scale-95"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.6}
            strokeLinecap="round"
            aria-hidden
            className="size-[20px]"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        {/* 책을 꼭 안은 여울이 (fox-book-hug.png, 537×440). 그림을 바꿀 때는 같은 크기의 투명 PNG로 이 파일만 교체한다. */}
        <Image
          src="/study/fox-book-hug.png"
          alt=""
          width={268}
          height={220}
          className="relative h-[220px] w-[268px] animate-[rise-in_450ms_ease-out_120ms_both] select-none motion-reduce:animate-none"
          draggable={false}
        />

        {/* 제목 뒤 연한 노란 띠 */}
        <h2
          id={titleId}
          className="relative mt-[4px] rounded-full bg-[#FBE7A6]/75 px-[40px] font-display text-[40px] leading-[68px] text-[#3B2A1E] animate-[fade-in_400ms_ease-out_250ms_both] motion-reduce:animate-none"
        >
          오늘 책은 다 읽었어!
        </h2>
        <p
          id={descriptionId}
          className="relative mt-[10px] animate-[fade-in_400ms_ease-out_400ms_both] font-cocochoi text-[26px] leading-[31px] text-[#5C4636] motion-reduce:animate-none"
        >
          내일 새로운 이야기로 다시 만나자!
        </p>
      </div>
    </div>
  );
}

/** 네 갈래로 반짝이는 별 */
function Sparkle({ style }: { style: CSSProperties }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="pointer-events-none absolute motion-safe:animate-pad-pulse"
      style={style}
    >
      <path
        d="M12 0C13 7 17 11 24 12C17 13 13 17 12 24C11 17 7 13 0 12C7 11 11 7 12 0Z"
        fill="#F6C85C"
      />
    </svg>
  );
}

/** 잎 두 장짜리 새싹 */
function Sprout({ color, style }: { color: string; style: CSSProperties }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="pointer-events-none absolute"
      style={style}
    >
      <path
        d="M12 23V12"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path d="M12 13C12 8 8.5 5 3.5 5.5C3.5 10.5 7 13.5 12 13Z" fill={color} />
      <path
        d="M12 11C12 6.5 15.5 3.5 20.5 4C20.5 8.5 17 11.5 12 11Z"
        fill={color}
      />
    </svg>
  );
}
