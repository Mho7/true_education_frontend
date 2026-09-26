"use client";

import { useSyncExternalStore } from "react";

export type BookTheme = "blue" | "green" | "pink" | "purple" | "yellow";

/** 그림 설명하기 결과 (아이가 말한 것을 받아 적은 글과 말한 시간) */
export type BookExplanation = {
  transcript: string;
  durationMs: number;
};

export type CompletedBook = {
  id: string;
  /** 아이가 지은 책 제목 */
  title: string;
  /** 완성 시각 (ISO 문자열) */
  completedAt: string;
  theme: BookTheme;
  /** 표지 그림 영역에 넣을 이미지 URL (없으면 빈 종이색) */
  coverImage?: string;
  /** 아이가 표지 그림을 말로 설명한 것 */
  explanation?: BookExplanation;
};

// 실제 책장은 서버(GET /bookshelf)에 있다. 여기 localStorage 목록은 개발용 더미 책(BookshelfDevPanel)만 담고,
// 개발 모드에서만 서버 책 뒤에 이어 보여 준다.
const STORAGE_KEY = "yeoul.bookshelf.v1";
const CHANGE_EVENT = "yeoul:bookshelf-change";
// 책이 꽂힐 때마다 이 순서대로 표지 디자인이 돌아간다 (public/library/book-<theme>.png).
export const BOOK_THEMES: BookTheme[] = ["blue", "green", "pink", "purple", "yellow"];
const EMPTY: CompletedBook[] = [];

let cachedRaw: string | null = null;
let cachedBooks: CompletedBook[] = EMPTY;

function readBooks(): CompletedBook[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY;
  }
  // useSyncExternalStore는 같은 값이면 같은 참조를 돌려받아야 하므로 원문이 바뀔 때만 다시 파싱한다.
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      cachedBooks = Array.isArray(parsed) ? (parsed as CompletedBook[]) : EMPTY;
    } catch {
      cachedBooks = EMPTY;
    }
  }
  return cachedBooks;
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** 개발용 더미 책 목록 (넣은 순서대로) */
export function useDevBooks(): CompletedBook[] {
  return useSyncExternalStore(subscribe, readBooks, () => EMPTY);
}

/**
 * 책 한 권을 완성했을 때 호출한다. 책장 맨 끝(다음 빈자리)에 자동으로 꽂힌다.
 * id를 주면 같은 id의 책이 이미 있을 때 새로 꽂지 않고 그 책을 돌려준다 (새로고침·두 번 누르기 대비).
 * theme을 주지 않으면 꽂는 순서대로 표지 디자인이 돌아간다. 저장 공간이 모자라 못 꽂으면 null.
 */
export function addCompletedBook(book: {
  id?: string;
  title: string;
  theme?: BookTheme;
  coverImage?: string;
  explanation?: BookExplanation;
}): CompletedBook | null {
  const books = readBooks();
  const existing = book.id ? books.find((saved) => saved.id === book.id) : undefined;
  if (existing) return existing;
  const next: CompletedBook = {
    id: book.id ?? crypto.randomUUID(),
    title: book.title,
    coverImage: book.coverImage,
    completedAt: new Date().toISOString(),
    theme: book.theme ?? BOOK_THEMES[books.length % BOOK_THEMES.length],
    explanation: book.explanation,
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...books, next]));
  } catch {
    return null;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return next;
}

/** 책장을 비운다 (개발용 더미 데이터 정리 등) */
export function clearCompletedBooks() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// 서버는 표지 색을 모른다. 책을 완성할 때 아이가 보던 표지 색을 배정 id별로 기억해 책장에서도 같은 색으로 보여 준다.
const THEME_KEY = "yeoul.bookshelf.themes.v1";

function readThemes(): Record<string, BookTheme> {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(THEME_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? (parsed as Record<string, BookTheme>) : {};
  } catch {
    return {};
  }
}

export function rememberBookTheme(assignmentId: number, theme: BookTheme) {
  try {
    window.localStorage.setItem(THEME_KEY, JSON.stringify({ ...readThemes(), [assignmentId]: theme }));
  } catch {
    // 못 적으면 책장에서 배정 id로 정한 색을 쓴다.
  }
}

/** 책장에 그릴 표지 색. 기억한 색이 없으면(다른 기기에서 완성 등) 배정 id로 늘 같은 색을 고른다. 브라우저에서만 부른다. */
export function bookThemeFor(assignmentId: number): BookTheme {
  const saved = readThemes()[assignmentId];
  return BOOK_THEMES.includes(saved) ? saved : BOOK_THEMES[assignmentId % BOOK_THEMES.length];
}
