"use client";

import { useSyncExternalStore } from "react";
import { BOOK_THEMES, type BookTheme } from "./bookshelf";

/** 그림 설명하기 결과 (아이가 말한 것을 받아 적은 글과 말한 시간) */
export type BookExplanation = {
  transcript: string;
  durationMs: number;
};

/** 만들고 있는 책 한 권. 그리기 → 그림 설명하기 → 책장에 꽂기까지 같은 초안을 이어서 쓴다. */
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

// TODO: 제목 짓기(4단계)를 끝낼 때 아이가 지은 제목으로 초안을 만들도록 연결한다.
// 지금은 그리기 화면에 초안 없이 들어오면 이 제목으로 새로 만든다.
export const DEFAULT_DRAFT_TITLE = "나의 그림책";

// 새로고침해도 표지 색이 다시 뽑히지 않도록 탭(sessionStorage)에 둔다. 탭을 닫으면 사라진다.
const STORAGE_KEY = "yeoul.bookDraft.v1";
const CHANGE_EVENT = "yeoul:book-draft-change";

let cachedRaw: string | null = null;
let cachedDraft: BookDraft | null = null;
// sessionStorage를 아예 쓸 수 없는 환경(사이트 데이터 차단 등)에서도 이번 화면에서는 같은 초안을 쓰도록 메모리에도 둔다.
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
    raw = window.sessionStorage.getItem(STORAGE_KEY);
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
    if (draft) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    else window.sessionStorage.removeItem(STORAGE_KEY);
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

/** 초안이 있으면 그대로 돌려주고, 없을 때만 표지 색을 무작위로 골라 새로 만든다. 렌더 중이 아니라 effect·이벤트에서 부른다. */
export function ensureBookDraft(title: string = DEFAULT_DRAFT_TITLE): BookDraft {
  const existing = readDraft();
  if (existing) return existing;
  const draft: BookDraft = {
    id: newId(),
    title,
    theme: BOOK_THEMES[Math.floor(Math.random() * BOOK_THEMES.length)],
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
