"use client";

import { useEffect, useId, useRef } from "react";
import { PillButton } from "./StudyParts";

/**
 * 발판에 도착하면 열리는 학습창. 시안의 어두운 배경("검배") 위에 뜬다.
 * scale은 시안(1340×1024) 대비 화면 배율이다.
 */
export default function LessonWindow({ stage, scale, onComplete }: { stage: number; scale: number; onComplete: () => void }) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  return (
    <div className="absolute inset-0 z-40 flex animate-fade-in items-center justify-center bg-[#151515]/70">
      <div style={{ transform: `scale(${scale})` }}>
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className="flex h-[760px] w-[1080px] animate-pop-in flex-col items-center rounded-[36px] border-4 border-[#E9D6BD] bg-[#FFFDF8] px-[64px] pt-[48px] pb-[52px] shadow-[0_24px_60px_rgba(0,0,0,0.3)] outline-none"
        >
          <p className="font-display text-[26px] text-[#E87B3D]">{stage}단계</p>
          <h2 id={titleId} className="mt-[4px] font-display text-[44px] leading-[52px] text-[#8B6650]">
            동화 읽기
          </h2>

          {/* TODO: 실제 학습 내용(동화 읽기·문제 등)이 정해지면 이 자리에 넣는다. */}
          <div className="mt-[32px] flex w-full flex-1 items-center justify-center rounded-[24px] bg-[#F6EFE4] text-[22px] text-[#9A7C5C]">
            학습 내용이 들어갈 자리예요
          </div>

          <div className="mt-[36px]">
            <PillButton onClick={onComplete}>학습 완료</PillButton>
          </div>
        </div>
      </div>
    </div>
  );
}
