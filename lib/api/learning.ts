import { apiRequest } from "./client";
import type {
  ChoiceAttemptRequest,
  ChoiceAttemptResponse,
  ComprehensionQuestion,
  OrderingAttemptRequest,
  OrderingAttemptResponse,
  OrderingResponse,
  SaveDrawingResponse,
  SaveReflectionRequest,
  SaveReflectionResponse,
  SaveTitleRequest,
  SaveTitleResponse,
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

/** 제목 짓기 단계가 아니면 409 */
export function saveTitle(assignmentId: number, body: SaveTitleRequest) {
  return apiRequest<SaveTitleResponse>(`/assignments/${assignmentId}/title`, { method: "PUT", body });
}

/** 표지 그림(PNG/WebP, 2MB 이하). 그림 그리기 단계가 아니면 409 */
export function saveDrawing(assignmentId: number, image: Blob) {
  const form = new FormData();
  form.append("image", image, image.type === "image/webp" ? "cover.webp" : "cover.png");
  return apiRequest<SaveDrawingResponse>(`/assignments/${assignmentId}/drawing`, { method: "POST", body: form });
}

/** 마지막 단계. 저장하면 책을 완료하고 스탬프를 적립한다. 받아 적은 글이 비면 422, 설명 말하기 단계가 아니면 409 */
export function saveReflection(assignmentId: number, body: SaveReflectionRequest) {
  return apiRequest<SaveReflectionResponse>(`/assignments/${assignmentId}/reflection`, { method: "POST", body });
}
