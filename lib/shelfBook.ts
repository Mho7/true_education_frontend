import type { QuestionStage, ShelfAttempt } from "@/lib/api/types";

/** 문제 유형 → 화면 글 (이해 질문 화면과 같은 말) */
export const QUESTION_STAGE_LABELS: Record<QuestionStage, string> = {
  WHO: "누가",
  WHAT: "무슨 일",
  WHY: "왜",
  EMOTION: "마음",
};

/**
 * first    — 첫 번째 시도에 맞혔다
 * retry    — 다시 도전해서 맞혔다
 * revealed — 기회를 다 써서 정답을 함께 알아봤다
 * none     — 시도 기록이 없다
 */
export type AttemptResult = "first" | "retry" | "revealed" | "none";

export function attemptResult(attempts: ShelfAttempt[]): AttemptResult {
  if (attempts.length === 0) return "none";
  if (attempts[0].correct) return "first";
  return attempts.some((attempt) => attempt.correct) ? "retry" : "revealed";
}

/** 기록 배지 글·색. 틀린 것도 아이가 속상하지 않게 "함께 알아봤어요"로 적는다 */
export const ATTEMPT_RESULT_STYLE: Record<AttemptResult, { icon: string; label: string; color: string; background: string }> = {
  first: { icon: "★", label: "한 번에 맞혔어요", color: "#B7651A", background: "#FFE7B8" },
  retry: { icon: "↻", label: "다시 도전해서 맞혔어요", color: "#2E6B3A", background: "#DDF1D8" },
  revealed: { icon: "?", label: "정답을 함께 알아봤어요", color: "#4F6A8F", background: "#DFE9F6" },
  none: { icon: "·", label: "기록이 없어요", color: "#857B72", background: "#EFE8DE" },
};
