"use client";

import { useSyncExternalStore } from "react";
import { BOOK_THEMES, type BookExplanation, type BookTheme } from "./bookshelf";

export type { BookExplanation };

/** 만들고 있는 책 한 권. 제목 짓기 → 그리기 → 그림 설명하기 → 책장에 꽂기까지 같은 초안을 이어서 쓴다. */
export type BookDraft = {
  id: string;
  title: string;
  /** 처음 만들 때 한 번만 무작위로 고르고, 다 만들 때까지 바꾸지 않는다 */
  theme: BookTheme;
  /** 시작 시각 (ISO 문자열). 표지 미리보기의 날짜로 쓴다. */
  startedAt: string;
  /** 그리기를 끝냈을 때 저장한 표지 그림 (data URL) */
  coverImage?: string;
  /** 그림 설명하기에서 "완성하기"를 눌렀을 때 저장한 이야기 */
  explanation?: BookExplanation;
};

/** 초안이 사라진 채(사이트 데이터 삭제 등) 보물상자에서 그리기로 넘어갈 때만 쓰는 제목 */
export const DEFAULT_DRAFT_TITLE = "나의 그림책";

// 보물상자를 찾은 상태(localStorage)와 함께 남아야 하므로 초안도 localStorage에 둔다.
// 탭을 닫았다 다시 와도 이어서 그릴 수 있고, 새로고침해도 표지 색이 다시 뽑히지 않는다.
const STORAGE_KEY = "yeoul.bookDraft.v1";
const CHANGE_EVENT = "yeoul:book-draft-change";
/** 이번 바퀴에 받을 책 표지 색. "오늘 읽을 책은?" 소개에서 먼저 정해 보여 주고, 책을 만들 때 그대로 쓴다. */
const ROUND_THEME_KEY = "yeoul.bookTheme.v1";

let cachedRaw: string | null = null;
let cachedDraft: BookDraft | null = null;
// 저장소를 아예 쓸 수 없는 환경(사이트 데이터 차단 등)에서도 이번 화면에서는 같은 초안을 쓰도록 메모리에도 둔다.
let memoryDraft: BookDraft | null = null;

function isDraft(value: unknown): value is BookDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<BookDraft>;
  return (
    typeof draft.id === "string" &&
    typeof draft.title === "string" &&
    typeof draft.startedAt === "string" &&
    BOOK_THEMES.includes(draft.theme as BookTheme)
  );
}

function readDraft(): BookDraft | null {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return memoryDraft;
  }
  // useSyncExternalStore는 같은 값이면 같은 참조를 돌려받아야 하므로 원문이 바뀔 때만 다시 파싱한다.
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      cachedDraft = isDraft(parsed) ? parsed : null;
    } catch {
      cachedDraft = null;
    }
  }
  return cachedDraft;
}

/** 저장에 성공하면 true (저장 공간이 모자라면 false) */
function writeDraft(draft: BookDraft | null): boolean {
  memoryDraft = draft;
  let saved = true;
  try {
    if (draft) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    saved = false;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return saved;
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function newId() {
  // randomUUID는 https·localhost에서만 있다 (같은 와이파이의 태블릿에서 http로 열 때 대비).
  return typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** 만들고 있는 책 (서버 렌더와 첫 화면에서는 null) */
export function useBookDraft(): BookDraft | null {
  return useSyncExternalStore(subscribe, readDraft, () => null);
}

/** 만들고 있는 책 (렌더 밖에서 바로 확인할 때) */
export function readBookDraft(): BookDraft | null {
  return readDraft();
}

function randomTheme(): BookTheme {
  return BOOK_THEMES[Math.floor(Math.random() * BOOK_THEMES.length)];
}

function readRoundTheme(): BookTheme | null {
  try {
    const value = window.localStorage.getItem(ROUND_THEME_KEY);
    return BOOK_THEMES.includes(value as BookTheme) ? (value as BookTheme) : null;
  } catch {
    return null;
  }
}

/** 이번 바퀴에 받을 책 표지 색 (아직 안 정했거나 서버 렌더면 null) */
export function useRoundTheme(): BookTheme | null {
  return useSyncExternalStore(subscribe, readRoundTheme, () => null);
}

/** 이번 바퀴 책 표지 색을 아직 안 정했으면 무작위로 정한다. 렌더 중이 아니라 effect·이벤트에서 부른다. */
export function ensureRoundTheme() {
  if (readRoundTheme()) return;
  try {
    window.localStorage.setItem(ROUND_THEME_KEY, randomTheme());
  } catch {
    return;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** 한 바퀴를 끝내 다음 책으로 넘어갈 때 지운다. 다음 소개에서 새 색을 뽑는다. */
export function clearRoundTheme() {
  try {
    window.localStorage.removeItem(ROUND_THEME_KEY);
  } catch {
    // 저장소를 못 쓰면 지울 것도 없다.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * 새 책을 시작한다. 남아 있던 초안이 있어도 버리고 새로 만든다. 표지 색은 소개에서 정해 둔 이번 바퀴 색을 쓰고,
 * 없으면(소개를 건너뛴 경우) 여기서 한 번만 무작위로 고른다. 렌더 중이 아니라 이벤트에서 부른다.
 */
export function startBookDraft(title: string): BookDraft {
  const draft: BookDraft = {
    id: newId(),
    title,
    theme: readRoundTheme() ?? randomTheme(),
    startedAt: new Date().toISOString(),
  };
  writeDraft(draft);
  return draft;
}

/** 초안의 제목·표지 그림·이야기를 바꾼다. 표지 색(theme)은 바꿀 수 없다. */
export function updateBookDraft(patch: Pick<Partial<BookDraft>, "title" | "coverImage" | "explanation">): boolean {
  const draft = readDraft();
  if (!draft) return false;
  return writeDraft({ ...draft, ...patch });
}

/** 책을 다 만들었거나 그만둘 때 초안을 지운다 */
export function clearBookDraft() {
  writeDraft(null);
}
