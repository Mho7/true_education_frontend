import { apiRequest } from "./client";
import type {
  ChoiceAttemptRequest,
  ChoiceAttemptResponse,
  ComprehensionQuestion,
  OrderingAttemptRequest,
  OrderingAttemptResponse,
  OrderingResponse,
  ReadingResponse,
  SaveReadingPageRequest,
  SaveReadingPageResponse,
  TodayResponse,
} from "./types";

// TODO(#5 백엔드 패치): 오솔길 발판·하루 학습 제한은 패치에서 이 응답을 쓰도록 바뀐다. 지금은 학습 화면이 배정 id를 얻는 데만 쓴다.
export function getToday() {
  return apiRequest<TodayResponse>("/sessions/today");
}

export function getReading(assignmentId: number) {
  return apiRequest<ReadingResponse>(`/assignments/${assignmentId}/reading`);
}

/** 이미 저장한 쪽을 다시 보내면 200, 쪽을 건너뛰면 409 */
export function saveReadingPage(assignmentId: number, page: number, body: SaveReadingPageRequest) {
  return apiRequest<SaveReadingPageResponse>(`/assignments/${assignmentId}/reading/pages/${page}`, { method: "POST", body });
}

/** 아직 이해 질문 단계가 아니면 409 */
export function getQuestions(assignmentId: number) {
  return apiRequest<ComprehensionQuestion[]>(`/assignments/${assignmentId}/questions`);
}

/** 채점은 서버가 한다(최대 2회). 이미 끝난 문제면 409 */
export function submitChoice(assignmentId: number, questionId: number, body: ChoiceAttemptRequest) {
  return apiRequest<ChoiceAttemptResponse>(`/assignments/${assignmentId}/questions/${questionId}/attempts`, { method: "POST", body });
}

/** 아직 순서 맞추기 단계가 아니면 409 */
export function getOrdering(assignmentId: number) {
  return apiRequest<OrderingResponse>(`/assignments/${assignmentId}/ordering`);
}

/** 채점은 서버가 한다(최대 3회). 이미 끝났으면 409 */
export function submitOrdering(assignmentId: number, body: OrderingAttemptRequest) {
  return apiRequest<OrderingAttemptResponse>(`/assignments/${assignmentId}/ordering/attempts`, { method: "POST", body });
}
