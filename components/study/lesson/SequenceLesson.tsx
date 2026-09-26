"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { errorMessage, isApiError } from "@/lib/api/client";
import { getOrdering, submitOrdering } from "@/lib/api/learning";
import type { OrderingResponse } from "@/lib/api/types";
import { LESSON_COUNT } from "@/lib/studyLessons";
import { completeLesson } from "@/lib/studyProgress";
import LessonFrame from "./LessonFrame";

/**
 * 시안 "AI독서서비스 (4)". 채점은 서버가 한다(최대 3회, 중간 힌트 없음).
 * - 문장을 누르면 고른 순서대로 번호가 붙는다. 번호가 붙은 문장을 다시 누르면 빠지고 뒤 번호가 당겨진다
 * - 모두 고르면 "순서 확인하기"가 켜진다 → 카드 id 순서를 보낸다
 * - correct  — 모든 문장이 초록색이 되고 "완료하기"
 * - wrong    — 기회가 남았다. 남은 기회를 알려 주고 "다시 하기"로 처음부터 고른다
 * - revealed — 3번째 오답. 서버가 준 정답 순서대로 카드를 보여 주고 "완료하기"
 *
 * TODO(팀 결정): 횟수·힌트 규칙이 바뀌면 이 파일과 서버 응답만 보면 된다.
 * 응답에 hint가 오면(팀이 "첫 사건 힌트 유지"로 정한 경우) 안내 줄 자리에 보여 준다.
 */
type Result = "none" | "correct" | "wrong" | "revealed";

// 시안 캔버스 좌표 (1104×900, 사이드바 제외)
const OPTION = { left: 153, top: 321, width: 798, height: 75, gap: 14 };

function initialResult({ state }: OrderingResponse): Result {
  if (!state.finished) return "none";
  return state.correct ? "correct" : "revealed";
}

type SequenceLessonProps = {
  assignmentId: number;
  /** GET /assignments/{id}/ordering 응답 */
  ordering: OrderingResponse;
};

export default function SequenceLesson({ assignmentId, ordering: initialOrdering }: SequenceLessonProps) {
  const router = useRouter();
  const [ordering, setOrdering] = useState(initialOrdering);
  /** 고른 순서대로 쌓인 카드 id */
  const [picked, setPicked] = useState<string[]>(() => initialOrdering.state.answer ?? []);
  const [result, setResult] = useState<Result>(() => initialResult(initialOrdering));
  const [remaining, setRemaining] = useState(initialOrdering.state.remaining);
  const [wrongCount, setWrongCount] = useState(0);
  /** 정답 공개 때 서버가 준 정답 순서 */
  const [answer, setAnswer] = useState<string[] | null>(() => initialOrdering.state.answer ?? null);
  const [hint, setHint] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** 카드를 보여 준(또는 다시 하기를 누른) 시각. responseTimeMs의 시작점 */
  const shownAtRef = useRef(0);

  const { cards } = ordering;
  const total = cards.length;
  const checked = result !== "none";
  const finished = result === "correct" || result === "revealed";
  // 끝났고 정답 순서를 알면 그 순서대로 보여 준다. 그 밖에는 서버가 섞어 보낸 순서 그대로.
  const displayCards = finished && answer ? answer.map((id) => cards.find((card) => card.id === id)).filter((card) => card !== undefined) : cards;

  useEffect(() => {
    shownAtRef.current = performance.now();
  }, []);

  function toggle(cardId: string) {
    if (checked || submitting) return;
    setPicked((prev) => (prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]));
  }

  // 409(단계가 아님·이미 끝남): 서버 상태를 다시 받아 화면을 맞춘다.
  async function resync() {
    try {
      const latest = await getOrdering(assignmentId);
      setOrdering(latest);
      setResult(initialResult(latest));
      setRemaining(latest.state.remaining);
      setAnswer(latest.state.answer ?? null);
      setPicked(latest.state.answer ?? []);
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  async function check() {
    if (picked.length < total || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await submitOrdering(assignmentId, {
        order: picked,
        responseTimeMs: Math.round(performance.now() - shownAtRef.current),
      });
      setHint(response.hint ?? null);
      if (response.correct) {
        setResult("correct");
      } else if (!response.finished) {
        setResult("wrong");
        setWrongCount((n) => n + 1);
        if (response.remaining !== undefined) setRemaining(response.remaining);
      } else {
        setAnswer(response.answer ?? null);
        setPicked(response.answer ?? []);
        setRemaining(0);
        setResult("revealed");
      }
    } catch (caught) {
      if (isApiError(caught, 409)) await resync();
      else setError(errorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  function retry() {
    setPicked([]);
    setResult("none");
    shownAtRef.current = performance.now();
  }

  function finish() {
    // TODO(#5 백엔드 패치): 학습 지도 진행 상태가 서버로 바뀌면 이 호출은 빠진다.
    completeLesson(3);
    router.push("/study");
  }

  return (
    <LessonFrame title="순서 맞추기" progress={{ current: 3, total: LESSON_COUNT }}>
      <h2 className="absolute inset-x-0 top-[204px] text-center text-[28px] leading-[38px] font-bold text-[#2B2420]">
        {ordering.text || "이야기에서 일어난 차례대로 하나씩 골라보세요."}
      </h2>

      <div className="absolute inset-x-0 top-[258px] flex justify-center" aria-live="polite">
        {error ? (
          <p role="alert" className="rounded-full bg-[#FDECE8] px-[20px] py-[7px] text-[18px] font-bold text-[#C4472F]">
            {error}
          </p>
        ) : result === "correct" ? (
          <p key="correct" className="flex animate-pop-in items-center gap-[8px] rounded-full bg-[#E9F4E3] px-[20px] py-[7px] text-[19px] font-bold text-[#2E6B3A]">
            <CheckCircle />
            순서가 딱 맞아요!
          </p>
        ) : result === "revealed" ? (
          <p key="revealed" className="animate-pop-in rounded-full bg-[#FFF4D9] px-[20px] py-[7px] text-[19px] font-bold text-[#8A5A2E]">
            정답 순서를 알려 줄게요. 차례대로 읽어 볼까요?
          </p>
        ) : result === "wrong" ? (
          <p key={`wrong-${wrongCount}`} className="animate-pop-in rounded-full bg-[#FDECE8] px-[20px] py-[7px] text-[19px] font-bold text-[#C4472F]">
            순서가 조금 달라요. 남은 기회 {remaining}번, 다시 골라 볼까요?
          </p>
        ) : hint ? (
          <p className="animate-fade-in rounded-full bg-[#FFF4D9] px-[20px] py-[7px] text-[18px] break-keep text-[#8A5A2E]">
            <span className="font-bold text-[#D9621C]">힌트</span> {hint}
          </p>
        ) : (
          <p className="py-[7px] text-[18px] text-[#6B6058]">
            문장을 누르면 선택한 순서대로 번호가 붙어요. <span className="font-bold text-[#5C5149]">남은 기회 {remaining}번</span>
          </p>
        )}
      </div>

      <ol aria-label="이야기 문장">
        {displayCards.map((card, row) => {
          const order = picked.indexOf(card.id);
          const isPicked = order !== -1;
          const isRight = finished;
          // 서버는 어떤 카드가 틀렸는지 알려 주지 않으므로 오답이면 고른 카드 전체를 표시한다.
          const isWrong = result === "wrong";
          const tone = isRight
            ? "border-[#3F8A4E] bg-[#E9F4E3]"
            : isWrong
              ? "border-[#E26D5A] bg-[#FDECE8]"
              : isPicked
                ? "border-[#D9621C] bg-[#FFF4D9]"
                : "border-[#ECE3D3] bg-white hover:bg-[#FFFBF2]";
          const badgeTone = isRight ? "bg-[#3F8A4E]" : isWrong ? "bg-[#E26D5A]" : "bg-[#D9621C]";
          return (
            <li
              key={card.id}
              className="absolute"
              style={{ left: OPTION.left, width: OPTION.width, height: OPTION.height, top: OPTION.top + row * (OPTION.height + OPTION.gap) }}
            >
              <button
                type="button"
                aria-pressed={isPicked}
                aria-label={isPicked ? `${order + 1}번째로 고름: ${card.text}` : card.text}
                onClick={() => toggle(card.id)}
                className={`relative flex size-full items-center rounded-[18px] border-2 pr-[28px] pl-[74px] text-left text-[22px] font-bold break-keep text-[#2B2420] transition ${tone} ${
                  checked ? "cursor-default" : "cursor-pointer active:scale-[0.99]"
                } ${isWrong ? "animate-shake" : ""}`}
              >
                {isPicked && (
                  <span
                    key={order}
                    aria-hidden
                    className={`absolute top-1/2 left-[22px] flex size-[36px] -translate-y-1/2 animate-pop-in items-center justify-center rounded-full text-[18px] font-bold text-white ${badgeTone}`}
                  >
                    {order + 1}
                  </span>
                )}
                {card.text}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="absolute top-[715px] left-1/2 -translate-x-1/2">
        {finished ? (
          <ConfirmButton onClick={finish}>완료하기</ConfirmButton>
        ) : result === "wrong" ? (
          <ConfirmButton onClick={retry}>다시 하기</ConfirmButton>
        ) : (
          <ConfirmButton onClick={check} disabled={picked.length < total || submitting}>
            {submitting ? "확인하는 중…" : "순서 확인하기"}
          </ConfirmButton>
        )}
      </div>
    </LessonFrame>
  );
}

function ConfirmButton({ children, onClick, disabled = false }: { children: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-[76px] w-[250px] cursor-pointer rounded-full bg-[#D9621C] text-[24px] font-bold text-white transition hover:brightness-105 active:scale-[0.98] disabled:cursor-default disabled:bg-[#EDE3D6] disabled:text-[#9A8F84] disabled:hover:brightness-100 disabled:active:scale-100"
    >
      {children}
    </button>
  );
}

function CheckCircle() {
  return (
    <span className="flex size-[24px] items-center justify-center rounded-full bg-[#3F8A4E]" aria-hidden>
      <svg viewBox="0 0 24 24" className="size-[15px]" fill="none" stroke="white" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </span>
  );
}
