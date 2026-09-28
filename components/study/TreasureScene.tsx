"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { DEFAULT_DRAFT_TITLE, readBookDraft, startBookDraft } from "@/lib/bookDraft";
import { markDailyStudyCompleted } from "@/lib/dailyStudy";
import { rollTreasureStamps, takeEarnedStamps } from "@/lib/stamps";
import { markTreasureFound, readTreasureState, resetStudyProgress, type TreasureState } from "@/lib/studyProgress";
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
/** 표지 그리기·설명하기를 끝내고 돌아왔을 때 상자가 저절로 열리기까지 */
const AUTO_OPEN_DELAY = 700;
/** 스탬프 결과 문구가 뜬 뒤 방금 꽂은 책을 보러 책장으로 넘어가기까지 */
const LIBRARY_DELAY = 3000;

/** 스탬프 결과 문구가 뜨는 시각 (2개면 두 번째 스탬프가 찍힌 뒤) */
function rewardTitleDelay(count: 1 | 2) {
  return count === 2 ? SECOND_STAMP_DELAY + 500 : 900;
}

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

type TreasureSceneProps = {
  scale: number;
  viewWidth: number;
  /** 다시 들어온 보물상자 상태. null이면 지도에서 막 달려와 처음 찾은 것이다. */
  resume: TreasureState | null;
  /** 상자를 여는 순간(진행 상태가 초기화되기 전에) 부른다 */
  onOpen: () => void;
};

/**
 * 마지막 보물상자 장면 (시안 "마지막"). 시안 화면(1340×1024)을 가운데 두고,
 * 화면이 더 넓으면 양옆은 장면 그림이 이어서 채운다. 상자를 열면 스탬프 1개(가끔 2개)가 나온다.
 *
 * 상자는 책 표지를 그리고 설명까지 끝내야 열린다.
 * - 처음 찾았을 때: "야호!" 뒤 상자를 누르면 표지 그리기 안내가 뜬다
 * - 그리다 말고 돌아왔을 때(found): 표지 그리기 안내를 바로 띄운다
 * - 다 만들고 돌아왔을 때(reward-pending): 잠깐 뒤 상자가 저절로 열린다
 */
export default function TreasureScene({ scale, viewWidth, resume, onOpen }: TreasureSceneProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("closed");
  const [reward, setReward] = useState<{ count: 1 | 2; confetti: ConfettiPiece[] } | null>(null);
  // 들어올 때의 상태로 화면 흐름을 정한다. 들어온 뒤 저장된 상태가 바뀌어도 흐름은 그대로다.
  const [entry] = useState(resume);
  const [drawingPromptOpen, setDrawingPromptOpen] = useState(entry === "found");
  const openedRef = useRef(false);
  const left = (viewWidth - VIEW_WIDTH) / 2;

  // 보물상자를 찾았다고 기억한다. 그리다 말고 나가도 다음에 학습 지도에 오면 여기로 돌아온다.
  useEffect(() => {
    markTreasureFound();
  }, []);

  useEffect(() => {
    if (phase !== "opening") return;
    const timer = window.setTimeout(() => setPhase("reward"), OPENING_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  const openChest = useCallback(() => {
    // 표지 그리기·설명하기를 끝낸 뒤에만 연다. 이미 열어 스탬프를 받았으면(상태가 지워짐) 다시 열지 않는다.
    if (openedRef.current || readTreasureState() !== "reward-pending") return;
    openedRef.current = true;
    onOpen();
    // 스탬프는 책을 완료할 때 서버가 이미 적립했다. 여기서는 서버가 정한 수(1~2개)를 보여 주기만 한다.
    const count = takeEarnedStamps() ?? rollTreasureStamps();
    // 스탬프를 받은 이 순간을 오늘 학습을 끝낸 때로 기록한다. 같은 날에는 다시 학습하러 들어올 수 없다.
    markDailyStudyCompleted();
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
  }, [onOpen]);

  // 스탬프를 받고 나면 방금 완성해 꽂은 책을 보러 책장으로 간다.
  useEffect(() => {
    if (phase !== "reward" || !reward) return;
    const timer = window.setTimeout(() => router.push("/library"), rewardTitleDelay(reward.count) + LIBRARY_DELAY);
    return () => window.clearTimeout(timer);
  }, [phase, reward, router]);

  // 다 만들고 돌아왔으면 "야호!"·지도 이동 없이 잠깐 뒤 바로 연다.
  useEffect(() => {
    if (entry !== "reward-pending" || phase !== "closed") return;
    const timer = window.setTimeout(openChest, AUTO_OPEN_DELAY);
    return () => window.clearTimeout(timer);
  }, [entry, phase, openChest]);

  function handleChestClick() {
    if (readTreasureState() === "reward-pending") openChest();
    else setDrawingPromptOpen(true);
  }

  function startDrawing() {
    // 초안이 사라졌으면(사이트 데이터 삭제 등) 그리기 화면에서 되돌아오지 않도록 기본 제목으로 새로 시작한다.
    if (!readBookDraft()) startBookDraft(DEFAULT_DRAFT_TITLE);
    router.push("/study/drawing");
  }

  return (
    <div className={`absolute inset-0 z-20 overflow-hidden bg-[#CFE9F5] ${entry ? "" : "animate-fade-in"}`}>
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
          {phase === "closed" && entry === null && <SpeechBubble x={360} y={450}>야호! 보물상자를 찾았어!</SpeechBubble>}

          {phase === "closed" && (
            <button
              type="button"
              aria-label="보물상자 열기"
              onClick={handleChestClick}
              className="absolute cursor-pointer rounded-[40px] transition-transform hover:scale-[1.03] active:scale-95"
              style={{ left: CHEST.x, top: CHEST.y, width: CHEST.width, height: CHEST.height }}
            >
              <NextArrow />
            </button>
          )}
        </div>
      </div>

      {phase === "closed" && drawingPromptOpen && <DrawingPrompt scale={scale} onStart={startDrawing} />}
      {phase === "reward" && reward && <RewardReveal count={reward.count} confetti={reward.confetti} scale={scale} />}
    </div>
  );
}

/** 보물상자를 열기 전에 책 표지를 그리러 가자고 안내한다. 뒤의 여울이와 보물상자가 희미하게 비친다. */
function DrawingPrompt({ scale, onStart }: { scale: number; onStart: () => void }) {
  const titleId = useId();
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="absolute inset-0 z-30 flex animate-[fade-in_320ms_ease-out_both] items-center justify-center bg-[rgba(20,25,30,0.65)] motion-reduce:animate-none"
    >
      <div className="flex flex-col items-center text-center" style={{ transform: `scale(${scale})` }}>
        <Image
          src="/study/drawing/painter-yeoul.png"
          alt=""
          width={300}
          height={277}
          className="animate-[rise-in_350ms_ease-out_both] select-none motion-reduce:animate-none"
          draggable={false}
        />
        <h2 id={titleId} className="mt-[36px] font-display text-[56px] leading-[68px] text-white">
          책이 거의 완성됐어!
        </h2>
        <p className="mt-[12px] font-cocochoi text-[32px] leading-[46px] text-white/90">
          이제 표지를 직접 그리면
          <br />
          보물상자를 열 수 있어!
        </p>
        <div className="mt-[40px]">
          <PillButton onClick={onStart}>그림 그리기 →</PillButton>
        </div>
      </div>
    </div>
  );
}

function RewardReveal({ count, confetti, scale }: { count: 1 | 2; confetti: ConfettiPiece[]; scale: number }) {
  const isDouble = count === 2;
  const titleDelay = rewardTitleDelay(count);

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
            {/* 잠시 뒤 저절로 책장으로 넘어간다. 기다리지 않고 바로 가도 된다. */}
            <PillButton href="/library">내 책장 보러 가기</PillButton>
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
