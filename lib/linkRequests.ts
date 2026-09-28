"use client";

import { useMemo, useSyncExternalStore } from "react";

// 보호자 → 학생 연결 요청. 보호자가 계정 관리에서 학생 코드로 요청하면, 학생이 설정에서 수락해야 연결된다.
// TODO: 연결 요청 API가 생기면 서버로 옮긴다. 지금은 보호자·학생 화면을 한 브라우저에서 확인할 수 있게 localStorage에 둔다.
const STORAGE_KEY = "yeoul.linkRequests.v1";
const CHANGE_EVENT = "yeoul:link-requests-change";

export type StoredLinkRequest = {
  id: number;
  guardianLoginId: string;
  guardianName: string;
  studentCode: string;
  status: "PENDING" | "ACCEPTED";
  requestedAt: string;
  /** 수락할 때 채운다 */
  studentId?: number;
  studentName?: string;
};

const EMPTY: StoredLinkRequest[] = [];

let cachedRaw: string | null = null;
let cachedRequests: StoredLinkRequest[] = EMPTY;

/** 저장된 요청 전체. useSyncExternalStore가 같은 참조를 받도록 원문이 바뀔 때만 다시 읽는다 */
export function listLinkRequests(): StoredLinkRequest[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedRequests = raw ? (JSON.parse(raw) as StoredLinkRequest[]) : EMPTY;
    } catch {
      cachedRequests = EMPTY;
    }
  }
  return cachedRequests;
}

function save(requests: StoredLinkRequest[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function addLinkRequest(request: Omit<StoredLinkRequest, "id" | "status" | "requestedAt">): StoredLinkRequest {
  const saved: StoredLinkRequest = { ...request, id: Date.now(), status: "PENDING", requestedAt: new Date().toISOString() };
  save([...listLinkRequests(), saved]);
  return saved;
}

/** 보호자의 요청 취소, 학생의 거절 */
export function removeLinkRequest(id: number) {
  save(listLinkRequests().filter((request) => request.id !== id));
}

/** 학생이 수락하면 연결된 아이가 된다 */
export function acceptLinkRequest(id: number, studentName: string) {
  save(
    listLinkRequests().map((request) =>
      request.id === id ? { ...request, status: "ACCEPTED" as const, studentId: Date.now(), studentName } : request,
    ),
  );
}

function subscribe(onChange: () => void) {
  // storage 이벤트: 다른 탭(보호자 화면)에서 보낸 요청도 바로 보이게 한다.
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** 이 학생 코드로 온, 아직 답하지 않은 요청 (학생 설정·홈 알림 점) */
export function usePendingLinkRequests(studentCode: string | undefined): StoredLinkRequest[] {
  const requests = useSyncExternalStore(subscribe, listLinkRequests, () => EMPTY);
  return useMemo(
    () => (studentCode ? requests.filter((r) => r.status === "PENDING" && r.studentCode === studentCode) : EMPTY),
    [requests, studentCode],
  );
}
