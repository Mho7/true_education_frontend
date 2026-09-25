"use client";

import { useSyncExternalStore } from "react";
import { LESSON_COUNT } from "./studyLessons";

// 학습 지도와 각 단계 페이지를 오가도 어디까지 했는지 기억한다.
// TODO: 백엔드가 준비되면 서버 저장소로 교체한다. 지금은 브라우저(localStorage)에만 저장한다.
const STORAGE_KEY = "yeoul.study.cleared.v1";
const CHANGE_EVENT = "yeoul:study-change";

function readCleared(): number {
  try {
    const value = Number(window.localStorage.getItem(STORAGE_KEY) ?? 0) || 0;
    return Math.min(Math.max(value, 0), LESSON_COUNT);
  } catch {
    return 0;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** 끝낸 단계 수 (0~4) */
export function useClearedLessons(): number {
  return useSyncExternalStore(subscribe, readCleared, () => 0);
}

function writeCleared(count: number) {
  window.localStorage.setItem(STORAGE_KEY, String(count));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** step단계를 끝냈을 때 호출한다. 이미 더 많이 끝냈으면 그대로 둔다. */
export function completeLesson(step: number) {
  writeCleared(Math.max(readCleared(), Math.min(step, LESSON_COUNT)));
}

/** 보물상자까지 열어 한 바퀴를 끝내면 처음부터 다시 시작한다. */
export function resetStudyProgress() {
  writeCleared(0);
}
