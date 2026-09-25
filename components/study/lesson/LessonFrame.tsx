"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import SideNav, { useSideNavWidth } from "@/components/nav/SideNav";
import { useElementSize } from "@/components/stage/Anchor";

// 학습 단계 페이지 시안(1200×900)에서 사이드바(96)를 뺀 콘텐츠 캔버스
export const CANVAS_WIDTH = 1104;
export const CANVAS_HEIGHT = 900;

type LessonFrameProps = {
  title: string;
  /** true면 위쪽 제목을 화면에서 숨긴다 (스크린 리더에는 그대로 읽힌다). "나가기"는 그대로 남는다. */
  hideTitle?: boolean;
  /** 진행 막대 (현재 번호는 1부터) */
  progress?: { current: number; total: number };
  children: ReactNode;
};

/**
 * 학습 단계 페이지 공통 틀. 사이드바는 그대로 두고, 오른쪽 콘텐츠는 시안 캔버스를 화면에 맞춰 통째로 확대/축소한다.
 * 위쪽에 "나가기"(학습 지도로 돌아가기), 제목, 진행 막대가 있다.
 */
export default function LessonFrame({ title, hideTitle = false, progress, children }: LessonFrameProps) {
  const sideNavWidth = useSideNavWidth();
  const [areaRef, areaSize] = useElementSize<HTMLDivElement>();
  const scale = areaSize ? Math.min(areaSize.height / CANVAS_HEIGHT, areaSize.width / CANVAS_WIDTH) : 0;

  return (
    <main className="relative h-screen w-full overflow-hidden bg-[#FFFDF7] font-kr">
      <SideNav />
      <div ref={areaRef} className="absolute inset-y-0 right-0 overflow-hidden" style={{ left: sideNavWidth }}>
        {scale > 0 && (
          <div
            className="absolute top-0 left-1/2"
            style={{
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
              transform: `translateX(-50%) scale(${scale})`,
              transformOrigin: "top center",
            }}
          >
            <header className="absolute inset-x-0 top-0 h-[104px]">
              <Link
                href="/study"
                className="absolute top-[32px] left-[34px] flex h-[32px] items-center gap-[8px] rounded-full px-[12px] text-[20px] font-medium text-[#5C5149] transition hover:bg-[#F4ECDF]"
              >
                <svg viewBox="0 0 24 24" aria-hidden className="size-[20px]" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 5l-7 7 7 7" />
                </svg>
                나가기
              </Link>
              <h1
                className={
                  hideTitle ? "sr-only" : "absolute top-[38px] left-1/2 -translate-x-1/2 text-[26px] leading-[36px] font-bold text-[#2B2420]"
                }
              >
                {title}
              </h1>
              {progress && (
                <div
                  className="absolute top-[46px] right-[22px] flex items-center gap-[12px]"
                  role="progressbar"
                  aria-valuemin={1}
                  aria-valuemax={progress.total}
                  aria-valuenow={progress.current}
                  aria-label="진행"
                >
                  <span className="text-[15px] font-bold text-[#5C5149]">
                    {progress.current} / {progress.total}
                  </span>
                  <span className="flex gap-[4px]">
                    {Array.from({ length: progress.total }, (_, i) => (
                      <span
                        key={i}
                        className={`h-[8px] w-[28px] rounded-full transition-colors duration-500 ${
                          i < progress.current ? "bg-[#D9621C]" : "bg-[#EDE4D5]"
                        }`}
                      />
                    ))}
                  </span>
                </div>
              )}
            </header>
            {children}
          </div>
        )}
      </div>
    </main>
  );
}
