"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

// 하루에 한 번만 학습(한 바퀴)을 할 수 있다. 보물상자를 열어 스탬프를 받은 날을 기억하고,
// 날짜가 바뀌면(자정 타이머 없이 오늘 날짜와 비교해서) 저절로 다시 할 수 있게 된다.
// TODO: 백엔드가 준비되면 서버 저장소로 교체한다. 지금은 브라우저(localStorage)에만 저장한다.
/** 마지막으로 학습을 끝낸 날 (YYYY-MM-DD) */
const COMPLETED_KEY = "yeoul.daily.completed.v1";
/** 홈에서 "오늘 책은 다 읽었어!" 안내를 저절로 띄운 날 (YYYY-MM-DD). 학습 진입 제한과는 따로다. */
const NOTICE_SEEN_KEY = "yeoul.daily.notice-seen.v1";
const CHANGE_EVENT = "yeoul:daily-study-change";

/** 오늘 학습을 끝낸 뒤 학습 화면에 바로 들어왔을 때, 홈으로 보내며 안내를 꼭 띄우라고 붙이는 주소 */
export const DAILY_STUDY_NOTICE_HREF = "/home?notice=daily-study";
const NOTICE_PARAM = "notice";
const NOTICE_PARAM_VALUE = "daily-study";

/** 기기 시간대 기준 오늘 날짜 (YYYY-MM-DD) */
function todayKey(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function readDate(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeDate(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // 저장소를 못 쓰면 하루 제한 없이 학습할 수 있게 둔다.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** 보물상자를 열어 스탬프를 받은 순간 부른다. 오늘 학습을 끝냈다고 기록한다. */
export function markDailyStudyCompleted() {
  writeDate(COMPLETED_KEY, todayKey());
}

export function hasCompletedStudyToday(): boolean {
  return readDate(COMPLETED_KEY) === todayKey();
}

/** 오늘 학습을 끝냈는지. 서버 렌더·첫 화면에서는 아직 모르므로 null이다. */
export function useCompletedStudyToday(): boolean | null {
  return useSyncExternalStore(subscribe, hasCompletedStudyToday, () => null);
}

/** 홈에서 완료 안내를 저절로 띄울 때 부른다. 같은 날 홈에 다시 와도 저절로는 뜨지 않는다. */
export function markCompletionNoticeSeen() {
  writeDate(NOTICE_SEEN_KEY, todayKey());
}

export function hasSeenCompletionNoticeToday(): boolean {
  return readDate(NOTICE_SEEN_KEY) === todayKey();
}

/**
 * 홈에 들어왔을 때 완료 안내를 띄울지 정한다.
 * - 학습 화면에 바로 들어왔다가 돌려보내진 경우(DAILY_STUDY_NOTICE_HREF)는 오늘 이미 봤어도 띄운다
 * - 그 밖에는 오늘 학습을 끝냈고 오늘 홈에서 아직 안내를 못 봤을 때만 띄운다
 * 띄우기로 했으면 본 날로 기록한다. 주소에 붙은 표시는 지워 새로고침해도 다시 뜨지 않게 한다.
 */
export function takeHomeCompletionNotice(): boolean {
  const url = new URL(window.location.href);
  const redirected = url.searchParams.get(NOTICE_PARAM) === NOTICE_PARAM_VALUE;
  if (redirected) {
    url.searchParams.delete(NOTICE_PARAM);
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  }
  if (!hasCompletedStudyToday()) return false;
  if (!redirected && hasSeenCompletionNoticeToday()) return false;
  markCompletionNoticeSeen();
  return true;
}

/**
 * 학습으로 들어가는 메뉴·버튼에서 쓴다. 오늘 학습을 끝냈으면 이동을 막고 완료 안내를 띄운다.
 * 이때는 홈에서 안내를 이미 봤어도 매번 띄운다.
 */
export function useStudyEntryGate() {
  const [noticeOpen, setNoticeOpen] = useState(false);
  /** true를 돌려주면 막은 것이다. 링크라면 이동을 취소해야 한다. */
  const blockStudyEntry = useCallback(() => {
    if (!hasCompletedStudyToday()) return false;
    setNoticeOpen(true);
    return true;
  }, []);
  const closeNotice = useCallback(() => setNoticeOpen(false), []);
  return { noticeOpen, blockStudyEntry, closeNotice };
}

/** 하루 학습 제한 상태만 지운다 (개발용). 스탬프·책장·초안 등 다른 기록은 건드리지 않는다. */
export function resetDailyStudyForDev() {
  try {
    window.localStorage.removeItem(COMPLETED_KEY);
    window.localStorage.removeItem(NOTICE_SEEN_KEY);
  } catch {
    // 저장소를 못 쓰면 지울 것도 없다.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
