// ⚠ 이 브랜치(main 기준)에는 백엔드 연동이 없어서 보호자 API를 예시 데이터로 흉내 낸다.
// 함수 이름·응답 모양은 실제 API(feat/api-ready-ui의 같은 파일)와 같다. 두 브랜치를 합칠 때는 그쪽 파일을 쓴다.

import { ApiError } from "./client";
import type { DashboardResponse, LinkedStudent, RewardBoardResponse, SetRewardRequest } from "./types";

const STAMPS_PER_REWARD = 5;
const SAMPLE_STAMP_TOTAL = 6;

/** 실제 요청처럼 잠깐 기다렸다 돌려준다 (로딩 화면 확인용) */
const respond = <T,>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), 250));

/** 오늘에서 days일 전(자정 기준)의 ISO 시각 */
function daysAgo(days: number, hour = 17) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function dateKey(iso: string) {
  const date = new Date(iso);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const SAMPLE_STUDENTS: LinkedStudent[] = [{ studentId: 1, name: "김다은" }];

function sampleDashboard(student: LinkedStudent): DashboardResponse {
  const reflections = [
    { assignmentId: 4, title: "구름빵", transcript: "구름빵을 먹고 하늘을 나는 고양이 남매를 그렸어요. 아빠한테 빵을 가져다주는 장면이 제일 좋았어요.", durationMs: 38000, completedAt: daysAgo(0) },
    { assignmentId: 3, title: "강아지똥", transcript: "강아지똥이 민들레 꽃을 피우는 걸 그렸어요. 작아도 쓸모가 있다는 게 멋있었어요.", durationMs: 42000, completedAt: daysAgo(2) },
    { assignmentId: 2, title: "무지개 물고기", transcript: "무지개 물고기가 친구들한테 비늘을 나눠 주는 모습이에요. 반짝이는 비늘을 많이 칠했어요.", durationMs: 35000, completedAt: daysAgo(9) },
    { assignmentId: 1, title: "작은 곰과 꿀단지", transcript: "곰이랑 토끼가 나무 아래에서 꿀을 먹는 그림이에요.", durationMs: 27000, completedAt: daysAgo(12) },
  ];
  const readingDays = [0, 1, 2, 4, 9, 12];
  return {
    student,
    summary: {
      completedBooks: reflections.length,
      stampTotal: SAMPLE_STAMP_TOTAL,
      inProgress: { assignmentId: 5, title: "빨간 우산", stage: "QUESTION" },
    },
    readingSpeed: readingDays.map((days, i) => ({
      date: dateKey(daysAgo(days)),
      syllablesPerMinute: 80 + i * 4,
      syllables: 160 + i * 10,
      durationMs: 120000,
    })),
    collecting: false,
    byStage: [
      { stage: "WHO", label: "누가", total: 4, firstTryRate: 1, afterRetryRate: 0, revealedRate: 0, status: "COMFORTABLE" },
      { stage: "WHAT", label: "무슨 일", total: 4, firstTryRate: 0.75, afterRetryRate: 0.25, revealedRate: 0, status: "NORMAL" },
      { stage: "WHY", label: "왜", total: 4, firstTryRate: 0.25, afterRetryRate: 0.5, revealedRate: 0.25, status: "NEEDS_HELP" },
      { stage: "EMOTION", label: "마음", total: 4, firstTryRate: 0.5, afterRetryRate: 0.25, revealedRate: 0.25, status: "NORMAL" },
      { stage: "ORDER", label: "순서 맞추기", total: 4, firstTryRate: 0.5, afterRetryRate: 0.5, revealedRate: 0, status: "NORMAL" },
    ],
    needsHelp: ["WHY"],
    comfortable: ["WHO"],
    comments: [
      { stage: "WHO", status: "COMFORTABLE", text: "등장인물을 잘 기억해요." },
      { stage: "WHY", status: "NEEDS_HELP", text: '이유를 찾는 질문을 어려워해요. "왜 그랬을까?"를 일상 대화에서도 자주 물어봐 주세요.' },
    ],
    reflections: reflections.map((reflection) => ({ ...reflection, coverImageUrl: null })),
  };
}

// 보상은 화면에서 정하고 지울 수 있게 메모리에 둔다 (새로고침하면 처음 예시로 돌아간다).
const rewardNames = new Map<number, string>([[5, "좋아하는 간식 먹기"]]);

function rewardBoard(): RewardBoardResponse {
  const nextMilestone = (Math.floor(SAMPLE_STAMP_TOTAL / STAMPS_PER_REWARD) + 1) * STAMPS_PER_REWARD;
  return {
    stampsPerReward: STAMPS_PER_REWARD,
    stampTotal: SAMPLE_STAMP_TOTAL,
    nextMilestone,
    rewards: [...rewardNames]
      .sort(([a], [b]) => a - b)
      .map(([milestone, name]) => ({ milestone, name, achieved: SAMPLE_STAMP_TOTAL >= milestone })),
  };
}

function findStudent(studentId: number) {
  const student = SAMPLE_STUDENTS.find((s) => s.studentId === studentId);
  if (!student) throw new ApiError(403, "연결되지 않은 학생이에요.");
  return student;
}

export function getLinkedStudents() {
  return respond(SAMPLE_STUDENTS);
}

export async function getDashboard(studentId: number) {
  return respond(sampleDashboard(findStudent(studentId)));
}

export async function getRewardBoard(studentId: number) {
  findStudent(studentId);
  return respond(rewardBoard());
}

/** 이미 달성한 목표치는 409 */
export async function setReward(studentId: number, milestone: number, body: SetRewardRequest) {
  findStudent(studentId);
  if (milestone % STAMPS_PER_REWARD !== 0) throw new ApiError(400, "목표치는 5의 배수여야 해요.");
  if (SAMPLE_STAMP_TOTAL >= milestone) throw new ApiError(409, "이미 달성한 목표예요.");
  rewardNames.set(milestone, body.name.trim());
  return respond(rewardBoard());
}

/** 달성 전에만 지울 수 있다 */
export async function deleteReward(studentId: number, milestone: number) {
  findStudent(studentId);
  if (SAMPLE_STAMP_TOTAL >= milestone) throw new ApiError(409, "이미 달성한 목표예요.");
  rewardNames.delete(milestone);
  return respond(undefined);
}
