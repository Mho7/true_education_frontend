import { addLinkRequest, listLinkRequests, removeLinkRequest } from "@/lib/linkRequests";
import { getCurrentMember } from "@/lib/session";
import { ApiError, apiRequest } from "./client";
import type { DashboardResponse, LinkedStudent, LinkRequest, RewardBoardResponse, SetRewardRequest } from "./types";

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
// ⚠ 백엔드에 연결 요청 API가 아직 없어서 브라우저(localStorage)에 저장한 요청으로 흉내 낸다.
// 지금 서버에서는 보호자 가입 때 입력한 학생 코드로만 연결된다. 아이가 수락해도 서버 연결은 생기지 않는다.
// TODO(백엔드 요청): GET·POST /parents/me/link-requests, DELETE /parents/me/link-requests/:requestId와 학생 수락 API

/** 실제 요청처럼 잠깐 기다렸다 돌려준다 */
const respond = <T,>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), 250));

/** 이 보호자가 보낸 연결 요청 (보호자·학생이 같은 브라우저에 저장된 요청을 나눠 본다) */
function myLinkRequests() {
  const loginId = getCurrentMember()?.loginId ?? "";
  return listLinkRequests().filter((request) => request.guardianLoginId === loginId);
}

/** 아이가 아직 수락하지 않은 연결 요청 */
export function getLinkRequests() {
  return respond<LinkRequest[]>(
    myLinkRequests()
      .filter((request) => request.status === "PENDING")
      .map(({ id, studentCode, requestedAt }) => ({ requestId: id, studentCode, requestedAt })),
  );
}

/** 학생 코드로 연결을 요청한다. 이미 요청해 둔 코드는 409 */
export async function requestStudentLink(studentCode: string) {
  // 학생 코드는 대소문자를 구분하므로 앞뒤 공백만 지운다.
  const code = studentCode.trim();
  if (!code) throw new ApiError(400, "학생 코드를 입력해 주세요.");
  const existing = myLinkRequests().find((request) => request.studentCode === code);
  if (existing) throw new ApiError(409, existing.status === "ACCEPTED" ? "이미 연결된 아이예요." : "이미 연결을 요청한 코드예요.");
  const guardian = getCurrentMember();
  const saved = addLinkRequest({ guardianLoginId: guardian?.loginId ?? "", guardianName: guardian?.name || "보호자", studentCode: code });
  return respond<LinkRequest>({ requestId: saved.id, studentCode: saved.studentCode, requestedAt: saved.requestedAt });
}

/** 아이가 수락하기 전의 요청을 취소한다 */
export async function cancelLinkRequest(requestId: number) {
  const request = myLinkRequests().find((r) => r.id === requestId && r.status === "PENDING");
  if (!request) throw new ApiError(404, "이미 처리된 요청이에요.");
  removeLinkRequest(requestId);
  return respond(undefined);
}
