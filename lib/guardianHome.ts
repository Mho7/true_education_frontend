// 보호자 홈(시안 abcc.png) 화면 데이터. 서버(페이지)와 클라이언트가 함께 쓰므로 "use client"를 붙이지 않는다.
// 화면은 GuardianHomeData 하나만 받아 그린다. 백엔드 연동 때는 API 응답을 이 모양으로 바꿔 넘기면 된다.

/** 문제를 어떻게 해결했는지 */
export type SolveOutcome = "SELF" | "HINT" | "REREAD";

/** 활동 종류(아이콘·이름) */
export type SkillKind = "CAUSE" | "EMOTION" | "CHARACTER_EVENT" | "SUMMARY_TITLE";

export type LearningRecord = {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  title: string;
  /** 아이가 그린 표지(없으면 색 칸) */
  coverUrl?: string;
  coverColor: string;
  completed: boolean;
  results: { skill: SkillKind; outcome: SolveOutcome }[];
};

export type GuardianHomeData = {
  childName: string;
  summary: { sessions: number; books: number; activities: number };
  /** 최근 학습 기록(최신 순) */
  records: LearningRecord[];
  reward: { current: number; goal: number };
  story: { good: string; help: string } | null;
};

export const SKILL_LABELS: Record<SkillKind, string> = {
  CAUSE: "원인 이해",
  EMOTION: "마음 이해",
  CHARACTER_EVENT: "인물과 사건",
  SUMMARY_TITLE: "요약과 제목",
};

export const OUTCOME_LABELS: Record<SolveOutcome, string> = {
  SELF: "혼자 해결",
  HINT: "힌트 후 해결",
  REREAD: "다시 읽고 해결",
};

/** 주 시작일(월요일) */
export function weekStartOf(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

const SAMPLE_WEEK: Omit<GuardianHomeData, "childName"> = {
  summary: { sessions: 4, books: 3, activities: 18 },
  records: [
    {
      id: "sample-cloud-bread",
      date: "2026-09-26",
      title: "구름빵",
      coverColor: "#9CC7EC",
      completed: true,
      results: [
        { skill: "CAUSE", outcome: "REREAD" },
        { skill: "EMOTION", outcome: "SELF" },
      ],
    },
    {
      id: "sample-dog-poop",
      date: "2026-09-24",
      title: "강아지똥",
      coverColor: "#D9C29A",
      completed: true,
      results: [
        { skill: "CAUSE", outcome: "HINT" },
        { skill: "CHARACTER_EVENT", outcome: "SELF" },
      ],
    },
    {
      id: "sample-rainbow-fish",
      date: "2026-09-20",
      title: "무지개 물고기",
      coverColor: "#6FA8DC",
      completed: true,
      results: [
        { skill: "EMOTION", outcome: "SELF" },
        { skill: "SUMMARY_TITLE", outcome: "SELF" },
      ],
    },
  ],
  reward: { current: 4, goal: 5 },
  story: {
    good: "인물과 주요 사건을 기억하고 이야기의 순서를 정리하는 활동을 혼자 잘 해결했어요.",
    help: "사건의 원인을 설명하는 질문에서는 이야기를 한 번 더 확인한 뒤 답을 찾는 경우가 있었어요.",
  },
};

/**
 * 한 주의 보호자 홈 데이터. 주에 따라 바뀌는 것은 요약 숫자와 "이번 주 이야기"이고,
 * 최근 학습 기록·리워드는 주와 상관없이 최근 것을 보여 준다. 지금은 시안 예시(이번 주만 숫자가 있다)를 돌려준다.
 * TODO: feat/api-ready-ui의 보호자 API(GET /parents/me/students/{id}/dashboard 등)와 합칠 때 이 함수를 API 응답 변환으로 바꾼다.
 */
export function getSampleGuardianHome(childName: string, weekStart: Date, today = new Date()): GuardianHomeData {
  const isThisWeek = weekStartOf(today).getTime() === weekStart.getTime();
  if (isThisWeek) return { childName, ...SAMPLE_WEEK };
  return { childName, ...SAMPLE_WEEK, summary: { sessions: 0, books: 0, activities: 0 }, story: null };
}
