// 보호자 홈(시안 abcc.png) 화면 데이터. 화면은 GuardianHomeData 하나만 받아 그리고,
// 서버 응답(보호자 대시보드·보상판)은 toGuardianHomeData로 이 모양으로 바꾼다.

import type { DashboardResponse, LearningStage, RewardBoardResponse } from "@/lib/api/types";

export type LearningRecord = {
  id: string;
  /** YYYY-MM-DD (읽는 중인 책은 없다) */
  date: string | null;
  title: string;
  /** 표지 그림(없으면 색 칸) */
  coverUrl?: string;
  coverColor: string;
  /** COMPLETED: 다 읽음 / IN_PROGRESS: 읽는 중 */
  status: "COMPLETED" | "IN_PROGRESS";
  /** 읽는 중일 때 지금 하고 있는 활동 */
  stageLabel?: string;
  /**
   * 아이가 그린 표지를 말로 설명한 글(음성 인식으로 받아 적은 것).
   * TODO: 책별 문제 해결 결과(혼자·힌트 후·정답 공개)를 주는 보호자 API가 생기면 함께 보여 준다.
   */
  reflection?: string;
};

export type GuardianHomeData = {
  childName: string;
  summary: {
    /** 고른 주에 학습한 날 수 (읽기 기록이 있거나 책을 다 읽은 날. 읽기 속도 값은 쓰지 않고 날짜만 쓴다) */
    sessions: number;
    /** 다 읽은 책(누적) */
    books: number;
    /** 푼 문제 수(누적) */
    activities: number;
  };
  /** 최근 학습 기록(읽는 중인 책이 맨 위, 그다음 최근에 다 읽은 순) */
  records: LearningRecord[];
  reward: { current: number; goal: number; nextName?: string };
  story:
    | { kind: "collecting"; message: string }
    | { kind: "comments"; good: string | null; help: string | null };
};

export const LEARNING_STAGE_LABELS: Record<LearningStage, string> = {
  READING: "번갈아 읽기",
  QUESTION: "이해 질문",
  ORDERING: "순서 맞추기",
  TITLE: "제목 짓기",
  DRAWING: "그림 그리기",
  REFLECTION: "설명 말하기",
  COMPLETED: "다 읽음",
};

/** 표지 그림이 없을 때 책마다 늘 같은 색 칸 */
const COVER_COLORS = ["#9CC7EC", "#D9C29A", "#6FA8DC", "#B7D59A", "#E8A9A0", "#B9A7E0"];
export const coverColorFor = (assignmentId: number) => COVER_COLORS[assignmentId % COVER_COLORS.length];

/** 주 시작일(월요일) */
export function weekStartOf(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** 서버 날짜(ISO)를 이 기기 날짜 YYYY-MM-DD로 */
export const localDate = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso.slice(0, 10) : dateKey(date);
};

export function toGuardianHomeData({
  childName,
  dashboard,
  rewards,
  weekStart,
}: {
  childName: string;
  dashboard: DashboardResponse;
  rewards: RewardBoardResponse | null;
  weekStart: Date;
}): GuardianHomeData {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const [from, to] = [dateKey(weekStart), dateKey(weekEnd)];
  // 학습한 날: 읽기 기록이 있는 날 + 책을 다 읽은 날 (하루 한 권이라 날 수가 곧 학습 횟수다)
  const studyDays = new Set([
    ...dashboard.readingSpeed.map(({ date }) => date),
    ...dashboard.reflections.map(({ completedAt }) => localDate(completedAt)),
  ]);
  const sessions = [...studyDays].filter((date) => date >= from && date <= to).length;

  const { inProgress } = dashboard.summary;
  const records: LearningRecord[] = [
    ...(inProgress
      ? [
          {
            id: `in-progress-${inProgress.assignmentId}`,
            date: null,
            title: inProgress.title,
            coverColor: coverColorFor(inProgress.assignmentId),
            status: "IN_PROGRESS" as const,
            stageLabel: LEARNING_STAGE_LABELS[inProgress.stage] ?? inProgress.stage,
          },
        ]
      : []),
    ...dashboard.reflections.map<LearningRecord>((reflection) => ({
      id: `done-${reflection.assignmentId}`,
      date: localDate(reflection.completedAt),
      title: reflection.title,
      coverColor: coverColorFor(reflection.assignmentId),
      coverUrl: reflection.coverImageUrl ?? undefined,
      status: "COMPLETED",
      reflection: reflection.transcript,
    })),
  ].slice(0, 3);

  // 보상판: 목표치 사이에서 몇 개 모았는지 (예: 도장 7개, 다음 목표 10 → 2 / 5)
  const goal = rewards?.stampsPerReward ?? 5;
  const current = rewards ? Math.min(Math.max(goal - (rewards.nextMilestone - rewards.stampTotal), 0), goal) : dashboard.summary.stampTotal % goal;
  const nextName = rewards?.rewards.find((reward) => reward.milestone === rewards.nextMilestone)?.name;

  const textsOf = (status: string) => dashboard.comments.filter((comment) => comment.status === status).map((comment) => comment.text);
  const good = [...textsOf("COMFORTABLE"), ...textsOf("NORMAL")];
  const help = textsOf("NEEDS_HELP");

  return {
    childName,
    summary: {
      sessions,
      books: dashboard.summary.completedBooks,
      activities: dashboard.byStage.reduce((sum, row) => sum + row.total, 0),
    },
    records,
    reward: { current, goal, nextName },
    story: dashboard.collecting
      ? { kind: "collecting", message: dashboard.collectingMessage ?? "데이터를 모으고 있어요" }
      : { kind: "comments", good: good.length ? good.join(" ") : null, help: help.length ? help.join(" ") : null },
  };
}
