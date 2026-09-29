export type BookTheme = "blue" | "green" | "pink" | "purple" | "yellow";

/** 그림 설명하기 결과 (아이가 말한 것을 받아 적은 글과 말한 시간) */
export type BookExplanation = {
  transcript: string;
  durationMs: number;
};

export type CompletedBook = {
  id: string;
  /** 서버 책장의 배정 id (펼친 책 화면이 GET /bookshelf/{id}로 내용을 불러온다) */
  assignmentId: number;
  /** 아이가 지은 책 제목 */
  title: string;
  /** 완성 시각 (ISO 문자열) */
  completedAt: string;
  theme: BookTheme;
  /** 표지 그림 영역에 넣을 이미지 URL (없으면 빈 종이색) */
  coverImage?: string;
};

// 책이 꽂힐 때마다 이 순서대로 표지 디자인이 돌아간다 (public/library/book-<theme>.png).
export const BOOK_THEMES: BookTheme[] = ["blue", "green", "pink", "purple", "yellow"];

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
