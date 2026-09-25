"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import BookCover, { BOOK_WIDTH } from "@/components/library/BookCover";
import { useSpeechTranscriber, type SpeechTranscriberError } from "@/hooks/useSpeechTranscriber";
import { clearBookDraft, updateBookDraft, type BookDraft, type BookExplanation } from "@/lib/bookDraft";
import { addCompletedBook } from "@/lib/bookshelf";
import { markTreasureRewardPending } from "@/lib/studyProgress";

/** 녹음은 최대 이만큼만 하고 저절로 멈춘다 (안전장치) */
export const MAX_RECORDING_MS = 120_000;

type ExplainState = "ready" | "recording" | "review";

// 시안 "Explain My Drawing" 좌표 (1104×900 콘텐츠 캔버스, 사이드바 제외. 시안 전체 화면 x에서 96을 뺀 값)
const BOOK = { left: 76, top: 180, width: 439.762 };
const BOOK_SCALE = BOOK.width / BOOK_WIDTH;
const COLUMN = { left: 592, width: 456 };
const ACTION_AREA_TOP = 549;
// 시안 표지 그림 칸 바탕색
const ART_BACKGROUND = "#FFFDF9";
const HINT_QUESTIONS = ["누가 나왔나요?", "무슨 일이 있었나요?", "왜 기억에 남았나요?"];

const ERROR_MESSAGES: Record<SpeechTranscriberError, string> = {
  unsupported: "이 브라우저에서는 음성 인식을 사용할 수 없어요.",
  insecure: "보안 연결(https)에서만 마이크를 사용할 수 있어요.",
  "not-allowed": "마이크 사용을 허용한 뒤 다시 시도해주세요.",
  "no-microphone": "마이크를 찾을 수 없어요. 마이크를 연결한 뒤 다시 시도해주세요.",
  network: "인터넷 연결을 확인한 뒤 다시 시도해주세요.",
  failed: "음성 인식을 시작하지 못했어요. 다시 시도해주세요.",
};

/** 0:07, 0:35, 1:02 */
function formatElapsed(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

type ExplainDrawingProps = {
  /** 그리기 화면에서 만든 초안 (제목·표지 색·날짜를 그대로 쓴다) */
  draft: BookDraft;
  /** 그리기 화면에서 저장한 표지 그림 */
  coverImage: string;
};

/**
 * 시안 "Explain My Drawing" 1-Ready 1(ready) / 2(recording) / 3(review).
 * - 왼쪽에 완성한 책 표지를 크게 보여 주고, 오른쪽에서 아이가 자기 그림을 말로 설명한다.
 * - 녹음 파일은 만들지 않고, 브라우저 음성 인식으로 받아 적은 글(transcript)과 말한 시간만 남긴다.
 */
export default function ExplainDrawing({ draft, coverImage }: ExplainDrawingProps) {
  const router = useRouter();
  const speech = useSpeechTranscriber();
  const { start: startListening, stop: stopListening } = speech;
  const saved = draft.explanation;

  const [state, setState] = useState<ExplainState>(saved ? "review" : "ready");
  /** 권한을 묻거나 음성 인식을 켜는 중 */
  const [preparing, setPreparing] = useState(false);
  /** 멈춘 뒤 마지막 글을 받는 중 */
  const [stopping, setStopping] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [result, setResult] = useState<BookExplanation | null>(saved ?? null);
  /** "완성하기"를 눌러 책장에 꽂고 학습 지도로 돌아가는 중 */
  const [finishing, setFinishing] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const finishingRef = useRef(false);

  const recordingStartRef = useRef(0);
  /** 녹음 시도 번호. 기다리는 사이 새로 시작하면 이전 시도의 결과는 버린다. */
  const attemptRef = useRef(0);

  // 녹음 중에 오류가 나면(권한 회수·네트워크 끊김 등) review로 넘기지 않고 ready로 돌아가 안내한다.
  const view: ExplainState = state === "recording" && speech.error ? "ready" : state;

  const startRecording = useCallback(async () => {
    const attempt = ++attemptRef.current;
    setResult(null);
    setElapsedMs(0);
    setState("ready");
    setPreparing(true);
    const ok = await startListening();
    if (attempt !== attemptRef.current) return;
    setPreparing(false);
    if (!ok) return;
    recordingStartRef.current = performance.now();
    setState("recording");
  }, [startListening]);

  const finishRecording = useCallback(async () => {
    const attempt = attemptRef.current;
    const durationMs = Math.min(performance.now() - recordingStartRef.current, MAX_RECORDING_MS);
    setElapsedMs(durationMs);
    setStopping(true);
    const transcript = await stopListening();
    if (attempt !== attemptRef.current) return;
    setStopping(false);
    setResult({ transcript: transcript.trim(), durationMs: Math.round(durationMs) });
    setState("review");
  }, [stopListening]);

  // 녹음 시간. 최대 시간이 되면 저절로 멈추고 review로 간다.
  useEffect(() => {
    if (view !== "recording" || stopping) return;
    const timer = window.setInterval(() => {
      const elapsed = performance.now() - recordingStartRef.current;
      if (elapsed >= MAX_RECORDING_MS) {
        window.clearInterval(timer);
        void finishRecording();
      } else {
        setElapsedMs(elapsed);
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [view, stopping, finishRecording]);

  /**
   * 책을 완성한다: 이야기를 초안에 남기고 → 책장에 꽂고(같은 초안 id는 한 번만) → 보물상자를 열 차례라고 기록한 뒤
   * → 초안을 지우고 학습 지도로 돌아간다. 스탬프는 학습 지도에서 보물상자를 열 때 받는다.
   */
  function complete() {
    if (!result?.transcript || finishingRef.current) return;
    finishingRef.current = true;
    setFinishing(true);
    updateBookDraft({ explanation: result });
    const book = addCompletedBook({ id: draft.id, title: draft.title, theme: draft.theme, coverImage, explanation: result });
    if (!book) {
      // 저장 공간이 모자라 책장에 못 꽂았다. 보물상자를 열 차례로 넘기지 않고 다시 시도할 수 있게 둔다.
      finishingRef.current = false;
      setFinishing(false);
      setSaveFailed(true);
      return;
    }
    markTreasureRewardPending();
    // 뒤로 가기로 다 만든 그리기 화면에 돌아오지 않도록 기록을 바꿔 치운다.
    router.replace("/study");
    clearBookDraft();
  }

  // 미지원은 누르기 전부터 알려 준다. 그 밖의 오류는 시도한 뒤에 알려 준다.
  const errorCode: SpeechTranscriberError | null = speech.supported ? speech.error : "unsupported";

  return (
    // 크기 없는 묶음이다. 화면 전체를 덮으면 LessonFrame의 "나가기"가 눌리지 않는다.
    <div className="animate-fade-in">
      <div className="absolute origin-top-left" style={{ left: BOOK.left, top: BOOK.top, transform: `scale(${BOOK_SCALE})` }}>
        <BookCover theme={draft.theme} title={draft.title} date={draft.startedAt} artBackground={ART_BACKGROUND} sizes="720px">
          <Image src={coverImage} alt="내가 그린 표지 그림" fill sizes="340px" className="object-contain" />
        </BookCover>
      </div>

      <div className="absolute top-0 h-full" style={{ left: COLUMN.left, width: COLUMN.width }}>
        <h2 className="absolute top-[199px] left-0 text-[28px] leading-[36px] font-bold tracking-[-0.02em] whitespace-nowrap text-[#3A2A20]">
          내 그림 이야기를 들려주세요
        </h2>
        <p className="absolute top-[266px] left-0 text-[22px] leading-[30px] font-bold text-[#3A2A20]">어떤 장면을 그렸나요?</p>
        <p className="absolute top-[307px] left-0 text-[16px] leading-[24px] text-[#7A6555]">왜 이 장면을 그리고 싶었는지도 이야기해보세요.</p>

        <section aria-label="이야기 힌트" className="absolute top-[353px] left-0 h-[170px] w-full rounded-[24px] bg-[#FBF3E8]">
          <p className="absolute top-[16px] left-[20px] text-[12px] leading-[16px] text-[#A08A76]">말이 잘 떠오르지 않으면</p>
          <ul className="absolute top-[37px] left-[19px]">
            {HINT_QUESTIONS.map((question) => (
              <li key={question} className="h-[40px] text-[19px] leading-[40px] text-[#7A5A44]">
                {question}
              </li>
            ))}
          </ul>
        </section>

        {view === "ready" && (
          <ReadyPanel
            preparing={preparing}
            disabled={!speech.supported}
            errorMessage={errorCode ? ERROR_MESSAGES[errorCode] : null}
            onStart={() => void startRecording()}
          />
        )}
        {view === "recording" && (
          <RecordingPanel elapsedMs={elapsedMs} stopping={stopping} onStop={() => void finishRecording()} />
        )}
        {view === "review" && (
          <ReviewPanel
            transcript={result?.transcript ?? ""}
            finishing={finishing}
            saveFailed={saveFailed}
            onRetry={() => void startRecording()}
            onComplete={complete}
          />
        )}
      </div>
    </div>
  );
}

function ReadyPanel({
  preparing,
  disabled,
  errorMessage,
  onStart,
}: {
  preparing: boolean;
  disabled: boolean;
  errorMessage: string | null;
  onStart: () => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onStart}
        disabled={disabled || preparing}
        aria-busy={preparing}
        className={`absolute left-0 flex h-[120px] w-full items-center justify-center gap-[22px] rounded-[24px] pr-[21px] text-[22px] font-bold transition ${
          disabled
            ? "cursor-default bg-[#EFE7DC] text-[#B6A897]"
            : preparing
              ? "cursor-progress bg-[#F07A2E] text-white opacity-80"
              : "cursor-pointer bg-[#F07A2E] text-white hover:brightness-105 active:scale-[0.99]"
        }`}
        style={{ top: ACTION_AREA_TOP }}
      >
        <MicIcon />
        {preparing ? "마이크를 켜고 있어요…" : "눌러서 이야기하기"}
      </button>
      <p
        role={errorMessage ? "alert" : undefined}
        className={`absolute top-[680px] left-0 w-full text-center text-[13px] leading-[20px] ${
          errorMessage ? "font-bold text-[#C9602C]" : "text-[#A08A76]"
        }`}
      >
        {errorMessage ?? "다 말하면 한 번 더 눌러주세요"}
      </p>
    </>
  );
}

function RecordingPanel({ elapsedMs, stopping, onStop }: { elapsedMs: number; stopping: boolean; onStop: () => void }) {
  return (
    <>
      <button
        type="button"
        onClick={onStop}
        disabled={stopping}
        aria-label={`듣고 있어요, ${formatElapsed(elapsedMs)}. 눌러서 멈추기`}
        className="absolute left-0 flex h-[120px] w-full cursor-pointer items-center justify-center rounded-[24px] border-2 border-[#F07A2E] bg-[#FFF1E6] pr-[12px] transition active:scale-[0.99] disabled:cursor-default"
        style={{ top: ACTION_AREA_TOP }}
      >
        <span aria-hidden className="relative flex size-[24px] items-center justify-center">
          <span className="absolute inset-0 animate-pulse rounded-full bg-[#E5484D]/18" />
          <span className="size-[14px] rounded-full bg-[#E5484D]" />
        </span>
        <span className="ml-[10px] text-[22px] font-bold text-[#C9602C]">듣고 있어요...</span>
        <span className="ml-[25px] text-[16px] font-bold text-[#D98A5A] tabular-nums">{formatElapsed(elapsedMs)}</span>
      </button>
      <p className="absolute top-[680px] left-0 w-full text-center text-[13px] leading-[20px] text-[#A08A76]">다 말했으면 눌러서 멈춰요</p>
    </>
  );
}

function ReviewPanel({
  transcript,
  finishing,
  saveFailed,
  onRetry,
  onComplete,
}: {
  transcript: string;
  finishing: boolean;
  saveFailed: boolean;
  onRetry: () => void;
  onComplete: () => void;
}) {
  const heard = transcript.length > 0;
  return (
    <>
      <p className="absolute top-[602px] left-[4px] text-[14px] leading-[20px] font-bold text-[#7A6555]">이렇게 이야기했어요</p>
      <div
        className="absolute top-[634px] left-0 h-[94px] w-full overflow-y-auto rounded-[17.5px] border border-[#E6D8C4] bg-white px-[22px] py-[16px] text-[17px] leading-[29px] break-keep"
        aria-live="polite"
      >
        {heard ? (
          <p className="text-[#3A2A20]">{transcript}</p>
        ) : (
          <p className="flex h-full items-center text-[#A08A76]">이야기를 잘 듣지 못했어요. 다시 말해볼까요?</p>
        )}
      </div>

      {saveFailed && (
        <p role="alert" className="absolute top-[815px] right-0 text-[13px] leading-[20px] font-bold text-[#C9602C]">
          책을 저장하지 못했어요. 다시 눌러주세요.
        </p>
      )}
      <div className="absolute top-[743px] right-0 flex items-center gap-[16px]">
        <button
          type="button"
          onClick={onRetry}
          disabled={finishing}
          className="flex h-[63px] w-[117px] cursor-pointer items-center justify-center gap-[6px] rounded-[15px] border border-[#E6D8C4] bg-white text-[15px] font-bold text-[#5A4334] transition hover:bg-[#FBF4EC] active:scale-[0.98] disabled:cursor-default disabled:opacity-50 disabled:active:scale-100"
        >
          <RetryIcon />
          다시 말하기
        </button>
        <button
          type="button"
          onClick={onComplete}
          disabled={!heard || finishing}
          className="h-[64px] w-[200px] cursor-pointer rounded-[18px] bg-[#F07A2E] text-[18px] font-bold text-white transition hover:brightness-105 active:scale-[0.98] disabled:cursor-default disabled:bg-[#EFE7DC] disabled:text-[#B6A897] disabled:hover:brightness-100 disabled:active:scale-100"
        >
          완성하기
        </button>
      </div>
    </>
  );
}

function MicIcon() {
  return (
    <svg viewBox="804 596 20 26" aria-hidden className="h-[26px] w-[20px] shrink-0" fill="none" stroke="currentColor" strokeWidth={2.375} strokeLinecap="round">
      <path d="M817.75 601.5C817.75 599.429 816.071 597.75 814 597.75C811.929 597.75 810.25 599.429 810.25 601.5V607.75C810.25 609.821 811.929 611.5 814 611.5C816.071 611.5 817.75 609.821 817.75 607.75V601.5Z" />
      <path d="M822.125 607.75C822.125 609.905 821.269 611.972 819.745 613.495C818.222 615.019 816.155 615.875 814 615.875C811.845 615.875 809.778 615.019 808.255 613.495C806.731 611.972 805.875 609.905 805.875 607.75M814 615.875V620.25" />
    </svg>
  );
}

function RetryIcon() {
  return (
    <svg viewBox="827.5 766.5 14.5 14.5" aria-hidden className="size-[14.5px] shrink-0" fill="none" stroke="currentColor" strokeWidth={1.98} strokeLinecap="round" strokeLinejoin="round">
      <path d="M829 773.995C828.998 775.303 829.449 776.572 830.276 777.585C831.103 778.599 832.256 779.295 833.538 779.555C834.821 779.815 836.153 779.623 837.31 779.012C838.467 778.401 839.376 777.408 839.884 776.202C840.392 774.996 840.466 773.652 840.095 772.397C839.724 771.142 838.93 770.055 837.848 769.319C836.766 768.584 835.463 768.246 834.159 768.362C832.856 768.479 831.634 769.043 830.699 769.959" />
      <path d="M829 768.332V771.518H832.186" />
    </svg>
  );
}
