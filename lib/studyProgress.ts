"use client";

import { useSyncExternalStore } from "react";
import { LESSON_COUNT } from "./studyLessons";

// 학습 지도와 각 단계 페이지를 오가도 어디까지 했는지 기억한다.
// TODO: 백엔드가 준비되면 서버 저장소로 교체한다. 지금은 브라우저(localStorage)에만 저장한다.
const STORAGE_KEY = "yeoul.study.cleared.v1";
const CHANGE_EVENT = "yeoul:study-change";

/**
 * 4단계를 끝낸 뒤 보물상자 진행 상태.
 * found          — 보물상자를 찾았지만 아직 표지를 그리지 않았다 (열 수 없다)
 * reward-pending — 표지 그리기·설명하기를 끝내 책장에 책을 꽂았다. 학습 지도에 오면 바로 상자를 연다
 * 없음            — 아직 못 찾았거나, 상자를 열어 스탬프를 받았다 (resetStudyProgress가 지운다)
 */
export type TreasureState = "found" | "reward-pending";
const TREASURE_KEY = "yeoul.study.treasure.v1";

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
  try {
    window.localStorage.removeItem(TREASURE_KEY);
  } catch {
    // 저장소를 못 쓰면 지울 것도 없다.
  }
  writeCleared(0);
}

/** 보물상자 진행 상태 (렌더 밖에서 바로 확인할 때) */
export function readTreasureState(): TreasureState | null {
  try {
    const value = window.localStorage.getItem(TREASURE_KEY);
    return value === "found" || value === "reward-pending" ? value : null;
  } catch {
    return null;
  }
}

export function useTreasureState(): TreasureState | null {
  return useSyncExternalStore(subscribe, readTreasureState, () => null);
}

function writeTreasureState(state: TreasureState) {
  window.localStorage.setItem(TREASURE_KEY, state);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** 보물상자에 처음 도착했을 때. 이미 보상을 기다리는 중이면 되돌리지 않는다. */
export function markTreasureFound() {
  if (readTreasureState() === null) writeTreasureState("found");
}

/** 표지 그리기·설명하기를 끝내 책장에 책을 꽂았을 때. 다음에 학습 지도에 오면 상자를 연다. */
export function markTreasureRewardPending() {
  writeTreasureState("reward-pending");
}
