"use client";

import { useCallback, useEffect, useState } from "react";
import { getMyLinkRequests } from "@/lib/api/student";
import type { StudentLinkRequest } from "@/lib/api/types";

// 학생에게 온 보호자 연결 요청(GET /students/me/link-requests). 홈 메뉴의 빨간 점과 설정의 수락·거절 목록이 함께 쓴다.
// 한 곳에서 수락·거절하면 notifyLinkRequestsChanged로 다른 곳도 다시 불러오게 한다.
const CHANGE_EVENT = "yeoul:link-requests-change";
const EMPTY: StudentLinkRequest[] = [];

export function notifyLinkRequestsChanged() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** 학생일 때만(enabled) 불러온다. 창으로 돌아올 때도 다시 불러와 보호자가 방금 보낸 요청이 보이게 한다 */
export function useStudentLinkRequests(enabled: boolean) {
  const [requests, setRequests] = useState<StudentLinkRequest[]>(EMPTY);

  const reload = useCallback(() => {
    getMyLinkRequests()
      .then(setRequests)
      .catch(() => setRequests(EMPTY));
  }, []);

  useEffect(() => {
    if (!enabled) return;
    reload();
    window.addEventListener(CHANGE_EVENT, reload);
    window.addEventListener("focus", reload);
    return () => {
      window.removeEventListener(CHANGE_EVENT, reload);
      window.removeEventListener("focus", reload);
    };
  }, [enabled, reload]);

  return enabled ? requests : EMPTY;
}
