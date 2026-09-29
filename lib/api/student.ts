import { apiRequest } from "./client";
import type { LinkResponse, RewardBoardResponse, ShelfBook, ShelfItem, StampTotalResponse, StudentLinkRequest } from "./types";

/** 내가 모은 스탬프 수(책을 완료할 때 서버가 적립한다) */
export function getMyStamps() {
  return apiRequest<StampTotalResponse>("/students/me/stamps");
}

/** 보호자가 정한 내 보상판(읽기 전용) */
export function getMyRewards() {
  return apiRequest<RewardBoardResponse>("/students/me/rewards");
}

/** 다 만든 책 목록 */
export function getBookshelf() {
  return apiRequest<ShelfItem[]>("/bookshelf");
}

/** 서재 책 한 권(다시 읽기): 본문, 이해 질문·순서 맞추기 시도 기록, 표지 설명. 완료하지 않은 책이면 404 */
export function getShelfBook(assignmentId: number) {
  return apiRequest<ShelfBook>(`/bookshelf/${assignmentId}`);
}

/** 나에게 온 보호자 연결 요청(대기 중인 것만) */
export function getMyLinkRequests() {
  return apiRequest<StudentLinkRequest[]>("/students/me/link-requests");
}

/** 수락하면 이때 연결된다. 대기 중인 요청이 없으면 404 */
export function acceptLinkRequest(parentId: number) {
  return apiRequest<LinkResponse>(`/students/me/link-requests/${parentId}/accept`, { method: "POST" });
}

export function rejectLinkRequest(parentId: number) {
  return apiRequest<LinkResponse>(`/students/me/link-requests/${parentId}/reject`, { method: "POST" });
}
