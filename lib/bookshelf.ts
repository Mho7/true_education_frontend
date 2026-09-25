"use client";

import { useSyncExternalStore } from "react";

export type BookTheme = "blue" | "green" | "pink" | "purple" | "yellow";

export type CompletedBook = {
  id: string;
  /** 아이가 지은 책 제목 */
  title: string;
  /** 완성 시각 (ISO 문자열) */
  completedAt: string;
  theme: BookTheme;
  /** 표지 그림 영역에 넣을 이미지 URL (없으면 빈 종이색) */
  coverImage?: string;
};

// TODO: 백엔드가 준비되면 서버 저장소로 교체한다. 지금은 브라우저(localStorage)에만 쌓인다.
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

/** 완성된 책 목록 (완성한 순서대로, 오래된 책이 앞) */
export function useCompletedBooks(): CompletedBook[] {
  return useSyncExternalStore(subscribe, readBooks, () => EMPTY);
}

/** 책 한 권을 완성했을 때 호출한다. 책장 맨 끝(다음 빈자리)에 자동으로 꽂힌다. */
export function addCompletedBook(book: { title: string; coverImage?: string }): CompletedBook {
  const books = readBooks();
  const next: CompletedBook = {
    id: crypto.randomUUID(),
    title: book.title,
    coverImage: book.coverImage,
    completedAt: new Date().toISOString(),
    theme: BOOK_THEMES[books.length % BOOK_THEMES.length],
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...books, next]));
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return next;
}

/** 책장을 비운다 (개발용 더미 데이터 정리 등) */
export function clearCompletedBooks() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
