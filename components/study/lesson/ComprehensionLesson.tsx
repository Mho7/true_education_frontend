"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { errorMessage, isApiError } from "@/lib/api/client";
import { getQuestions, submitChoice } from "@/lib/api/learning";
import type { ComprehensionQuestion, QuestionStage } from "@/lib/api/types";
import { LESSON_COUNT } from "@/lib/studyLessons";
import { completeLesson } from "@/lib/studyProgress";
import LessonFrame from "./LessonFrame";

/**
 * 한 문제의 흐름 (시안 "AI독서서비스 (3)"). 채점은 서버가 한다(최대 2회).
 * - solving  — 풀이 중: 보기를 고르면 "정답 고르기"가 켜진다
 * - retry    — 1차 오답: 서버가 준 힌트를 보여 주고 다시 고르게 한다
 * - correct  — 정답: 고른 보기가 초록색이 되고 "다음 문제"(마지막이면 "완료하기")
 * - revealed — 2차 오답: 서버가 알려 준 정답 보기를 초록색으로 보여 주고 "다음 문제"
 *
 * TODO(팀 결정): 시도 횟수를 무제한(B안)으로 정하면 retry → revealed 흐름이 바뀐다. 이 파일과 서버 응답만 보면 된다.
 */
type Status = "solving" | "retry" | "correct" | "revealed";

type QuestionView = {
  status: Status;
  /** 1차 오답 뒤 힌트 */
  hint?: string;
  /** correct·revealed: 정답 보기 번호 */
  answer?: number;
};

/** 문제 유형 → 화면 글 */
const STAGE_LABELS: Record<QuestionStage, string> = {
  WHO: "누가",
  WHAT: "무슨 일",
  WHY: "왜",
  EMOTION: "마음",
};

// 시안(1104×804, 머리글 아래)을 학습 캔버스에 놓을 때 위로 밀리는 만큼
const TOP = 96;
const CHOICE = { left: 285, top: 392, width: 510, height: 80, gap: 15 };

/** 다시 들어왔을 때 서버 state로 화면 상태를 되살린다 */
function viewFromState({ state }: ComprehensionQuestion): QuestionView {
  if (state.finished) return { status: state.correct ? "correct" : "revealed", answer: state.answer };
  if (state.attempts > 0) return { status: "retry", hint: state.hint };
  return { status: "solving" };
}

const sortQuestions = (questions: ComprehensionQuestion[]) => [...questions].sort((a, b) => a.order - b.order);

/** 이어 풀 문제: 아직 안 끝난 첫 문제. 다 끝났으면 마지막 문제 */
function resumeIndex(questions: ComprehensionQuestion[]) {
  const index = questions.findIndex((q) => !q.state.finished);
  return index === -1 ? questions.length - 1 : index;
}

type ComprehensionLessonProps = {
  assignmentId: number;
  /** GET /assignments/{id}/questions 응답 */
  questions: ComprehensionQuestion[];
};

export default function ComprehensionLesson({ assignmentId, questions: initialQuestions }: ComprehensionLessonProps) {
  const router = useRouter();
  const [questions, setQuestions] = useState(() => sortQuestions(initialQuestions));
  const [index, setIndex] = useState(() => resumeIndex(sortQuestions(initialQuestions)));
  const [views, setViews] = useState(() => sortQuestions(initialQuestions).map(viewFromState));
  const [selected, setSelected] = useState<number | null>(null);
  /** 2차 오답으로 정답이 공개될 때 아이가 마지막으로 고른 보기 */
  const [lastWrong, setLastWrong] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** 문제(또는 힌트 뒤 다시 풀기)를 보여 준 시각. responseTimeMs의 시작점 */
  const shownAtRef = useRef(0);

  const question = questions[index];
  const view = views[index];
  const done = view.status === "correct" || view.status === "revealed";
  const isLast = index === questions.length - 1;

  useEffect(() => {
    shownAtRef.current = performance.now();
  }, [index]);

  function updateView(next: QuestionView) {
    setViews((prev) => prev.map((v, i) => (i === index ? next : v)));
  }

  // 409(이미 끝난 문제·단계가 아님): 서버 상태를 다시 받아 화면을 맞춘다.
  async function resync() {
    try {
      const latest = sortQuestions(await getQuestions(assignmentId));
      setQuestions(latest);
      setViews(latest.map(viewFromState));
      setSelected(null);
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  async function submit() {
    if (selected === null || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitChoice(assignmentId, question.questionId, {
        answer: selected,
        responseTimeMs: Math.round(performance.now() - shownAtRef.current),
      });
      if (result.correct) {
        updateView({ status: "correct", answer: selected });
      } else if (!result.finished) {
        updateView({ status: "retry", hint: result.hint });
        setSelected(null);
        shownAtRef.current = performance.now();
      } else {
        setLastWrong(selected);
        updateView({ status: "revealed", answer: result.answer });
        setSelected(null);
      }
    } catch (caught) {
      if (isApiError(caught, 409)) await resync();
      else setError(errorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    if (isLast) {
      // TODO(#5 백엔드 패치): 학습 지도 진행 상태가 서버로 바뀌면 이 호출은 빠진다.
      completeLesson(2);
      router.push("/study");
      return;
    }
    setIndex(index + 1);
    setSelected(null);
    setLastWrong(null);
    setError(null);
  }

  return (
    <LessonFrame title="이해 질문" progress={{ current: 2, total: LESSON_COUNT }}>
      {/* 문제가 바뀌면 통째로 새로 그려 부드럽게 나타나게 한다 */}
      <section key={question.questionId} className="absolute inset-x-0 animate-fade-in" style={{ top: TOP, height: 804 }} aria-live="polite">
        <p className="absolute top-[58px] left-[292px] text-[22px] font-bold text-[#D9621C]">
          {index + 1}. {STAGE_LABELS[question.stage] ?? question.stage}
        </p>
        <h2 className="absolute inset-x-[200px] top-[100px] text-center text-[30px] leading-[42px] font-bold break-keep text-[#2B2420]">
          {question.text}
        </h2>

        {view.status !== "solving" && (
          <FeedbackBox key={view.status} view={view} answerText={view.answer === undefined ? undefined : question.options[view.answer]} />
        )}

        <ul aria-label="보기">
          {question.options.map((option, i) => {
            const isSelected = selected === i;
            const isAnswer = done && i === view.answer;
            const isLastWrong = view.status === "revealed" && i === lastWrong;
            return (
              <li key={i} className="absolute" style={{ left: CHOICE.left, width: CHOICE.width, height: CHOICE.height, top: CHOICE.top + i * (CHOICE.height + CHOICE.gap) }}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  disabled={done || submitting}
                  onClick={() => setSelected(i)}
                  className={`flex size-full items-center justify-center rounded-[8px] px-[24px] text-[24px] font-medium break-keep text-[#2B2420] transition ${
                    isAnswer
                      ? "border-2 border-[#3F8A4E] bg-[#E9F4E3]"
                      : isLastWrong
                        ? "border-2 border-[#E26D5A] bg-[#FDECE8]"
                        : isSelected
                          ? "border-2 border-[#D9621C] bg-[#FFF4D9]"
                          : "border border-[#ECE3D3] bg-white enabled:hover:bg-[#FFFBF2]"
                  } ${done ? "cursor-default" : "cursor-pointer active:scale-[0.99] disabled:cursor-default"}`}
                >
                  {option}
                </button>
              </li>
            );
          })}
        </ul>

        {error && (
          <p role="alert" className="absolute inset-x-0 top-[668px] text-center text-[18px] font-bold text-[#C4472F]">
            {error}
          </p>
        )}

        <div className="absolute top-[705px] left-1/2 -translate-x-1/2">
          {done ? (
            <button type="button" onClick={next} className="h-[56px] w-[234px] cursor-pointer rounded-full bg-[#D9621C] text-[20px] font-bold text-white transition hover:brightness-105 active:scale-[0.98]">
              {isLast ? "완료하기" : "다음 문제"}
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={selected === null || submitting}
              className="h-[56px] w-[234px] cursor-pointer rounded-full bg-[#D9621C] text-[20px] font-bold text-white transition hover:brightness-105 active:scale-[0.98] disabled:cursor-default disabled:bg-[#E4D3B8] disabled:text-[#857B72] disabled:hover:brightness-100 disabled:active:scale-100"
            >
              {submitting ? "확인하는 중…" : "정답 고르기"}
            </button>
          )}
        </div>
      </section>
    </LessonFrame>
  );
}

/** 보기 위 안내 상자: 힌트 · 정답 · 정답 공개 */
function FeedbackBox({ view, answerText }: { view: QuestionView; answerText?: string }) {
  const correct = view.status === "correct";
  return (
    <div
      className={`absolute flex animate-pop-in flex-col justify-center rounded-[25px] px-[34px] ${correct ? "bg-[#E9F4E3]" : "bg-[#FFF4D9]"}`}
      style={{ left: 221, top: 206, width: 670, height: 148 }}
    >
      {view.status === "retry" && (
        <>
          <p className="text-[21px] font-bold text-black">한 번 더 생각해볼까요?</p>
          {view.hint && <p className="mt-[10px] line-clamp-3 text-[19px] leading-[28px] break-keep text-black">{view.hint}</p>}
        </>
      )}
      {correct && (
        <p className="flex items-center gap-[10px] text-[21px] font-bold text-[#2E6B3A]">
          <span className="flex size-[30px] items-center justify-center rounded-full bg-[#3F8A4E]" aria-hidden>
            <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
          정답이에요!
        </p>
      )}
      {view.status === "revealed" && (
        <>
          <p className="text-[21px] font-bold text-[#D9621C]">정답을 알려 줄게요</p>
          {answerText && <p className="mt-[8px] text-[19px] leading-[28px] break-keep text-black">초록색 보기가 정답이에요: 「{answerText}」</p>}
        </>
      )}
    </div>
  );
}
