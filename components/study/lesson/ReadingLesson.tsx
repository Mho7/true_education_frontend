"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { errorMessage, isApiError } from "@/lib/api/client";
import { getReading, saveReadingPage } from "@/lib/api/learning";
import { TTS_ENABLED } from "@/lib/api/tts";
import type { ReadingLine, ReadingResponse } from "@/lib/api/types";
import { LESSON_COUNT } from "@/lib/studyLessons";
import { completeLesson } from "@/lib/studyProgress";
import LessonFrame from "./LessonFrame";
import { listen, speak, speakLine, stopSpeaking } from "./speech";

/**
 * intro     — 문장을 먼저 보여 주고 "시작할게요"를 기다린다
 * yeowli    — 여울이 차례: 여울이가 지금 문장을 읽고 나면 다음 문장으로
 * yourTurn  — 아이 차례: "읽어볼게요"를 누르면 듣기 시작 (스피커로 여울이 목소리 도움 받기)
 * listening — 아이가 읽는 소리를 듣는 중. 버튼을 누르면 다 읽은 것으로 한다
 * praise    — "잘했어!" 후 다음 문장으로
 * saving    — 쪽을 다 읽어 서버에 저장하는 중
 * saveError — 저장하지 못했다. "다시 보내기"를 기다린다
 * finished  — 책을 끝까지 읽었다(서버 단계가 READING을 지났다). "완료하기"를 누르면 학습 지도로 돌아간다
 *
 * 번갈아 읽기: 누가 읽을지는 서버가 줄마다 정해 준다(speaker, 여울이 먼저 한 줄씩 번갈아).
 * 쪽을 넘길 때마다 그 쪽에서 아이가 읽은 줄의 시간을 저장한다. 앞 문장·앞 쪽으로 돌아가는 것은 자유롭다.
 */
type Phase = "intro" | "yeowli" | "yourTurn" | "listening" | "praise" | "saving" | "saveError" | "finished";

/** page는 reading.pages의 번호(0부터), 화면·API의 쪽 번호는 pages[page].page */
type Position = { page: number; line: number };

// 시안(번갈아읽기_1~6) 캔버스 좌표. 지금 문장은 늘 첫 줄 자리에 오고, 같은 쪽의 다음 문장들이 아래에 이어진다.
const COLUMN = { left: 143, top: 283, width: 816, maxHeight: 460 };
const VISIBLE_LINES = 3;
/** 여울이가 읽고 나서 아이 차례로 넘어가기 전 잠깐 쉬는 시간 */
const TURN_PAUSE_MS = 400;
/** "잘했어!"를 보여 주는 시간 */
const PRAISE_MS = 1300;

const isFinished = (reading: ReadingResponse) => reading.savedPages >= reading.totalPages;

/** 이어 읽을 자리: savedPages + 1 쪽의 첫 줄. 다 읽었으면 마지막 줄 */
function resumePosition(reading: ReadingResponse): Position {
  const { pages } = reading;
  if (isFinished(reading)) {
    const last = pages.length - 1;
    return { page: last, line: Math.max(pages[last].lines.length - 1, 0) };
  }
  const index = pages.findIndex((page) => page.page === reading.savedPages + 1);
  return { page: index === -1 ? 0 : index, line: 0 };
}

/** 다음 문장 자리. 책이 끝났으면 null */
function nextPosition(reading: ReadingResponse, { page, line }: Position): Position | null {
  if (line + 1 < reading.pages[page].lines.length) return { page, line: line + 1 };
  for (let p = page + 1; p < reading.pages.length; p++) {
    if (reading.pages[p].lines.length > 0) return { page: p, line: 0 };
  }
  return null;
}

/** 앞 문장 자리. 첫 문장이면 null */
function previousPosition(reading: ReadingResponse, { page, line }: Position): Position | null {
  if (line > 0) return { page, line: line - 1 };
  for (let p = page - 1; p >= 0; p--) {
    if (reading.pages[p].lines.length > 0) return { page: p, line: reading.pages[p].lines.length - 1 };
  }
  return null;
}

const turnPhase = (line: ReadingLine): Phase => (line.speaker === "YEOUL" ? "yeowli" : "yourTurn");

type ReadingLessonProps = {
  assignmentId: number;
  /** 여울이 차례 줄 음성(GET /books/{bookId}/lines/{lineId}/tts)에 쓴다 */
  bookId: number;
  bookTitle: string;
  /** GET /assignments/{id}/reading 응답 */
  reading: ReadingResponse;
};

export default function ReadingLesson({ assignmentId, bookId, bookTitle, reading: initialReading }: ReadingLessonProps) {
  const router = useRouter();
  const [reading, setReading] = useState(initialReading);
  const [position, setPosition] = useState<Position>(() => resumePosition(initialReading));
  const [phase, setPhase] = useState<Phase>(() => (isFinished(initialReading) ? "finished" : "intro"));
  /** 저장 실패·이어 읽기 안내 */
  const [notice, setNotice] = useState<string | null>(null);
  /** 저장에 실패한 쪽을 다시 보낼 때 쓴다 */
  const [pendingSave, setPendingSave] = useState<{ page: number; next: Position | null } | null>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);
  /** 아이 차례 줄 id → "읽어볼게요"부터 "다 읽었어요"까지 걸린 시간(ms) */
  const durationsRef = useRef(new Map<string, number>());
  const readStartRef = useRef(0);
  const page = reading.pages[position.page];
  const sentence = page.lines[position.line];

  function moveTo(target: Position) {
    setPosition(target);
    setPhase(turnPhase(reading.pages[target.page].lines[target.line]));
  }

  // 409(쪽을 건너뜀·읽기 단계가 이미 끝남): 서버에 저장된 곳을 다시 받아 그 자리로 옮긴다.
  async function resync() {
    try {
      const latest = await getReading(assignmentId);
      const resume = resumePosition(latest);
      setReading(latest);
      setPendingSave(null);
      setPosition(resume);
      if (isFinished(latest)) {
        setNotice(null);
        setPhase("finished");
        return;
      }
      setNotice(`저장된 곳에 맞춰 ${latest.pages[resume.page].page}쪽부터 이어서 읽을게요`);
      setPhase("intro");
    } catch (error) {
      setNotice(errorMessage(error));
      setPhase("saveError");
    }
  }

  // 쪽을 다 읽으면 그 쪽을 저장하고 다음 쪽(또는 완료)으로 넘어간다.
  async function savePage(pageIndex: number, next: Position | null) {
    const target = reading.pages[pageIndex];
    setPhase("saving");
    setNotice(null);
    const lines = target.lines
      .filter((line) => line.speaker === "STUDENT" && durationsRef.current.has(line.id))
      .map((line) => ({ lineId: line.id, durationMs: durationsRef.current.get(line.id) ?? 0 }));
    try {
      const result = await saveReadingPage(assignmentId, target.page, { lines });
      setPendingSave(null);
      setReading((prev) => ({ ...prev, savedPages: result.savedPages }));
      // 마지막 쪽을 저장하면 서버 단계가 QUESTION(문제가 없는 책이면 그다음 단계)으로 바뀐다.
      if (result.stage !== "READING") setPhase("finished");
      else if (next) moveTo(next);
      else void resync();
    } catch (error) {
      if (isApiError(error, 409)) {
        void resync();
        return;
      }
      setPendingSave({ page: pageIndex, next });
      setNotice(`저장하지 못했어요. ${errorMessage(error)}`);
      setPhase("saveError");
    }
  }

  // 다음 문장으로. 쪽이 바뀌거나 책이 끝나면 먼저 지금 쪽을 저장한다.
  const goNext = useEffectEvent(() => {
    const next = nextPosition(reading, position);
    if (next && next.page === position.page) moveTo(next);
    else void savePage(position.page, next);
  });

  const recordReadingTime = useEffectEvent(() => {
    durationsRef.current.set(sentence.id, Math.round(performance.now() - readStartRef.current));
  });

  // 페이지를 떠나면 여울이 목소리(도움 받기 포함)를 멈춘다.
  useEffect(() => stopSpeaking, []);

  // 여울이 차례: 다 읽으면 잠깐 쉬고 다음 문장으로
  useEffect(() => {
    if (phase !== "yeowli") return;
    let pause = 0;
    const stop = speakLine({ bookId, lineId: sentence.id, text: sentence.text }, () => {
      pause = window.setTimeout(() => goNext(), TURN_PAUSE_MS);
    });
    return () => {
      stop();
      window.clearTimeout(pause);
    };
  }, [phase, sentence, bookId]);

  // 아이 차례: 읽는 소리 듣기 → 끝나면 걸린 시간을 적고 칭찬
  useEffect(() => {
    if (phase !== "listening") return;
    const listening = listen(() => {
      recordReadingTime();
      setPhase("praise");
    });
    stopListeningRef.current = listening.done;
    return () => {
      stopListeningRef.current = null;
      listening.cancel();
    };
  }, [phase]);

  // 칭찬 → 다음 문장
  useEffect(() => {
    if (phase !== "praise") return;
    const timer = window.setTimeout(() => goNext(), PRAISE_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  function start() {
    setNotice(null);
    setPhase(turnPhase(sentence));
  }

  function startReading() {
    readStartRef.current = performance.now();
    setPhase("listening");
  }

  // 앞 문장으로 돌아가 다시 읽는다. 완료 화면에서는 마지막 문장으로 돌아간다.
  // 읽던 소리·듣기는 phase가 바뀌면서 정리된다. 저장하는 동안에는 돌아가지 않는다.
  const backTarget = phase === "saving" ? null : phase === "finished" ? position : previousPosition(reading, position);
  function goBack() {
    if (!backTarget) return;
    setNotice(null);
    setPendingSave(null);
    moveTo(backTarget);
  }

  function retrySave() {
    if (pendingSave) void savePage(pendingSave.page, pendingSave.next);
    else void resync();
  }

  function finish() {
    // TODO(#5 백엔드 패치): 학습 지도 진행 상태가 서버로 바뀌면 이 호출은 빠진다.
    completeLesson(1);
    router.push("/study");
  }

  const started = phase !== "intro";
  const foxHappy = phase === "intro" || phase === "yeowli" || phase === "praise" || phase === "saving" || phase === "finished";
  const visible = page.lines.slice(position.line, position.line + VISIBLE_LINES);

  return (
    // 위쪽 진행 막대는 학습 세션 4단계 중 몇 번째인지 보여 준다 (번갈아 읽기 = 1단계).
    <LessonFrame title="번갈아 읽기" progress={{ current: 1, total: LESSON_COUNT }}>
      {notice && (
        <p
          role="status"
          className="absolute inset-x-0 top-[214px] mx-auto w-fit animate-fade-in rounded-full bg-[#FFF4D9] px-[22px] py-[8px] text-[20px] font-bold break-keep text-[#8A5A2E]"
        >
          {notice}
        </p>
      )}

      {/*
        지금 문장부터 같은 쪽의 문장 몇 개. 문장이 길면 줄이 바뀌고 강조 띠도 함께 커진다.
        다음 문장으로 넘어가면 목록을 새로 그려 아래에서 위로 스르륵 올라오게 한다.
      */}
      {phase === "finished" ? (
        <div
          className="absolute flex animate-pop-in flex-col items-center justify-center rounded-[28px] bg-[#FFF4D9] text-center"
          style={{ left: COLUMN.left, top: COLUMN.top, width: COLUMN.width, height: 300 }}
        >
          <p className="text-[44px] leading-[56px] font-bold text-[#2B2420]">끝까지 함께 읽었어요!</p>
          <p className="mt-[14px] text-[26px] text-[#857B72]">
            여울이와 번갈아 『{bookTitle}』 한 권을 다 읽었어요
          </p>
        </div>
      ) : (
        <ol
          key={sentence.id}
          aria-label={`${page.page}쪽`}
          className={`absolute flex flex-col gap-[16px] overflow-hidden ${started ? "animate-line-up" : ""}`}
          style={{ left: COLUMN.left, top: COLUMN.top, width: COLUMN.width, maxHeight: COLUMN.maxHeight }}
        >
          {visible.map((line, i) => {
            const current = started && i === 0;
            return (
              <li
                key={line.id}
                aria-current={current ? "true" : undefined}
                className={`relative flex min-h-[86px] shrink-0 items-center rounded-[14px] py-[19px] pr-[28px] pl-[83px] text-[36px] leading-[48px] break-keep ${
                  current ? "bg-[#FFF4D9] font-bold text-[#2B2420]" : "text-[#857B72]"
                }`}
              >
                {current && <LineIcon phase={phase} onHelp={() => speak(sentence.text)} />}
                {line.text}
              </li>
            );
          })}
        </ol>
      )}

      {/* 여울이: 여울이가 읽을 때·칭찬할 때는 웃고, 아이 차례에는 귀 기울인다 */}
      <div className="pointer-events-none absolute" style={{ left: 766, top: 563, width: 296, height: 320 }}>
        <Image
          src="/study/reading/fox-happy.png"
          alt=""
          fill
          sizes="300px"
          preload
          className={`object-contain object-bottom transition-opacity duration-300 ${foxHappy ? "opacity-100" : "opacity-0"}`}
        />
        <Image
          src="/study/reading/fox-curious.png"
          alt=""
          fill
          sizes="300px"
          preload
          className={`object-contain object-bottom transition-opacity duration-300 ${foxHappy ? "opacity-0" : "opacity-100"}`}
        />
      </div>

      {started && backTarget && (
        <button
          type="button"
          onClick={goBack}
          aria-label="앞 문장으로 돌아가기"
          className="absolute top-[776px] left-[170px] flex h-[88px] cursor-pointer items-center gap-[8px] rounded-full bg-[#F4ECDF] pr-[30px] pl-[22px] text-[26px] font-bold text-[#5C5149] transition hover:bg-[#EDE2D1] active:scale-[0.97]"
        >
          <svg viewBox="0 0 24 24" aria-hidden className="size-[28px]" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
          이전
        </button>
      )}

      <div className="absolute top-[770px] left-1/2 -translate-x-1/2" aria-live="polite">
        <ActionButton
          phase={phase}
          onStart={start}
          onRead={startReading}
          onDone={() => stopListeningRef.current?.()}
          onFinish={finish}
          onRetry={retrySave}
        />
      </div>

      {/* Typecast 무료 요금제 조건: 서버 음성을 쓸 때 출처를 표기한다 */}
      {TTS_ENABLED && (
        <p className="absolute bottom-[14px] left-[34px] text-[14px] text-[#A89E94]">
          여울이 목소리 · Powered by{" "}
          <a href="https://typecast.ai" target="_blank" rel="noreferrer" className="underline hover:text-[#857B72]">
            Typecast
          </a>
        </p>
      )}
    </LessonFrame>
  );
}

/** 강조 띠 왼쪽 동그라미: 여울이가 읽는 중(소리 막대) · 아이 차례(여울이 목소리로 도움 받기) · 그 밖(흐린 스피커) */
function LineIcon({ phase, onHelp }: { phase: Phase; onHelp: () => void }) {
  // 문장이 길어 줄이 바뀌어도 첫 줄 옆에 붙어 있도록 위쪽에 맞춘다.
  const box = "absolute top-[16px] left-[17px] flex size-[54px] items-center justify-center rounded-full";
  if (phase === "yeowli") {
    return (
      <span className={`${box} bg-[#D9621C]`} aria-hidden>
        <SoundBars className="h-[22px] text-white" />
      </span>
    );
  }
  if (phase === "yourTurn") {
    return (
      <button
        type="button"
        onClick={onHelp}
        aria-label="어떻게 읽는지 여울이 목소리로 들어 보기"
        className={`${box} cursor-pointer border-[3px] border-[#D9621C] bg-white text-[#D9621C] transition hover:bg-[#FFF4D9] active:scale-95`}
      >
        <SpeakerIcon className="size-[26px]" />
      </button>
    );
  }
  return (
    <span className={`${box} border-[3px] border-[#E5DED4] bg-[#F2EEE8] text-[#B3AAA0]`} aria-hidden>
      <SpeakerIcon className="size-[26px]" />
    </span>
  );
}

const PILL = "flex h-[100px] items-center justify-center gap-[18px] rounded-full text-[30px] font-bold whitespace-nowrap";

function ActionButton({
  phase,
  onStart,
  onRead,
  onDone,
  onFinish,
  onRetry,
}: {
  phase: Phase;
  onStart: () => void;
  onRead: () => void;
  onDone: () => void;
  onFinish: () => void;
  onRetry: () => void;
}) {
  if (phase === "intro") {
    return (
      <button type="button" onClick={onStart} className={`${PILL} w-[420px] cursor-pointer bg-[#D9621C] text-white shadow-[0_8px_18px_rgba(217,98,28,0.3)] transition hover:brightness-105 active:scale-[0.98]`}>
        <svg viewBox="0 0 24 24" aria-hidden className="size-[28px]" fill="currentColor">
          <path d="M6 4l15 8-15 8z" />
        </svg>
        시작할게요
      </button>
    );
  }
  if (phase === "yeowli" || phase === "saving") {
    return (
      <div className={`${PILL} w-[445px] bg-[#F4ECDF] text-[#5C5149]`}>
        <span className="flex gap-[8px]" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-[14px] animate-bounce rounded-full bg-[#EDC3A5]" style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </span>
        {phase === "saving" ? "다음 쪽으로 넘어가요" : "여울이가 읽고 있어요"}
      </div>
    );
  }
  if (phase === "saveError") {
    return (
      <button type="button" onClick={onRetry} className={`${PILL} w-[420px] cursor-pointer bg-[#D9621C] text-white shadow-[0_8px_18px_rgba(217,98,28,0.3)] transition hover:brightness-105 active:scale-[0.98]`}>
        다시 보내기
      </button>
    );
  }
  if (phase === "yourTurn") {
    return (
      <button type="button" onClick={onRead} className={`${PILL} w-[420px] cursor-pointer bg-[#D9621C] text-white shadow-[0_8px_18px_rgba(217,98,28,0.3)] transition hover:brightness-105 active:scale-[0.98]`}>
        <MicIcon className="size-[34px]" />
        읽어볼게요
      </button>
    );
  }
  if (phase === "listening") {
    return (
      <button
        type="button"
        onClick={onDone}
        aria-label="듣고 있어요. 다 읽었으면 눌러 주세요"
        className={`${PILL} w-[420px] cursor-pointer border-[5px] border-[#D9621C] bg-white text-[#D9621C] transition active:scale-[0.98]`}
      >
        <span className="relative flex size-[56px] items-center justify-center rounded-full bg-[#D9621C] text-white">
          <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-[#D9621C]/40" />
          <MicIcon className="relative size-[28px]" />
        </span>
        듣고 있어요
      </button>
    );
  }
  if (phase === "finished") {
    return (
      <button type="button" onClick={onFinish} className={`${PILL} w-[420px] animate-pop-in cursor-pointer bg-[#D9621C] text-white shadow-[0_8px_18px_rgba(217,98,28,0.3)] transition hover:brightness-105 active:scale-[0.98]`}>
        <svg viewBox="0 0 24 24" aria-hidden className="size-[32px]" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
        완료하기
      </button>
    );
  }
  return (
    <div className={`${PILL} w-[420px] animate-pop-in bg-[#F4ECDF] text-[#5C5149]`}>
      <SoundBars className="h-[34px] text-[#D9621C]" />
      잘했어!
    </div>
  );
}

function SoundBars({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 22 22" aria-hidden className={className} fill="currentColor">
      <rect x="1" y="7" width="4" height="8" rx="2" />
      <rect x="9" y="4" width="4" height="14" rx="2" />
      <rect x="17" y="0" width="4" height="22" rx="2" />
    </svg>
  );
}

function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7" />
      <path d="M19 6a8.5 8.5 0 0 1 0 12" />
    </svg>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2.5" width="6" height="12" rx="3" fill="currentColor" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
      <path d="M12 17.5V21" />
    </svg>
  );
}
