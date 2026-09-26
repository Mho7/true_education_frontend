"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { errorMessage, isApiError } from "@/lib/api/client";
import { saveTitle } from "@/lib/api/learning";
import { startBookDraft } from "@/lib/bookDraft";
import { LESSON_COUNT } from "@/lib/studyLessons";
import { completeLesson } from "@/lib/studyProgress";
import { GENERAL_PROMPTS, HINT_PROMPTS } from "@/lib/titleActivity";
import LessonFrame from "./LessonFrame";

/**
 * 시안 "AI독서서비스 (5)":
 * - 떠올리기 질문 3개를 보며 아이디어 메모를 적고, 제목을 적으면 "제목 완성하기"가 켜진다
 * - "생각이 잘 안 나요"를 누르면 이 이야기에 맞춘 힌트 질문으로 바뀌고, "처음 질문 보기"로 돌아간다
 * - 완성하면 내가 지은 제목과 원래 제목을 함께 보여 주고, "이동하기"를 누르면 제목을 서버에 저장(PUT title)하고 4단계를 끝낸다
 *   (아이가 지은 제목으로 새 책 초안을 만든다. 책장에는 보물상자에서 표지를 그리고 설명까지 끝내야 꽂힌다)
 */
const TITLE_MAX_LENGTH = 30;
// 시안 캔버스 좌표 (1104×900, 사이드바 제외)
const FORM = { left: 203, width: 698 };

type TitleLessonProps = {
  assignmentId: number;
  /** 원래 이야기의 제목 (완성 화면에서 보여 준다) */
  originalTitle: string;
};

export default function TitleLesson({ assignmentId, originalTitle }: TitleLessonProps) {
  const router = useRouter();
  const memoId = useId();
  const titleId = useId();
  const [showHint, setShowHint] = useState(false);
  const [memo, setMemo] = useState("");
  const [title, setTitle] = useState("");
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmed = title.trim();
  const prompts = showHint ? HINT_PROMPTS : GENERAL_PROMPTS;

  function complete() {
    if (!trimmed) return;
    setDone(true);
  }

  async function finish() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await saveTitle(assignmentId, { title: trimmed });
      startBookDraft(saved.title, assignmentId);
      // TODO(#5 백엔드 패치): 학습 지도 진행 상태가 서버로 바뀌면 이 호출은 빠진다.
      completeLesson(4);
      router.push("/study");
    } catch (caught) {
      setError(isApiError(caught, 409) ? "제목을 저장할 차례가 아니에요. 학습 지도로 돌아가 다시 시작해 주세요." : errorMessage(caught));
      setSaving(false);
    }
  }

  return (
    <LessonFrame title="제목 짓기" progress={{ current: 4, total: LESSON_COUNT }}>
      {done ? (
        <section className="absolute inset-0 animate-fade-in" aria-live="polite">
          <h2 className="absolute inset-x-0 top-[208px] animate-pop-in text-center text-[40px] leading-[50px] font-bold text-[#D9621C]">
            정말 멋있는 제목이에요!
          </h2>

          <p className="absolute top-[330px] left-[192px] text-[17px] font-bold text-[#5C5149]">내가 지은 제목</p>
          <p
            className="absolute flex animate-pop-in items-center justify-center rounded-[28px] border-2 border-[#D9621C] bg-[#FFF4D9] px-[40px] text-center text-[40px] leading-[52px] font-bold break-keep text-[#2B2420]"
            style={{ left: 163, top: 364, width: 768, height: 160, animationDelay: "150ms" }}
          >
            {trimmed}
          </p>

          <p className="absolute top-[598px] left-[192px] animate-fade-in text-[17px] font-bold text-[#5C5149]" style={{ animationDelay: "600ms" }}>
            그리고 원래 이야기의 제목은...
          </p>
          <p
            className="absolute flex animate-pop-in items-center justify-center rounded-[16px] border-2 border-[#ECE3D3] bg-white px-[24px] text-center text-[30px] font-bold break-keep text-[#2B2420]"
            style={{ left: 332, top: 633, width: 432, height: 95, animationDelay: "900ms" }}
          >
            {originalTitle}
          </p>

          {error && (
            <p role="alert" className="absolute inset-x-0 top-[736px] text-center text-[17px] font-bold text-[#C4472F]">
              {error}
            </p>
          )}
          <div className="absolute top-[763px] left-1/2 -translate-x-1/2">
            <OrangeButton onClick={() => void finish()} disabled={saving}>
              {saving ? "저장하는 중…" : "이동하기"}
            </OrangeButton>
          </div>
        </section>
      ) : (
        <form
          className="absolute inset-0"
          onSubmit={(event) => {
            event.preventDefault();
            complete();
          }}
        >
          <h2 className="absolute inset-x-0 top-[132px] text-center text-[30px] leading-[40px] font-bold text-[#2B2420]">이 이야기에 제목을 지어주세요</h2>
          <p className="absolute inset-x-0 top-[184px] text-center text-[19px] text-[#5C5149]">먼저 이야기에서 기억나는 것을 떠올려봐요.</p>

          {/* 가운데 글씨가 있는 가로줄 */}
          <div className="absolute top-[240px] flex items-center gap-[20px]" style={{ left: FORM.left, width: FORM.width }}>
            <span className="h-px flex-1 bg-[#ECE3D3]" />
            <span className="text-[17px] font-bold text-[#D9621C]">{showHint ? "이렇게 생각해볼까요?" : "이야기를 떠올려볼까요?"}</span>
            <span className="h-px flex-1 bg-[#ECE3D3]" />
          </div>

          <ol key={showHint ? "hint" : "general"} className="absolute top-[272px] flex animate-fade-in flex-col gap-[10px]" style={{ left: FORM.left }}>
            {prompts.map((prompt, i) => (
              <li key={prompt} className="flex items-center gap-[12px] text-[21px] text-[#2B2420]">
                <span className="flex size-[27px] shrink-0 items-center justify-center rounded-full border-2 border-[#F2C49F] text-[14px] font-bold text-[#D9621C]">
                  {i + 1}
                </span>
                {prompt}
              </li>
            ))}
          </ol>

          <button
            type="button"
            onClick={() => setShowHint((prev) => !prev)}
            className="absolute top-[282px] flex cursor-pointer items-center gap-[6px] rounded-full px-[10px] py-[4px] text-[17px] font-bold text-[#5C5149] transition hover:bg-[#F4ECDF]"
            style={{ right: 1104 - FORM.left - FORM.width - 10 }}
          >
            <BulbIcon />
            {showHint ? "처음 질문 보기" : "생각이 잘 안 나요"}
          </button>

          <label htmlFor={memoId} className="absolute top-[400px] text-[17px] font-bold text-[#5C5149]" style={{ left: FORM.left }}>
            아이디어 메모
          </label>
          <textarea
            id={memoId}
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            placeholder="생각나는 단어나 짧은 말을 적어보세요."
            className="absolute resize-none rounded-[22px] bg-[#FFF4D9] px-[30px] py-[26px] text-[22px] leading-[32px] text-[#2B2420] outline-none placeholder:text-[#B7A89A] focus:ring-2 focus:ring-[#D9621C]/40"
            style={{ left: FORM.left, width: FORM.width, top: 435, height: 166 }}
          />

          <label htmlFor={titleId} className="absolute top-[624px] text-[17px] font-bold text-[#5C5149]" style={{ left: FORM.left }}>
            내가 지은 제목
          </label>
          <input
            id={titleId}
            value={title}
            maxLength={TITLE_MAX_LENGTH}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="내가 지은 제목을 적어보세요"
            className="absolute rounded-[22px] border-2 border-[#ECE3D3] bg-white px-[30px] text-[26px] font-bold text-[#2B2420] outline-none placeholder:font-normal placeholder:text-[#B7A89A] focus:border-[#D9621C]"
            style={{ left: FORM.left, width: FORM.width, top: 657, height: 79 }}
          />

          <div className="absolute top-[769px] left-1/2 -translate-x-1/2">
            <OrangeButton type="submit" disabled={!trimmed}>
              제목 완성하기
            </OrangeButton>
          </div>
        </form>
      )}
    </LessonFrame>
  );
}

function OrangeButton({
  children,
  onClick,
  type = "button",
  disabled = false,
}: {
  children: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="h-[75px] w-[240px] cursor-pointer rounded-full bg-[#D9621C] text-[24px] font-bold text-white transition hover:brightness-105 active:scale-[0.98] disabled:cursor-default disabled:bg-[#EDE3D6] disabled:text-[#9A8F84] disabled:hover:brightness-100 disabled:active:scale-100"
    >
      {children}
    </button>
  );
}

function BulbIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-[20px]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" />
    </svg>
  );
}
