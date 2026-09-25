"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ComprehensionQuestion } from "@/lib/comprehensionQuiz";
import { LESSON_COUNT } from "@/lib/studyLessons";
import { completeLesson } from "@/lib/studyProgress";
import LessonFrame from "./LessonFrame";

/**
 * 한 문제의 흐름 (시안 "AI독서서비스 (3)"):
 * - 보기를 고르면 "정답 고르기"가 켜진다
 * - 한 번 틀리면 "한 번 더 생각해볼까요?" 힌트, 두 번 이상 틀리면 "이야기에서 찾아보기"로 책 속 문장을 보여 준다
 *   (틀리면 고른 보기는 풀어서 다시 고르게 한다)
 * - 맞히면 "정답이에요!"와 설명, 정답 보기가 초록색이 되고 "다음 문제"(마지막이면 "완료하기")
 */
type Feedback = "none" | "hint" | "evidence" | "correct";

// 시안(1104×804, 머리글 아래)을 학습 캔버스에 놓을 때 위로 밀리는 만큼
const TOP = 96;
const CHOICE = { left: 285, top: 392, width: 510, height: 80, gap: 15 };

export default function ComprehensionLesson({ questions }: { questions: ComprehensionQuestion[] }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [wrongCount, setWrongCount] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>("none");
  const question = questions[index];
  const answered = feedback === "correct";
  const isLast = index === questions.length - 1;

  function submit() {
    if (selected === null) return;
    if (selected === question.answerIndex) {
      setFeedback("correct");
      return;
    }
    const wrong = wrongCount + 1;
    setWrongCount(wrong);
    setFeedback(wrong >= 2 ? "evidence" : "hint");
    setSelected(null);
  }

  function next() {
    if (isLast) {
      completeLesson(2);
      router.push("/study");
      return;
    }
    setIndex(index + 1);
    setSelected(null);
    setWrongCount(0);
    setFeedback("none");
  }

  return (
    <LessonFrame title="이해 질문" progress={{ current: 2, total: LESSON_COUNT }}>
      {/* 문제가 바뀌면 통째로 새로 그려 부드럽게 나타나게 한다 */}
      <section key={question.id} className="absolute inset-x-0 animate-fade-in" style={{ top: TOP, height: 804 }} aria-live="polite">
        <p className="absolute top-[58px] left-[292px] text-[22px] font-bold text-[#D9621C]">
          {index + 1}. {question.category}
        </p>
        <h2 className="absolute inset-x-[200px] top-[100px] text-center text-[30px] leading-[42px] font-bold break-keep text-[#2B2420]">
          {question.question}
        </h2>

        {feedback !== "none" && <FeedbackBox key={`${feedback}-${wrongCount}`} feedback={feedback} question={question} />}

        <ul aria-label="보기">
          {question.choices.map((choice, i) => {
            const isSelected = selected === i;
            const isCorrect = answered && i === question.answerIndex;
            return (
              <li key={i} className="absolute" style={{ left: CHOICE.left, width: CHOICE.width, height: CHOICE.height, top: CHOICE.top + i * (CHOICE.height + CHOICE.gap) }}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  disabled={answered}
                  onClick={() => setSelected(i)}
                  className={`flex size-full items-center justify-center rounded-[8px] px-[24px] text-[24px] font-medium break-keep text-[#2B2420] transition ${
                    isCorrect
                      ? "border-2 border-[#3F8A4E] bg-[#E9F4E3]"
                      : isSelected
                        ? "border-2 border-[#D9621C] bg-[#FFF4D9]"
                        : "border border-[#ECE3D3] bg-white enabled:hover:bg-[#FFFBF2]"
                  } ${answered ? "cursor-default" : "cursor-pointer active:scale-[0.99]"}`}
                >
                  {choice}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="absolute top-[705px] left-1/2 -translate-x-1/2">
          {answered ? (
            <button type="button" onClick={next} className="h-[56px] w-[234px] cursor-pointer rounded-full bg-[#D9621C] text-[20px] font-bold text-white transition hover:brightness-105 active:scale-[0.98]">
              {isLast ? "완료하기" : "다음 문제"}
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={selected === null}
              className="h-[56px] w-[234px] cursor-pointer rounded-full bg-[#D9621C] text-[20px] font-bold text-white transition hover:brightness-105 active:scale-[0.98] disabled:cursor-default disabled:bg-[#E4D3B8] disabled:text-[#857B72] disabled:hover:brightness-100 disabled:active:scale-100"
            >
              정답 고르기
            </button>
          )}
        </div>
      </section>
    </LessonFrame>
  );
}

/** 보기 위 안내 상자: 힌트 · 이야기에서 찾아보기 · 정답 */
function FeedbackBox({ feedback, question }: { feedback: Exclude<Feedback, "none">; question: ComprehensionQuestion }) {
  const correct = feedback === "correct";
  return (
    <div
      className={`absolute flex animate-pop-in flex-col justify-center rounded-[25px] px-[34px] ${correct ? "bg-[#E9F4E3]" : "bg-[#FFF4D9]"}`}
      style={{ left: 221, top: 206, width: 670, height: 148 }}
    >
      {feedback === "hint" && (
        <>
          <p className="text-[21px] font-bold text-black">한 번 더 생각해볼까요?</p>
          <p className="mt-[10px] text-[19px] leading-[28px] break-keep text-black">{question.hint}</p>
        </>
      )}
      {feedback === "evidence" && (
        <>
          <p className="text-[21px] font-bold text-[#D9621C]">이야기에서 찾아보기</p>
          <p className="mt-[8px] text-[19px] leading-[28px] break-keep text-black">{question.evidence}</p>
        </>
      )}
      {correct && (
        <>
          <p className="flex items-center gap-[10px] text-[21px] font-bold text-[#2E6B3A]">
            <span className="flex size-[30px] items-center justify-center rounded-full bg-[#3F8A4E]" aria-hidden>
              <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </span>
            정답이에요!
          </p>
          <p className="mt-[8px] text-[19px] leading-[28px] break-keep text-[#3D5A43]">{question.explanation}</p>
        </>
      )}
    </div>
  );
}
