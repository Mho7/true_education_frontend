"use client";

import Image from "next/image";
import { Fragment, useEffect, useEffectEvent, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { errorMessage } from "@/lib/api/client";
import { getShelfBook } from "@/lib/api/student";
import type { ReadingLine, ShelfBook } from "@/lib/api/types";
import type { BookTheme, CompletedBook } from "@/lib/bookshelf";
import { COVER_ART_ASPECT } from "@/lib/coverArt";
import { ATTEMPT_RESULT_STYLE, attemptResult, QUESTION_STAGE_LABELS, type AttemptResult } from "@/lib/shelfBook";

// 펼친 책 화면의 캔버스 좌표. 창 크기에 맞춰 통째로 키우고 줄인다.
const CANVAS = { width: 1480, height: 940 };
// 하드커버(표지 색 테두리) 안에 두 쪽이 나란히 펼쳐진다.
const COVER = { left: 122, top: 130, width: 1236, height: 776, padding: 18 };
const PAGE = { width: 600, height: COVER.height - COVER.padding * 2 };
// 책갈피(public/library/bookmark-yeoul.png, 478×705)는 오른쪽 쪽 위에서 윗부분(여울이 얼굴)만 삐죽 나온다.
const BOOKMARK = { width: 104, height: (104 * 705) / 478, right: 70, peek: 128 };
const FLIP_MS = 520;

// 표지 그림(book-<theme>.png)의 테두리 색과 맞춘 하드커버 색
const COVER_COLORS: Record<BookTheme, { base: string; dark: string }> = {
  blue: { base: "#8DBDF8", dark: "#5E9FE8" },
  green: { base: "#C3CA82", dark: "#A3AB5E" },
  pink: { base: "#EBB0A0", dark: "#D48C79" },
  purple: { base: "#B0A6F4", dark: "#8E83E0" },
  yellow: { base: "#F6C95A", dark: "#E4A92C" },
};

type Mode = "story" | "records";
type Leaf = { key: string; content: ReactNode };
type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "loaded"; book: ShelfBook };

function subscribeResize(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

/** 캔버스가 창 안에 다 들어가는 배율 */
function useCanvasScale() {
  return useSyncExternalStore(
    subscribeResize,
    () => Math.min(window.innerWidth / CANVAS.width, window.innerHeight / CANVAS.height),
    () => 1,
  );
}

type OpenBookProps = {
  /** 책장에서 누른 책. null이면 닫혀 있다 */
  book: CompletedBook | null;
  onClose: () => void;
};

/** 서재에서 책을 누르면 펼쳐지는 책. 좌우로 넘기며 다시 읽고, 오른쪽 위 책갈피를 누르면 학습 기록 쪽으로 바뀐다. */
export default function OpenBook({ book, onClose }: OpenBookProps) {
  if (!book) return null;
  return createPortal(<OpenBookDialog key={book.id} book={book} onClose={onClose} />, document.body);
}

function OpenBookDialog({ book, onClose }: { book: CompletedBook; onClose: () => void }) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const scale = useCanvasScale();
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [mode, setMode] = useState<Mode>("story");
  // 모드마다 보던 펼침 자리를 따로 기억한다 (기록을 보고 돌아와도 읽던 쪽 그대로)
  const [spreads, setSpreads] = useState<Record<Mode, number>>({ story: 0, records: 0 });
  const [flip, setFlip] = useState<{ id: number; direction: "next" | "prev" } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getShelfBook(book.assignmentId)
      .then((detail) => {
        if (!cancelled) setLoad({ status: "loaded", book: detail });
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoad({ status: "error", message: errorMessage(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [book.assignmentId, attempt]);

  const leaves = load.status === "loaded" ? (mode === "story" ? storyLeaves(load.book) : recordLeaves(load.book)) : [];
  const spreadCount = Math.max(1, Math.ceil(leaves.length / 2));
  const spread = Math.min(spreads[mode], spreadCount - 1);
  const left = leaves[spread * 2];
  const right = leaves[spread * 2 + 1];

  const turn = (direction: "next" | "prev") => {
    const target = spread + (direction === "next" ? 1 : -1);
    if (target < 0 || target >= spreadCount) return;
    setSpreads((current) => ({ ...current, [mode]: target }));
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setFlip({ id: Date.now(), direction });
  };
  const toggleMode = () => {
    setFlip(null);
    setMode((current) => (current === "story" ? "records" : "story"));
  };

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape") onClose();
    else if (event.key === "ArrowRight") turn("next");
    else if (event.key === "ArrowLeft") turn("prev");
    else return;
    event.preventDefault();
  });

  useEffect(() => {
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => onKeyDown(event);
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const colors = COVER_COLORS[book.theme];
  const isRecords = mode === "records";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center overflow-hidden bg-[#2B1D12]/70 font-kr backdrop-blur-[3px]"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative shrink-0" style={{ width: CANVAS.width * scale, height: CANVAS.height * scale }}>
        <div className="absolute top-0 left-0 origin-top-left" style={{ width: CANVAS.width, height: CANVAS.height, transform: `scale(${scale})` }}>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="absolute top-[36px] left-[40px] flex h-[52px] cursor-pointer items-center gap-[8px] rounded-full bg-white/90 px-[24px] text-[20px] font-bold text-[#5A4032] shadow-md transition hover:bg-white active:scale-[0.98]"
          >
            <span aria-hidden className="text-[24px] leading-none">←</span> 책장으로
          </button>

          <h2 id={titleId} className="absolute inset-x-[360px] top-[40px] truncate text-center font-display text-[34px] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]">
            {book.title}
          </h2>
          {!isRecords && (
            <p className="absolute inset-x-0 top-[92px] text-center text-[16px] text-white/85">
              <span className="bg-[linear-gradient(transparent_55%,rgba(255,210,166,0.75)_55%)] px-[2px] font-bold text-white">이렇게 칠한 문장</span>은 내가 소리 내어 읽은 문장이에요
            </p>
          )}

          {/* 책 */}
          <div className="absolute animate-pop-in" style={{ left: COVER.left, top: COVER.top, width: COVER.width, height: COVER.height }}>
            {/* 하드커버 */}
            <div
              className="absolute inset-0 rounded-[22px] shadow-[0_24px_50px_rgba(0,0,0,0.45)]"
              style={{ background: `linear-gradient(90deg, ${colors.dark}, ${colors.base} 12%, ${colors.base} 46%, ${colors.dark} 50%, ${colors.base} 54%, ${colors.base} 88%, ${colors.dark})` }}
            />

            {/* 책갈피: 표지와 종이 사이에 끼워져 윗부분만 나온다. 누르면 책 ↔ 학습 기록 */}
            <button
              type="button"
              onClick={toggleMode}
              aria-pressed={isRecords}
              aria-label={isRecords ? "책 내용으로 돌아가기" : "학습 기록 보기"}
              className="group absolute cursor-pointer"
              style={{ left: COVER.padding + PAGE.width * 2 - BOOKMARK.right - BOOKMARK.width, top: COVER.padding - BOOKMARK.peek, width: BOOKMARK.width, height: BOOKMARK.peek + 20 }}
            >
              <Image
                src="/library/bookmark-yeoul.png"
                alt=""
                width={BOOKMARK.width}
                height={BOOKMARK.height}
                className={`absolute top-0 left-0 max-w-none transition-transform duration-300 ${
                  isRecords
                    ? "-translate-y-[12px] drop-shadow-[0_0_14px_rgba(255,160,70,0.95)]"
                    : "drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)] group-hover:-translate-y-[10px] group-focus-visible:-translate-y-[10px]"
                }`}
                style={{ width: BOOKMARK.width, height: BOOKMARK.height }}
              />
            </button>
            <p
              aria-hidden
              className="pointer-events-none absolute animate-pop-in rounded-full bg-white px-[16px] py-[7px] text-[17px] font-bold whitespace-nowrap text-[#D9621C] shadow-md"
              style={{ left: COVER.padding + PAGE.width * 2 - BOOKMARK.right + 14, top: COVER.padding - BOOKMARK.peek + 26 }}
            >
              {isRecords ? "책으로 돌아가기" : "← 내 학습 기록"}
            </p>

            {/* 두 쪽 */}
            <div className="absolute flex" style={{ left: COVER.padding, top: COVER.padding, perspective: 2600 }}>
              <Page side="left" number={left ? spread * 2 + 1 : undefined}>
                <LeafContent key={`${mode}-${left?.key}`} load={load} leaf={left} onRetry={() => { setLoad({ status: "loading" }); setAttempt((n) => n + 1); }} />
              </Page>
              <Page side="right" number={right ? spread * 2 + 2 : undefined}>
                {load.status === "loaded" && right && <LeafContent key={`${mode}-${right.key}`} load={load} leaf={right} />}
              </Page>
              {flip && (
                <div
                  key={flip.id}
                  aria-hidden
                  onAnimationEnd={() => setFlip(null)}
                  className="absolute top-0 rounded-[6px] bg-[#FFFBF3]"
                  style={{
                    left: flip.direction === "next" ? PAGE.width : 0,
                    width: PAGE.width,
                    height: PAGE.height,
                    transformOrigin: flip.direction === "next" ? "left center" : "right center",
                    animation: `page-turn-${flip.direction} ${FLIP_MS}ms cubic-bezier(0.45, 0.05, 0.35, 1) both`,
                    backgroundImage: "linear-gradient(90deg, rgba(120,80,40,0.16), transparent 30%, transparent 70%, rgba(120,80,40,0.16))",
                  }}
                />
              )}
            </div>
          </div>

          {/* 넘기기 */}
          <TurnButton direction="prev" disabled={spread === 0 || load.status !== "loaded"} onClick={() => turn("prev")} />
          <TurnButton direction="next" disabled={spread >= spreadCount - 1 || load.status !== "loaded"} onClick={() => turn("next")} />

          {load.status === "loaded" && (
            <p className="absolute inset-x-0 top-[906px] text-center text-[20px] font-bold text-white/85" aria-live="polite">
              {right ? `${spread * 2 + 1}–${spread * 2 + 2}` : spread * 2 + 1} / {leaves.length}쪽
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Page({ side, number, children }: { side: "left" | "right"; number?: number; children: ReactNode }) {
  const spine = side === "left" ? "to left" : "to right";
  return (
    <div
      className={`relative overflow-hidden bg-[#FFFBF3] ${side === "left" ? "rounded-l-[6px]" : "rounded-r-[6px]"}`}
      style={{
        width: PAGE.width,
        height: PAGE.height,
        // 가운데(책등) 쪽은 살짝 어둡게, 바깥쪽은 종이가 여러 장 겹친 모양
        backgroundImage: `linear-gradient(${spine}, rgba(120,80,40,0.2), rgba(120,80,40,0.05) 50px, transparent 90px)`,
        boxShadow: side === "left" ? "-3px 2px 0 #EFE3CF, -6px 4px 0 #E2D2B8" : "3px 2px 0 #EFE3CF, 6px 4px 0 #E2D2B8",
      }}
    >
      <div className="absolute inset-x-[58px] top-[50px] bottom-[64px]">{children}</div>
      {number !== undefined && (
        <p className={`absolute bottom-[24px] font-display text-[18px] text-[#B59C7E] ${side === "left" ? "left-[40px]" : "right-[40px]"}`}>{number}</p>
      )}
    </div>
  );
}

function LeafContent({ load, leaf, onRetry }: { load: LoadState; leaf?: Leaf; onRetry?: () => void }) {
  if (load.status === "loading") {
    return <p className="mt-[260px] text-center text-[24px] font-bold text-[#8A7358]" role="status">책을 펼치는 중이에요…</p>;
  }
  if (load.status === "error") {
    return (
      <div className="mt-[220px] flex flex-col items-center gap-[18px] text-center" role="alert">
        <p className="text-[22px] font-bold break-keep text-[#5A4032]">책을 펼치지 못했어요. {load.message}</p>
        <button type="button" onClick={onRetry} className="cursor-pointer rounded-full bg-[#D9621C] px-[24px] py-[10px] text-[18px] font-bold text-white">
          다시 펼치기
        </button>
      </div>
    );
  }
  return <div className="h-full animate-fade-in">{leaf?.content}</div>;
}

function TurnButton({ direction, disabled, onClick }: { direction: "prev" | "next"; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={direction === "prev" ? "앞 쪽" : "다음 쪽"}
      disabled={disabled}
      onClick={onClick}
      className={`absolute top-[488px] flex size-[64px] items-center justify-center rounded-full shadow-lg transition ${
        direction === "prev" ? "left-[34px]" : "right-[34px]"
      } ${disabled ? "cursor-default bg-white/30 text-white/50" : "cursor-pointer bg-[#DE691B] text-white hover:brightness-105 active:scale-95"}`}
    >
      {/* 글자(‹ ›)는 글꼴마다 위치가 달라 원 가운데에 맞지 않으므로 그림으로 그린다 */}
      <svg aria-hidden viewBox="0 0 24 24" className="size-[28px]" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <path d={direction === "prev" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  );
}

// ---------- 책 읽기 쪽 ----------

/** 책을 펼치면 바로 본문 1쪽부터 나온다 */
function storyLeaves(book: ShelfBook): Leaf[] {
  const leaves: Leaf[] = [];
  for (const page of book.pages) {
    leaves.push({ key: `page-${page.page}`, content: <StoryLeaf lines={page.lines} glossary={book.glossary} /> });
  }
  leaves.push({ key: "end", content: <EndLeaf /> });
  return leaves;
}

function StoryLeaf({ lines, glossary }: { lines: ReadingLine[]; glossary: Record<string, string> }) {
  return (
    <div className="flex h-full flex-col justify-center gap-[22px] overflow-y-auto pr-[4px]">
      {lines.map((line) => (
        <p key={line.id} className="text-[25px] leading-[1.75] break-keep text-[#2B2420]">
          <span className={line.speaker === "STUDENT" ? "box-decoration-clone bg-[linear-gradient(transparent_58%,#FFD2A6_58%)]" : undefined}>
            <GlossaryText text={line.text} glossary={glossary} />
          </span>
        </p>
      ))}
    </div>
  );
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 낱말 풀이가 있는 말에 점선을 긋고, 올리면 뜻이 보인다 */
function GlossaryText({ text, glossary }: { text: string; glossary: Record<string, string> }) {
  const words = Object.keys(glossary).filter(Boolean).sort((a, b) => b.length - a.length);
  if (words.length === 0) return text;
  const parts = text.split(new RegExp(`(${words.map(escapeRegExp).join("|")})`, "g"));
  return parts.map((part, index) =>
    glossary[part] ? (
      <abbr key={index} title={glossary[part]} className="cursor-help underline decoration-[#D9621C] decoration-dotted decoration-2 underline-offset-[6px] [text-decoration-skip-ink:none]">
        {part}
      </abbr>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}

function EndLeaf() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <Image src="/study/reading/fox-happy.png" alt="" width={200} height={216} />
      <p className="mt-[20px] font-display text-[40px] text-[#D9621C]">끝!</p>
      <p className="mt-[12px] text-[20px] leading-[1.6] break-keep text-[#5A4032]">
        오른쪽 위 <b className="text-[#D9621C]">여울이 책갈피</b>를 누르면
        <br />
        이 책으로 공부한 기록을 볼 수 있어요
      </p>
    </div>
  );
}

// ---------- 학습 기록 쪽 ----------

function orderingResult(ordering: NonNullable<ShelfBook["ordering"]>): AttemptResult {
  return attemptResult(ordering.attempts);
}

function recordLeaves(book: ShelfBook): Leaf[] {
  const questions = [...book.questions].sort((a, b) => a.order - b.order);
  const leaves: Leaf[] = [{ key: "summary", content: <SummaryLeaf book={book} questions={questions} /> }];
  questions.forEach((question, index) => {
    leaves.push({ key: `q-${question.questionId}`, content: <QuestionLeaf question={question} index={index} /> });
  });
  if (book.ordering) leaves.push({ key: "ordering", content: <OrderingLeaf ordering={book.ordering} /> });
  if (book.reflection) leaves.push({ key: "reflection", content: <ReflectionLeaf book={book} reflection={book.reflection} /> });
  if (leaves.length % 2 === 1) leaves.push({ key: "records-end", content: <RecordsEndLeaf /> });
  return leaves;
}

function LeafHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header>
      <p className="text-[17px] font-bold text-[#D9621C]">{eyebrow}</p>
      <h3 className="mt-[4px] font-display text-[32px] leading-tight break-keep text-[#3E2F24]">{title}</h3>
    </header>
  );
}

function ResultBadge({ result, size = "md" }: { result: AttemptResult; size?: "md" | "lg" }) {
  const style = ATTEMPT_RESULT_STYLE[result];
  return (
    <span
      className={`inline-flex items-center gap-[6px] rounded-full font-bold whitespace-nowrap ${size === "lg" ? "px-[16px] py-[7px] text-[19px]" : "px-[12px] py-[4px] text-[16px]"}`}
      style={{ color: style.color, backgroundColor: style.background }}
    >
      <span aria-hidden>{style.icon}</span>
      {style.label}
    </span>
  );
}

function ResultStamp({ result, label }: { result: AttemptResult; label: string }) {
  const style = ATTEMPT_RESULT_STYLE[result];
  return (
    <li className="flex w-[92px] flex-col items-center gap-[8px]" title={`${label}: ${style.label}`}>
      <span
        className="flex size-[74px] items-center justify-center rounded-full border-[3px] border-dashed text-[34px] font-bold"
        style={{ color: style.color, backgroundColor: style.background, borderColor: style.color }}
      >
        {style.icon}
      </span>
      <span className="text-[16px] font-bold text-[#5A4032]">{label}</span>
    </li>
  );
}

function SummaryLeaf({ book, questions }: { book: ShelfBook; questions: ShelfBook["questions"] }) {
  const results = questions.map((question) => attemptResult(question.attempts));
  const firstTry = results.filter((result) => result === "first").length;
  const solved = results.filter((result) => result === "first" || result === "retry").length;
  const studentLines = book.pages.reduce((sum, page) => sum + page.lines.filter((line) => line.speaker === "STUDENT").length, 0);

  return (
    <div className="flex h-full flex-col">
      <LeafHeading eyebrow="여울이 책갈피" title="나의 학습 기록" />

      <div className="mt-[22px] rounded-[18px] bg-[#FFF1DE] px-[24px] py-[18px]">
        <p className="text-[21px] leading-[1.5] font-bold break-keep text-[#3E2F24]">
          {questions.length > 0 ? (
            <>
              이해 질문 {questions.length}개 중 <span className="text-[28px] text-[#D9621C]">{firstTry}개</span>를 한 번에 맞혔어요!
            </>
          ) : (
            "이 책에는 이해 질문이 없었어요."
          )}
        </p>
        {questions.length > 0 && solved > firstTry && (
          <p className="mt-[4px] text-[17px] text-[#6B5645]">다시 도전해서 {solved - firstTry}개를 더 맞혔어요.</p>
        )}
      </div>

      <ul className="mt-[26px] flex flex-wrap justify-center gap-x-[10px] gap-y-[16px]" aria-label="문제별 결과">
        {questions.map((question, index) => (
          <ResultStamp key={question.questionId} result={results[index]} label={`${index + 1}. ${QUESTION_STAGE_LABELS[question.stage] ?? question.stage}`} />
        ))}
        {book.ordering && <ResultStamp result={orderingResult(book.ordering)} label="순서" />}
      </ul>

      <dl className="mt-auto grid grid-cols-2 gap-[12px] text-center">
        <div className="rounded-[14px] border-2 border-[#F0E2CD] py-[12px]">
          <dt className="text-[15px] text-[#8A7358]">번갈아 읽은 쪽</dt>
          <dd className="font-display text-[28px] text-[#3E2F24]">{book.pages.length}쪽</dd>
        </div>
        <div className="rounded-[14px] border-2 border-[#F0E2CD] py-[12px]">
          <dt className="text-[15px] text-[#8A7358]">내가 읽은 문장</dt>
          <dd className="font-display text-[28px] text-[#3E2F24]">{studentLines}문장</dd>
        </div>
      </dl>
    </div>
  );
}

function QuestionLeaf({ question, index }: { question: ShelfBook["questions"][number]; index: number }) {
  const result = attemptResult(question.attempts);
  return (
    <div className="flex h-full flex-col">
      <LeafHeading eyebrow={`이해 질문 ${index + 1} · ${QUESTION_STAGE_LABELS[question.stage] ?? question.stage}`} title={question.text} />
      <div className="mt-[14px]">
        <ResultBadge result={result} size="lg" />
      </div>

      <ol className="mt-[24px] flex flex-col gap-[12px]">
        {question.options.map((option, optionIndex) => {
          const isAnswer = optionIndex === question.answer;
          const picks = question.attempts.filter((attempt) => attempt.answer === optionIndex);
          return (
            <li
              key={optionIndex}
              className={`flex min-h-[62px] items-center gap-[14px] rounded-[14px] border-2 px-[18px] py-[10px] ${
                isAnswer ? "border-[#6BB06F] bg-[#EEF8EC]" : picks.length > 0 ? "border-[#E9B7A6] bg-[#FDF1EC]" : "border-[#EFE3CF] bg-white"
              }`}
            >
              <span
                className={`flex size-[32px] shrink-0 items-center justify-center rounded-full text-[17px] font-bold ${
                  isAnswer ? "bg-[#4E9A55] text-white" : "bg-[#EFE3CF] text-[#6B5645]"
                }`}
              >
                {isAnswer ? "✓" : optionIndex + 1}
              </span>
              <span className="flex-1 text-[21px] break-keep text-[#2B2420]">{option}</span>
              <span className="flex shrink-0 flex-col items-end gap-[4px]">
                {isAnswer && <span className="text-[15px] font-bold text-[#2E6B3A]">정답</span>}
                {picks.map((attempt) => (
                  <span
                    key={attempt.attemptNumber}
                    className={`rounded-full px-[10px] py-[2px] text-[14px] font-bold ${attempt.correct ? "bg-[#4E9A55] text-white" : "bg-[#E9B7A6] text-[#8A3A22]"}`}
                  >
                    {attempt.attemptNumber}번째에 골랐어요
                  </span>
                ))}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function OrderingLeaf({ ordering }: { ordering: NonNullable<ShelfBook["ordering"]> }) {
  const result = orderingResult(ordering);
  const cardText = new Map(ordering.cards.map((card) => [card.id, card.text]));
  return (
    <div className="flex h-full flex-col">
      <LeafHeading eyebrow="순서 맞추기" title={ordering.text} />
      <div className="mt-[14px]">
        <ResultBadge result={result} size="lg" />
      </div>

      <p className="mt-[20px] text-[16px] font-bold text-[#8A7358]">이야기 순서</p>
      <ol className="mt-[8px] flex flex-col gap-[8px]">
        {ordering.cards.map((card, index) => (
          <li key={card.id} className="flex items-center gap-[12px] rounded-[12px] bg-[#FFF6E8] px-[14px] py-[8px]">
            <span className="flex size-[28px] shrink-0 items-center justify-center rounded-full bg-[#D9621C] text-[15px] font-bold text-white">{index + 1}</span>
            <span className="text-[18px] break-keep text-[#2B2420]">{cardText.get(card.id)}</span>
          </li>
        ))}
      </ol>

      <p className="mt-[18px] text-[16px] font-bold text-[#8A7358]">나의 도전</p>
      <ul className="mt-[8px] flex flex-col gap-[6px]">
        {ordering.attempts.map((attempt) => {
          const order = Array.isArray(attempt.answer) ? attempt.answer : [];
          const inPlace = order.filter((id, index) => ordering.cards[index]?.id === id).length;
          return (
            <li key={attempt.attemptNumber} className="flex items-center gap-[10px] text-[18px] text-[#3E2F24]">
              <span className={`flex size-[26px] items-center justify-center rounded-full text-[14px] font-bold text-white ${attempt.correct ? "bg-[#4E9A55]" : "bg-[#D98B72]"}`}>
                {attempt.correct ? "✓" : "✗"}
              </span>
              <span className="font-bold">{attempt.attemptNumber}번째 도전</span>
              <span className="text-[#6B5645]">
                {attempt.correct ? "모두 제자리에 놓았어요!" : `${ordering.cards.length}장 중 ${inPlace}장을 제자리에 놓았어요`}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ReflectionLeaf({ book, reflection }: { book: ShelfBook; reflection: NonNullable<ShelfBook["reflection"]> }) {
  const seconds = Math.max(1, Math.round(reflection.durationMs / 1000));
  return (
    <div className="flex h-full flex-col">
      <LeafHeading eyebrow="설명 말하기" title="내 표지 그림 이야기" />
      <div className="mt-[22px] flex items-start gap-[18px]">
        <div className="relative shrink-0 overflow-hidden rounded-[12px] border-4 border-[#F0E2CD] bg-[#F1EDE4]" style={{ width: 170, height: 170 / COVER_ART_ASPECT }}>
          {book.coverImageUrl && <Image src={book.coverImageUrl} alt="" fill sizes="170px" className="object-contain" unoptimized />}
        </div>
        <blockquote className="relative flex-1 rounded-[18px] bg-[#FFF1DE] px-[20px] py-[16px] text-[21px] leading-[1.6] break-keep text-[#3E2F24]">
          “{reflection.transcript}”
        </blockquote>
      </div>
      <p className="mt-[18px] text-[18px] text-[#6B5645]">
        <b className="text-[#D9621C]">{seconds}초</b> 동안 내 그림을 이야기했어요.
      </p>
    </div>
  );
}

function RecordsEndLeaf() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <Image src="/study/reading/fox-curious.png" alt="" width={190} height={198} />
      <p className="mt-[20px] text-[20px] leading-[1.6] break-keep text-[#5A4032]">
        책갈피를 다시 누르면
        <br />
        책 내용으로 돌아가요
      </p>
    </div>
  );
}
