"use client";

import { useSyncExternalStore } from "react";

/** 보물상자에서 스탬프 2개가 나올 확률 (서버가 알려 준 수가 없을 때만 쓴다) */
export const DOUBLE_STAMP_CHANCE = 0.2;

/** 보물상자를 열었을 때 받을 스탬프 수 (1개 또는 2개) */
export function rollTreasureStamps(): 1 | 2 {
  return Math.random() < DOUBLE_STAMP_CHANCE ? 2 : 1;
}

// 실제 스탬프는 책을 완료할 때 서버가 적립한다(설명 말하기 저장 응답의 stampsEarned, GET /students/me/stamps).
// 서버가 정한 이번 스탬프 수를 보물상자를 열 때까지 기억해 둔다.
// TODO(#5 백엔드 패치): 보물상자 연출이 GET /sessions/today의 stampsEarned를 쓰게 되면 이 기억은 빠진다.
const EARNED_KEY = "yeoul.stamps.earned.v1";

export function rememberEarnedStamps(count: number | undefined) {
  if (count !== 1 && count !== 2) return;
  try {
    window.localStorage.setItem(EARNED_KEY, String(count));
  } catch {
    // 못 적으면 보물상자가 1~2개 중 하나를 보여 준다(실제 적립은 서버 값).
  }
}

/** 기억해 둔 이번 스탬프 수를 꺼내고 지운다 */
export function takeEarnedStamps(): 1 | 2 | null {
  try {
    const value = Number(window.localStorage.getItem(EARNED_KEY));
    window.localStorage.removeItem(EARNED_KEY);
    return value === 1 || value === 2 ? value : null;
  } catch {
    return null;
  }
}

// 개발용 더미 스탬프(StampDevPanel). 개발 모드에서만 서버 스탬프 수에 더해 화면에 보여 준다.
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

/** 개발용 더미 스탬프 수 */
export function useDevStampCount(): number {
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
