"use client";

import { useSyncExternalStore } from "react";

/** 도장 5개마다(5, 10, 15, …번째) 보호자가 정한 선물을 받는다. */
export const REWARD_EVERY = 5;

export function isRewardStamp(stampNumber: number) {
  return stampNumber > 0 && stampNumber % REWARD_EVERY === 0;
}

/** 도장 번호(5, 10, …) → 보호자가 적은 선물 */
export type Rewards = Record<number, string>;

// TODO: 백엔드가 준비되면 서버 저장소로 교체한다. 지금은 브라우저(localStorage)에만 저장한다.
// 학생 코드별로 나눠 둔다. 보호자 계정의 studentCode가 연결된 학생 코드라서 보호자와 학생이 같은 목록을 본다.
const STORAGE_KEY = "yeoul.rewards.v1";
const CHANGE_EVENT = "yeoul:rewards-change";
const EMPTY: Rewards = {};

type Store = Record<string, Rewards>;

let cachedRaw: string | null = null;
let cachedStore: Store = {};

function readStore(): Store {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return {};
  }
  // useSyncExternalStore는 같은 값이면 같은 참조를 돌려받아야 하므로 원문이 바뀔 때만 다시 파싱한다.
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      const parsed: unknown = raw ? JSON.parse(raw) : {};
      cachedStore = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Store) : {};
    } catch {
      cachedStore = {};
    }
  }
  return cachedStore;
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** 이 학생에게 걸린 선물 목록 */
export function useRewards(studentCode: string | undefined): Rewards {
  return useSyncExternalStore(
    subscribe,
    () => readStore()[studentCode ?? ""] ?? EMPTY,
    () => EMPTY,
  );
}

/** 보호자가 선물을 정하거나 바꾼다. 빈 글이면 선물을 지운다. */
export function setReward(studentCode: string | undefined, stampNumber: number, reward: string) {
  const store = readStore();
  const key = studentCode ?? "";
  const next: Rewards = { ...store[key] };
  const text = reward.trim();
  if (text) next[stampNumber] = text;
  else delete next[stampNumber];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...store, [key]: next }));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
