import { apiRequest } from "./client";
import type { ReadingResponse, SaveReadingPageRequest, SaveReadingPageResponse, TodayResponse } from "./types";

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
