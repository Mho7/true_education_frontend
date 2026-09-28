import { apiRequest } from "./client";
import type { RewardBoardResponse, ShelfItem, StampTotalResponse } from "./types";

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
