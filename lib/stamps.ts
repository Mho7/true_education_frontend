"use client";

import { useSyncExternalStore } from "react";

/** 보물상자에서 스탬프 2개가 나올 확률 */
export const DOUBLE_STAMP_CHANCE = 0.2;

/** 보물상자를 열었을 때 받을 스탬프 수 (1개 또는 2개) */
export function rollTreasureStamps(): 1 | 2 {
  return Math.random() < DOUBLE_STAMP_CHANCE ? 2 : 1;
}

// TODO: 백엔드가 준비되면 서버 저장소로 교체한다. 지금은 브라우저(localStorage)에만 쌓인다.
const STORAGE_KEY = "yeoul.stamps.v1";
const CHANGE_EVENT = "yeoul:stamps-change";

function readCount(): number {
  try {
    return Math.max(0, Number(window.localStorage.getItem(STORAGE_KEY) ?? 0) || 0);
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

/** 지금까지 모은 스탬프 수 */
export function useStampCount(): number {
  return useSyncExternalStore(subscribe, readCount, () => 0);
}

function writeCount(count: number) {
  window.localStorage.setItem(STORAGE_KEY, String(count));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function addStamps(count: number) {
  writeCount(readCount() + count);
}

/** 스탬프를 비운다 (개발용) */
export function clearStamps() {
  writeCount(0);
}
