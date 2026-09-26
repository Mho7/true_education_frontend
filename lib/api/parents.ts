import { apiRequest } from "./client";
import type { DashboardResponse, LinkedStudent, RewardBoardResponse, SetRewardRequest } from "./types";

export function getLinkedStudents() {
  return apiRequest<LinkedStudent[]>("/parents/me/students");
}

export function getDashboard(studentId: number) {
  return apiRequest<DashboardResponse>(`/parents/me/students/${studentId}/dashboard`);
}

export function getRewardBoard(studentId: number) {
  return apiRequest<RewardBoardResponse>(`/parents/me/students/${studentId}/rewards`);
}

/** 이미 달성한 목표치는 409 */
export function setReward(studentId: number, milestone: number, body: SetRewardRequest) {
  return apiRequest<RewardBoardResponse>(`/parents/me/students/${studentId}/rewards/${milestone}`, { method: "PUT", body });
}

/** 달성 전에만 지울 수 있다(204) */
export function deleteReward(studentId: number, milestone: number) {
  return apiRequest<void>(`/parents/me/students/${studentId}/rewards/${milestone}`, { method: "DELETE" });
}
