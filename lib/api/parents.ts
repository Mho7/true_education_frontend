import { apiRequest } from "./client";
import type { CreateLinkRequest, DashboardResponse, LinkedStudent, LinkRequest, RewardBoardResponse, SetRewardRequest } from "./types";

export function getLinkedStudents() {
  return apiRequest<LinkedStudent[]>("/parents/me/students");
}

export function getDashboard(studentId: number) {
  return apiRequest<DashboardResponse>(`/parents/me/students/${studentId}/dashboard`);
}

export function getRewardBoard(studentId: number) {
  return apiRequest<RewardBoardResponse>(`/parents/me/students/${studentId}/rewards`);
}

/** 아이에게 이미 전한(선물했어요) 목표치는 409. 달성했어도 아직 전하지 않았으면 정하거나 바꿀 수 있다 */
export function setReward(studentId: number, milestone: number, body: SetRewardRequest) {
  return apiRequest<RewardBoardResponse>(`/parents/me/students/${studentId}/rewards/${milestone}`, { method: "PUT", body });
}

/** 아직 전하지 않은 리워드만 지울 수 있다(204) */
export function deleteReward(studentId: number, milestone: number) {
  return apiRequest<void>(`/parents/me/students/${studentId}/rewards/${milestone}`, { method: "DELETE" });
}

/** 보호자가 아이에게 리워드를 전했다고 기록한다. 달성했고 리워드를 정해 둔 목표치만 된다 */
export function markRewardGiven(studentId: number, milestone: number) {
  return apiRequest<RewardBoardResponse>(`/parents/me/students/${studentId}/rewards/${milestone}/given`, { method: "PUT" });
}

/** "선물했어요"를 잘못 눌렀을 때 되돌린다 */
export function unmarkRewardGiven(studentId: number, milestone: number) {
  return apiRequest<RewardBoardResponse>(`/parents/me/students/${studentId}/rewards/${milestone}/given`, { method: "DELETE" });
}

// ---------- 학생 코드로 연결 요청 ----------
// 보호자가 학생 코드로 요청하고, 아이가 설정에서 수락해야 연결된다.

/** 보낸 연결 요청(대기 중·거절됨). 수락된 아이는 getLinkedStudents에 나온다 */
export function getLinkRequests() {
  return apiRequest<LinkRequest[]>("/parents/me/link-requests");
}

/** 없는 코드면 404, 이미 연결됐거나 요청 중이면 409. agreements는 이 아이에 대한 동의 */
export function requestStudentLink(body: CreateLinkRequest) {
  return apiRequest<LinkRequest>("/parents/me/link-requests", { method: "POST", body });
}

/** 아이가 수락하기 전의 요청만 취소할 수 있다 */
export function cancelLinkRequest(studentId: number) {
  return apiRequest<void>(`/parents/me/link-requests/${studentId}`, { method: "DELETE" });
}
