"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";
import { addStamps, rollTreasureStamps } from "@/lib/stamps";
import { resetStudyProgress } from "@/lib/studyProgress";
import { VIEW_HEIGHT, VIEW_WIDTH } from "./studyMap";
import { Fox, NextArrow, PillButton, SpeechBubble } from "./StudyParts";

/**
 * closed  — 보물상자가 반짝이며 눌러 주기를 기다린다
 * opening — 상자를 눌러 덜컹덜컹 흔들리는 중
 * reward  — 번쩍! 스탬프가 쾅 찍히고 결과가 뜬다
 */
type Phase = "closed" | "opening" | "reward";

type ConfettiPiece = { dx: number; dy: number; rot: number; color: string; width: number; height: number; delay: number };

// 시안 "마지막" 화면(1340×1024)에서 보물상자가 있는 자리
const CHEST = { x: 740, y: 470, width: 540, height: 380 };
const CONFETTI_COLORS = ["#FFD84D", "#FF8A65", "#9AEB19", "#6EC6FF", "#F48FB1", "#FFFFFF"];
/** 상자가 흔들리는 시간 (흔들기 애니메이션 2번) */
const OPENING_MS = 900;
/** 2개일 때 두 번째 스탬프가 찍히는 시각 */
const SECOND_STAMP_DELAY = 1500;

function makeConfetti(count: number, delay: number): ConfettiPiece[] {
  return Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 260 + Math.random() * 420;
    return {
      dx: Math.cos(angle) * distance,
      // 위로 더 많이 튀고 아래로는 덜 떨어지게
      dy: Math.sin(angle) * distance * 0.8 + 120,
      rot: (Math.random() - 0.5) * 900,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      width: 10 + Math.random() * 10,
      height: 16 + Math.random() * 14,
      delay: delay + Math.random() * 120,
    };
  });
}

/**
 * 마지막 보물상자 장면 (시안 "마지막"). 시안 화면(1340×1024)을 가운데 두고,
 * 화면이 더 넓으면 양옆은 장면 그림이 이어서 채운다. 상자를 누르면 스탬프 1개(가끔 2개)가 나온다.
 */
export default function TreasureScene({ scale, viewWidth }: { scale: number; viewWidth: number }) {
  const [phase, setPhase] = useState<Phase>("closed");
  const [reward, setReward] = useState<{ count: 1 | 2; confetti: ConfettiPiece[] } | null>(null);
  const left = (viewWidth - VIEW_WIDTH) / 2;

  useEffect(() => {
    if (phase !== "opening") return;
    const timer = window.setTimeout(() => setPhase("reward"), OPENING_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  function openChest() {
    if (phase !== "closed") return;
    const count = rollTreasureStamps();
    // 애니메이션 도중에 나가도 받은 스탬프는 남도록 누르는 순간 저장한다.
    addStamps(count);
    // 한 바퀴를 끝냈으니 다음에 학습 지도에 오면 1단계부터 다시 시작한다.
    resetStudyProgress();
    setReward({
      count,
      confetti: [
        ...makeConfetti(40, 250),
        ...(count === 2 ? makeConfetti(60, SECOND_STAMP_DELAY + 50) : []),
      ],
    });
    setPhase("opening");
  }

  return (
    <div className="absolute inset-0 z-20 animate-fade-in overflow-hidden bg-[#CFE9F5]">
      <div
        className={`absolute inset-0 ${phase === "opening" ? "animate-shake" : ""}`}
        style={phase === "opening" ? { animationIterationCount: 2 } : undefined}
      >
        <div
          className="absolute top-0 left-0"
          style={{
            width: VIEW_WIDTH,
            height: VIEW_HEIGHT,
            transform: `scale(${scale}) translateX(${left}px)`,
            transformOrigin: "0 0",
          }}
        >
          <Image
            src="/study/treasure.png"
            alt=""
            width={1892}
            height={1153}
            preload
            className="absolute max-w-none select-none"
            style={{ left: -360, top: -13, width: 1892, height: 1153 }}
            draggable={false}
          />

          {/* 상자에서 새어 나오는 빛. 누르면 확 밝아진다. */}
          <div
            className={`pointer-events-none absolute rounded-full bg-[radial-gradient(closest-side,rgba(255,236,150,0.95),rgba(255,236,150,0))] transition-transform duration-700 ${
              phase === "closed" ? "animate-pad-pulse" : "scale-[2.2]"
            }`}
            style={{ left: CHEST.x + CHEST.width / 2 - 300, top: CHEST.y + CHEST.height / 2 - 260, width: 600, height: 480 }}
          />

          <Fox x={270} y={860} height={500} pose="jump" className="pointer-events-none" />
          {phase === "closed" && <SpeechBubble x={360} y={450}>야호! 보물상자를 찾았어!</SpeechBubble>}

          {phase === "closed" && (
            <button
              type="button"
              aria-label="보물상자 열기"
              onClick={openChest}
              className="absolute cursor-pointer rounded-[40px] transition-transform hover:scale-[1.03] active:scale-95"
              style={{ left: CHEST.x, top: CHEST.y, width: CHEST.width, height: CHEST.height }}
            >
              <NextArrow />
            </button>
          )}
        </div>
      </div>

      {phase === "reward" && reward && <RewardReveal count={reward.count} confetti={reward.confetti} scale={scale} />}
    </div>
  );
}

function RewardReveal({ count, confetti, scale }: { count: 1 | 2; confetti: ConfettiPiece[]; scale: number }) {
  const isDouble = count === 2;
  const titleDelay = isDouble ? SECOND_STAMP_DELAY + 500 : 900;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center" role="status">
      <div className="absolute inset-0 animate-fade-in bg-[#2A1C12]/70" />
      {/* 번쩍! */}
      <div className="pointer-events-none absolute inset-0 z-10 animate-flash bg-white" />

      {/* 두 번째 스탬프가 찍힐 때 한 번 더 쿵 흔들린다. 흔들기(transform)와 배율이 겹치지 않게 감싼다. */}
      <div
        className={isDouble ? "animate-shake" : ""}
        style={isDouble ? { animationDelay: `${SECOND_STAMP_DELAY + 120}ms` } : undefined}
      >
        <div className="relative flex flex-col items-center" style={{ transform: `scale(${scale})` }}>
          {/* 뒤에서 빙글빙글 도는 빛줄기 */}
          <div className="pointer-events-none absolute top-1/2 left-1/2 size-[1100px] -translate-x-1/2 -translate-y-[58%]">
            <div
              className="size-full animate-spin-slow rounded-full opacity-70"
              style={{
                background: "repeating-conic-gradient(rgba(255,221,110,0.55) 0deg 9deg, rgba(255,221,110,0) 9deg 22deg)",
                maskImage: "radial-gradient(closest-side, black 20%, transparent 100%)",
              }}
            />
          </div>

          {/* 색종이 */}
          <div className="pointer-events-none absolute top-[150px] left-1/2">
            {confetti.map((piece, i) => (
              <span
                key={i}
                className="absolute block animate-confetti rounded-[3px]"
                style={
                  {
                    width: piece.width,
                    height: piece.height,
                    background: piece.color,
                    animationDelay: `${piece.delay}ms`,
                    "--dx": `${piece.dx}px`,
                    "--dy": `${piece.dy}px`,
                    "--rot": `${piece.rot}deg`,
                  } as CSSProperties
                }
              />
            ))}
          </div>

          <div className="relative flex gap-[40px]">
            <RewardStamp delay={300} rotate={-8} />
            {isDouble && <RewardStamp delay={SECOND_STAMP_DELAY} rotate={9} badge />}
          </div>

          <p
            className="relative mt-[36px] animate-pop-in font-display text-[64px] leading-[76px] text-[#FFE27A] [text-shadow:0_4px_0_#B8651E,0_8px_18px_rgba(0,0,0,0.35)]"
            style={{ animationDelay: `${titleDelay}ms` }}
          >
            {isDouble ? "대박! 스탬프 2개!" : "스탬프 1개 획득!"}
          </p>
          <p
            className="relative mt-[6px] animate-pop-in font-cocochoi text-[32px] text-white"
            style={{ animationDelay: `${titleDelay + 150}ms` }}
          >
            {isDouble ? "행운의 보물상자였어!" : "스탬프 판에 쾅 찍어 뒀어!"}
          </p>

          <div className="relative mt-[40px] flex animate-pop-in gap-[20px]" style={{ animationDelay: `${titleDelay + 500}ms` }}>
            <PillButton href="/stamp">스탬프 보러 가기</PillButton>
            <PillButton href="/home">홈으로</PillButton>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 위에서 쾅 찍히는 발자국 스탬프 (스탬프 화면과 같은 그림) */
function RewardStamp({ delay, rotate, badge = false }: { delay: number; rotate: number; badge?: boolean }) {
  return (
    <div className="relative size-[240px]" style={{ rotate: `${rotate}deg` }}>
      <div className="size-full animate-stamp" style={{ animationDelay: `${delay}ms` }}>
        <div className="absolute inset-[7%] rounded-full bg-[#FCFDFD]" />
        <Image src="/stamp/paw-stamped.png" alt="" fill sizes="240px" />
      </div>
      {badge && (
        <span
          className="absolute -top-[18px] -right-[22px] flex size-[84px] animate-pop-in items-center justify-center rounded-full bg-[#FF7043] font-display text-[36px] text-white shadow-[0_6px_14px_rgba(0,0,0,0.3)] ring-4 ring-white"
          style={{ animationDelay: `${delay + 350}ms`, rotate: `${-rotate}deg` }}
        >
          ×2
        </span>
      )}
    </div>
  );
}
