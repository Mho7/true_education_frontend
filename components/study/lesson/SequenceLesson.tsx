"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SequenceQuiz } from "@/lib/sequenceQuiz";
import { LESSON_COUNT } from "@/lib/studyLessons";
import { completeLesson } from "@/lib/studyProgress";
import LessonFrame from "./LessonFrame";

/**
 * 시안 "AI독서서비스 (4)":
 * - 문장을 누르면 고른 순서대로 번호가 붙는다. 번호가 붙은 문장을 다시 누르면 빠지고 뒤 번호가 당겨진다
 * - 모두 고르면 "순서 확인하기"가 켜진다
 * - 맞으면 모든 문장이 초록색이 되고 "완료하기"
 * - 틀리면 제자리인 문장은 초록, 아닌 문장은 빨강으로 보여 주고 "다시 하기"로 처음부터 고른다.
 *   두 번 이상 틀리면 가장 먼저 일어난 일을 힌트로 알려 준다
 */
type Result = "none" | "correct" | "wrong";

// 시안 캔버스 좌표 (1104×900, 사이드바 제외)
const OPTION = { left: 153, top: 321, width: 798, height: 75, gap: 14 };

export default function SequenceLesson({ quiz }: { quiz: SequenceQuiz }) {
  const router = useRouter();
  /** 고른 순서대로 쌓인 문장 번호 (events 기준) */
  const [picked, setPicked] = useState<number[]>([]);
  const [result, setResult] = useState<Result>("none");
  const [wrongCount, setWrongCount] = useState(0);
  const total = quiz.events.length;
  const checked = result !== "none";

  function toggle(eventIndex: number) {
    if (checked) return;
    setPicked((prev) => (prev.includes(eventIndex) ? prev.filter((i) => i !== eventIndex) : [...prev, eventIndex]));
  }

  function check() {
    if (picked.length < total) return;
    const correct = picked.every((eventIndex, order) => eventIndex === order);
    setResult(correct ? "correct" : "wrong");
    if (!correct) setWrongCount((n) => n + 1);
  }

  function retry() {
    setPicked([]);
    setResult("none");
  }

  function finish() {
    completeLesson(3);
    router.push("/study");
  }

  return (
    <LessonFrame title="순서 맞추기" progress={{ current: 3, total: LESSON_COUNT }}>
      <h2 className="absolute inset-x-0 top-[204px] text-center text-[28px] leading-[38px] font-bold text-[#2B2420]">
        이야기에서 일어난 차례대로 하나씩 골라보세요.
      </h2>

      <div className="absolute inset-x-0 top-[258px] flex justify-center" aria-live="polite">
        {result === "correct" ? (
          <p key="correct" className="flex animate-pop-in items-center gap-[8px] rounded-full bg-[#E9F4E3] px-[20px] py-[7px] text-[19px] font-bold text-[#2E6B3A]">
            <CheckCircle />
            순서가 딱 맞아요!
          </p>
        ) : result === "wrong" ? (
          <p key={`wrong-${wrongCount}`} className="animate-pop-in rounded-full bg-[#FDECE8] px-[20px] py-[7px] text-[19px] font-bold text-[#C4472F]">
            순서가 조금 달라요. 다시 골라 볼까요?
          </p>
        ) : wrongCount >= 2 ? (
          <p className="animate-fade-in rounded-full bg-[#FFF4D9] px-[20px] py-[7px] text-[18px] break-keep text-[#8A5A2E]">
            <span className="font-bold text-[#D9621C]">힌트</span> 가장 먼저 일어난 일은 「{quiz.events[0]}」
          </p>
        ) : (
          <p className="py-[7px] text-[18px] text-[#6B6058]">문장을 누르면 선택한 순서대로 번호가 붙어요.</p>
        )}
      </div>

      <ol aria-label="이야기 문장">
        {quiz.displayOrder.map((eventIndex, row) => {
          const order = picked.indexOf(eventIndex);
          const isPicked = order !== -1;
          const isRight = checked && order === eventIndex;
          const isWrong = checked && !isRight;
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
              key={eventIndex}
              className="absolute"
              style={{ left: OPTION.left, width: OPTION.width, height: OPTION.height, top: OPTION.top + row * (OPTION.height + OPTION.gap) }}
            >
              <button
                type="button"
                aria-pressed={isPicked}
                aria-label={isPicked ? `${order + 1}번째로 고름: ${quiz.events[eventIndex]}` : quiz.events[eventIndex]}
                onClick={() => toggle(eventIndex)}
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
                {quiz.events[eventIndex]}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="absolute top-[715px] left-1/2 -translate-x-1/2">
        {result === "correct" ? (
          <ConfirmButton onClick={finish}>완료하기</ConfirmButton>
        ) : result === "wrong" ? (
          <ConfirmButton onClick={retry}>다시 하기</ConfirmButton>
        ) : (
          <ConfirmButton onClick={check} disabled={picked.length < total}>
            순서 확인하기
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
