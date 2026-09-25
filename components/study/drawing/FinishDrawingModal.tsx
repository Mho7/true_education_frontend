"use client";

import Image from "next/image";
import { useEffect, useId, useRef } from "react";

type FinishDrawingModalProps = {
  /** "더 그릴래요" (팝업만 닫는다) */
  onContinue: () => void;
  /** 팝업 안의 "다 했어요" (그림을 저장하고 다음 단계로) */
  onFinish: () => void;
};

// 시안 drawing-finish-popup (600×400)을 콘텐츠 캔버스(1104×900) 한가운데에 띄운다.
const DIALOG = { width: 600, height: 400 };

/**
 * 그리기 화면 위에 뜨는 "다 했어요" 확인 팝업. LessonFrame 캔버스 안에 그려서 화면 배율을 그대로 따르고,
 * 옅은 배경은 콘텐츠 영역만 덮는다 (사이드바는 덮지 않는다).
 */
export default function FinishDrawingModal({ onContinue, onFinish }: FinishDrawingModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const continueButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    continueButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onContinue();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onContinue]);

  return (
    <div className="absolute inset-0 z-40">
      {/*
        콘텐츠 캔버스(1104×900)가 화면보다 작아 좌우·위아래에 여백이 남아도 함께 어둡게 하려고 크게 펼친다.
        LessonFrame의 콘텐츠 영역(overflow-hidden)에서 잘리므로 사이드바 쪽으로는 넘어가지 않는다.
      */}
      <div aria-hidden className="absolute -inset-[4000px] animate-fade-in bg-[rgba(36,54,75,0.12)]" onClick={onContinue} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="absolute animate-pop-in rounded-[28px] bg-[#FFFDF7] shadow-[0_20px_50px_rgba(90,62,46,0.12)]"
        style={{
          left: (1104 - DIALOG.width) / 2,
          top: (900 - DIALOG.height) / 2,
          width: DIALOG.width,
          height: DIALOG.height,
        }}
      >
        <Image src="/study/drawing/fox-surprised.png" alt="" width={120} height={110} className="absolute top-0 left-[243px] h-[110px] w-[120px] object-cover" />

        <h2 id={titleId} className="absolute inset-x-0 top-[114px] text-center text-[40px] leading-[48px] font-bold text-black">
          훌륭한 그림 실력을 가졌구나!
        </h2>
        <p id={descriptionId} className="absolute inset-x-0 top-[202px] text-center text-[22px] leading-[30px] text-black">
          조금만 더 그려볼래?
        </p>

        <button
          ref={continueButtonRef}
          type="button"
          onClick={onContinue}
          className="absolute top-[284px] left-[27px] h-[100px] w-[256px] cursor-pointer rounded-full bg-[#F4ECDF] text-[30px] font-bold text-[#5C5149] transition hover:brightness-[0.98] active:scale-[0.98]"
        >
          더 그릴래요
        </button>
        <button
          type="button"
          onClick={onFinish}
          className="absolute top-[284px] left-[323px] h-[100px] w-[256px] cursor-pointer rounded-full bg-[#D9621C] text-[30px] font-bold text-white transition hover:brightness-105 active:scale-[0.98]"
        >
          다 했어요
        </button>
      </div>
    </div>
  );
}
