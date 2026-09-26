"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ensureRoundTheme, useRoundTheme } from "@/lib/bookDraft";

// 시안 그림(public/study/intro/book-intro.webp, abc 시안에서 문구·책·버튼을 지운 것) 크기.
// 선명하게 보이도록 1.5배로 키워 저장했지만 좌표는 시안(1672×941) 기준이다. 문구·제목·버튼은 이 좌표에 붙인다.
const INTRO_WIDTH = 1672;
const INTRO_HEIGHT = 941;
/** "오늘 읽을 책은?" 문구 가운데 (양옆 노란 반짝이는 그림에 남아 있다) */
const HEADING = { x: 839, y: 189 };
/** 책(책등 포함)이 보이는 가로 자리와 바닥. 버튼을 책과 같은 폭·같은 가운데로 맞춘다. */
const BOOK = { x: 764, width: 353, bottom: 663 };
// 책장 표지 그림(public/library/book-<theme>.png, 537×613)은 둘레 5px이 투명 여백이다.
// 보이는 부분(527×602)이 시안 책 자리에 꼭 맞도록 그림 전체 크기와 위치를 정한다.
const COVER_SCALE = BOOK.width / 527;
const COVER = {
  x: BOOK.x - 5 * COVER_SCALE,
  y: BOOK.bottom - 607 * COVER_SCALE,
  width: 537 * COVER_SCALE,
  height: 613 * COVER_SCALE,
};
/** 표지 안쪽 칸 가운데의 책 제목 자리 (표지 그림 기준 %) */
const TITLE = { left: "52.7%", top: "46%", maxWidth: 250 };
/** 학습하러 가기 버튼 자리. 가로는 책에 맞추고 세로는 시안 그대로 둔다. */
const BUTTON = { x: BOOK.x, y: 698, width: BOOK.width, height: 96 };

/** 출발 애니메이션: 책가방에 책을 챙기고(pack) 메고 걸어간다(walk) */
const LOADING_FRAMES = [
  { src: "/study/intro/fox-pack-1.webp", ms: 700 },
  { src: "/study/intro/fox-pack-2.webp", ms: 600 },
  { src: "/study/intro/fox-pack-3.webp", ms: 600 },
  { src: "/study/intro/fox-pack-4.webp", ms: 700 },
  { src: "/study/intro/fox-walk-1.webp", ms: 350 },
  { src: "/study/intro/fox-walk-2.webp", ms: 350 },
  { src: "/study/intro/fox-walk-1.webp", ms: 350 },
  { src: "/study/intro/fox-walk-2.webp", ms: 350 },
];
const FRAME_SOURCES = [...new Set(LOADING_FRAMES.map((frame) => frame.src))];
const LOADING_MS = LOADING_FRAMES.reduce((sum, frame) => sum + frame.ms, 0);
/** 걷기 그림부터는 문구를 "출발!"로 바꾼다 */
const FIRST_WALK_FRAME = LOADING_FRAMES.findIndex((frame) => frame.src.includes("walk"));
/** 애니메이션이 끝나고 로딩 화면이 걷히며 학습 지도가 드러나는 시간 */
const REVEAL_MS = 500;

/**
 * intro   — "오늘 읽을 책은?" 화면. 학습하러 가기 버튼을 기다린다
 * loading — 베이지 화면에서 여울이가 책가방을 챙겨 출발한다
 * reveal  — 로딩 화면이 걷히며 뒤에 있던 학습 지도가 보인다
 */
type Phase = "intro" | "loading" | "reveal";

/** 시안 px을 그림 상자 폭 기준 길이로 바꾼다 (그림 상자가 container라서 cqw가 그림 폭을 따른다) */
const artPx = (value: number) => `calc(${value} / ${INTRO_WIDTH} * 100cqw)`;
/** 시안 좌표를 그림 상자 안의 % 위치로 바꾼다 */
const artX = (x: number) => `${(x / INTRO_WIDTH) * 100}%`;
const artY = (y: number) => `${(y / INTRO_HEIGHT) * 100}%`;

/** 학습 지도 위에 덮어 보여 주는 책 소개와 출발 애니메이션. 다 끝나면 onDone을 부른다. */
export default function BookIntro({ title, onDone }: { title: string; onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [frame, setFrame] = useState(0);
  // 이번에 받을 책 표지 색을 여기서 정해 두고, 4단계에서 책을 만들 때 같은 색을 쓴다.
  const theme = useRoundTheme();
  useEffect(ensureRoundTheme, []);

  useEffect(() => {
    if (phase !== "loading") return;
    const timer = window.setTimeout(() => {
      if (frame < LOADING_FRAMES.length - 1) setFrame(frame + 1);
      else setPhase("reveal");
    }, LOADING_FRAMES[frame].ms);
    return () => window.clearTimeout(timer);
  }, [phase, frame]);

  useEffect(() => {
    if (phase !== "reveal") return;
    const timer = window.setTimeout(onDone, REVEAL_MS);
    return () => window.clearTimeout(timer);
  }, [phase, onDone]);

  return (
    <div className="absolute inset-0 z-20 overflow-hidden [container-type:size]">
      {phase === "intro" && (
        <div className="absolute inset-0 bg-[#F6EBDD]">
          {/* 그림 상자: 화면을 꽉 채우도록(cover) 키우고 가운데에 둔다. 문구·제목·버튼은 이 상자 기준 %로 붙인다. */}
          <div
            className="absolute top-1/2 left-1/2 -translate-1/2 [container-type:size]"
            style={{
              width: `max(100cqw, calc(100cqh * ${INTRO_WIDTH} / ${INTRO_HEIGHT}))`,
              aspectRatio: `${INTRO_WIDTH} / ${INTRO_HEIGHT}`,
            }}
          >
            <Image
              src="/study/intro/book-intro.webp"
              alt=""
              fill
              sizes="100vw"
              preload
              // 기본 최적화(품질 75)로 다시 압축하면 글자·윤곽이 뭉개져서 준비해 둔 파일을 그대로 쓴다.
              unoptimized
              className="select-none"
              draggable={false}
            />
            {/* 학습 지도 말풍선과 같은 글씨(그리운 코코초이툰) */}
            <h2
              className="absolute -translate-1/2 font-cocochoi leading-none whitespace-nowrap text-[#4A3426]"
              style={{ left: artX(HEADING.x), top: artY(HEADING.y), fontSize: artPx(72) }}
            >
              오늘 읽을 <span className="text-[#E07A2E]">책</span>은?
            </h2>
            {/* 이번에 받을 색의 책. 색을 정하기 전(첫 화면)에는 비워 두었다가 살짝 나타난다. */}
            {theme && (
              <div
                className="absolute animate-fade-in"
                style={{
                  left: artX(COVER.x),
                  top: artY(COVER.y),
                  width: artPx(COVER.width),
                  height: artPx(COVER.height),
                  filter: `drop-shadow(${artPx(8)} ${artPx(6)} ${artPx(8)} rgba(90,60,30,0.25))`,
                }}
              >
                <Image src={`/library/book-${theme}.png`} alt="" fill sizes="40vw" preload className="select-none" draggable={false} />
                <p
                  className="absolute -translate-1/2 text-center font-display leading-tight break-keep text-[#4A3426]"
                  style={{ left: TITLE.left, top: TITLE.top, width: artPx(TITLE.maxWidth), fontSize: artPx(34) }}
                >
                  {title}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => setPhase("loading")}
              className="absolute flex cursor-pointer items-center justify-center rounded-full bg-[linear-gradient(180deg,#EA8B4B_0%,#D9722F_55%,#C4602A_100%)] font-display text-white shadow-[inset_0_0.25cqh_0_rgba(255,255,255,0.3),inset_0_-0.8cqh_0_rgba(140,60,20,0.3),0_1.2cqh_2cqh_rgba(150,80,30,0.3)] transition-transform [text-shadow:0_0.2cqh_0_rgba(140,60,20,0.35)] hover:-translate-y-[0.4cqh] active:translate-y-[0.4cqh]"
              style={{
                left: artX(BUTTON.x),
                top: artY(BUTTON.y),
                width: artPx(BUTTON.width),
                height: artPx(BUTTON.height),
                gap: artPx(12),
                fontSize: artPx(36),
              }}
            >
              학습하러 가기
              <svg viewBox="0 0 24 24" aria-hidden style={{ width: artPx(30), height: artPx(30) }}>
                <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {phase !== "intro" && (
        <div
          role="status"
          aria-label="학습 지도로 가는 중"
          className={`absolute inset-0 flex animate-fade-in flex-col items-center justify-center bg-[#F7EEDF] transition-opacity ${
            phase === "reveal" ? "opacity-0" : "opacity-100"
          }`}
          style={{ transitionDuration: `${REVEAL_MS}ms` }}
        >
          <div className="relative aspect-square h-[58%]">
            {/* 밝은 바탕에서 여울이가 떠 보이지 않게 발밑에 옅은 그림자를 깐다 */}
            <div className="absolute bottom-[6%] left-1/2 h-[6%] w-[48%] -translate-x-1/2 rounded-[50%] bg-[#8A6A4F]/20 blur-[6px]" />
            {FRAME_SOURCES.map((src) => (
              <Image
                key={src}
                src={src}
                alt=""
                fill
                sizes="60vh"
                preload
                className={`select-none object-contain transition-opacity duration-200 ${
                  LOADING_FRAMES[frame].src === src ? "opacity-100" : "opacity-0"
                }`}
                draggable={false}
              />
            ))}
          </div>
          <p className="mt-[2vh] font-display text-[3.4vh] text-[#4A3426]">
            {frame < FIRST_WALK_FRAME ? (
              <>
                책가방을 챙기고 있어요
                <span aria-hidden>
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="animate-loading-dot" style={{ animationDelay: `${i * 0.2}s` }}>
                      .
                    </span>
                  ))}
                </span>
              </>
            ) : (
              "출발!"
            )}
          </p>
          <div className="mt-[2vh] h-[1.4vh] w-[28vh] overflow-hidden rounded-full bg-[#4A3426]/10">
            <div
              className="h-full animate-loading-fill rounded-full bg-[#EA8B4B]"
              style={{ animationDuration: `${LOADING_MS}ms` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
