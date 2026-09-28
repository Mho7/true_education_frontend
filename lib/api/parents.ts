// ⚠ 이 브랜치(main 기준)에는 백엔드 연동이 없어서 보호자 API를 예시 데이터로 흉내 낸다.
// 함수 이름·응답 모양은 실제 API(feat/api-ready-ui의 같은 파일)와 같다. 두 브랜치를 합칠 때는 그쪽 파일을 쓴다.

import { addLinkRequest, listLinkRequests, removeLinkRequest } from "@/lib/linkRequests";
import { getCurrentMember } from "@/lib/session";
import { ApiError } from "./client";
import type { DashboardResponse, LinkedStudent, LinkRequest, RewardBoardResponse, SetRewardRequest } from "./types";

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

// 보상은 화면에서 정하고 지우고 전달 처리할 수 있게 메모리에 둔다 (새로고침하면 처음 예시로 돌아간다).
// 예시: 도장 6개를 모아 5개 목표는 달성했지만 아직 전하지 않은 상태.
const sampleRewards = new Map<number, { name: string; givenAt: string | null }>([[5, { name: "좋아하는 간식 먹기", givenAt: null }]]);

function rewardBoard(): RewardBoardResponse {
  const nextMilestone = (Math.floor(SAMPLE_STAMP_TOTAL / STAMPS_PER_REWARD) + 1) * STAMPS_PER_REWARD;
  return {
    stampsPerReward: STAMPS_PER_REWARD,
    stampTotal: SAMPLE_STAMP_TOTAL,
    nextMilestone,
    rewards: [...sampleRewards]
      .sort(([a], [b]) => a - b)
      .map(([milestone, { name, givenAt }]) => ({ milestone, name, achieved: SAMPLE_STAMP_TOTAL >= milestone, givenAt })),
  };
}

/** 이 보호자가 보낸 연결 요청 (보호자·학생이 같은 브라우저에 저장된 요청을 나눠 본다) */
function myLinkRequests() {
  const loginId = getCurrentMember()?.loginId ?? "";
  return listLinkRequests().filter((request) => request.guardianLoginId === loginId);
}

/** 예시 아이 + 이 보호자의 요청을 아이가 수락해 연결된 아이 */
function linkedStudents(): LinkedStudent[] {
  const accepted = myLinkRequests().flatMap((request) =>
    request.status === "ACCEPTED" && request.studentId ? [{ studentId: request.studentId, name: request.studentName ?? "" }] : [],
  );
  return [...SAMPLE_STUDENTS, ...accepted];
}

function findStudent(studentId: number) {
  const student = linkedStudents().find((s) => s.studentId === studentId);
  if (!student) throw new ApiError(403, "연결되지 않은 학생이에요.");
  return student;
}

export function getLinkedStudents() {
  return respond(linkedStudents());
}

/** 아이가 아직 수락하지 않은 연결 요청 (GET /parents/me/link-requests) */
export function getLinkRequests() {
  return respond<LinkRequest[]>(
    myLinkRequests()
      .filter((request) => request.status === "PENDING")
      .map(({ id, studentCode, requestedAt }) => ({ requestId: id, studentCode, requestedAt })),
  );
}

/**
 * 학생 코드로 연결을 요청한다 (POST /parents/me/link-requests). 아이가 설정에서 수락해야 연결된다.
 * 이미 연결됐거나 요청해 둔 코드는 409. 예시에서는 없는 코드도 받아 두고 대기로 남긴다(실제 API는 404).
 */
export async function requestStudentLink(studentCode: string) {
  // 학생 코드는 대소문자를 구분하므로 앞뒤 공백만 지운다.
  const code = studentCode.trim();
  if (!code) throw new ApiError(400, "학생 코드를 입력해 주세요.");
  const existing = myLinkRequests().find((request) => request.studentCode === code);
  if (existing) throw new ApiError(409, existing.status === "ACCEPTED" ? "이미 연결된 아이예요." : "이미 연결을 요청한 코드예요.");
  const guardian = getCurrentMember();
  const saved = addLinkRequest({ guardianLoginId: guardian?.loginId ?? "", guardianName: guardian?.name || "보호자", studentCode: code });
  return respond<LinkRequest>({ requestId: saved.id, studentCode: saved.studentCode, requestedAt: saved.requestedAt });
}

/** 아이가 수락하기 전의 요청을 취소한다 (DELETE /parents/me/link-requests/:requestId) */
export async function cancelLinkRequest(requestId: number) {
  const request = myLinkRequests().find((r) => r.id === requestId && r.status === "PENDING");
  if (!request) throw new ApiError(404, "이미 처리된 요청이에요.");
  removeLinkRequest(requestId);
  return respond(undefined);
}

export async function getDashboard(studentId: number) {
  return respond(sampleDashboard(findStudent(studentId)));
}

export async function getRewardBoard(studentId: number) {
  findStudent(studentId);
  return respond(rewardBoard());
}

/** 아이에게 이미 전한(선물했어요) 목표치는 409. 달성했어도 아직 전하지 않았으면 정하거나 바꿀 수 있다 */
export async function setReward(studentId: number, milestone: number, body: SetRewardRequest) {
  findStudent(studentId);
  if (milestone % STAMPS_PER_REWARD !== 0) throw new ApiError(400, "목표치는 5의 배수여야 해요.");
  if (sampleRewards.get(milestone)?.givenAt) throw new ApiError(409, "이미 선물한 리워드예요.");
  sampleRewards.set(milestone, { name: body.name.trim(), givenAt: null });
  return respond(rewardBoard());
}

/** 아직 전하지 않은 리워드만 지울 수 있다 */
export async function deleteReward(studentId: number, milestone: number) {
  findStudent(studentId);
  if (sampleRewards.get(milestone)?.givenAt) throw new ApiError(409, "이미 선물한 리워드예요.");
  sampleRewards.delete(milestone);
  return respond(undefined);
}

/** 보호자가 아이에게 리워드를 전했다고 기록한다. 달성했고 리워드를 정해 둔 목표치만 된다 */
export async function markRewardGiven(studentId: number, milestone: number) {
  findStudent(studentId);
  const reward = sampleRewards.get(milestone);
  if (!reward) throw new ApiError(404, "먼저 리워드를 정해 주세요.");
  if (SAMPLE_STAMP_TOTAL < milestone) throw new ApiError(409, "아직 도장을 다 모으지 않았어요.");
  sampleRewards.set(milestone, { ...reward, givenAt: reward.givenAt ?? new Date().toISOString() });
  return respond(rewardBoard());
}

/** "선물했어요"를 잘못 눌렀을 때 되돌린다 */
export async function unmarkRewardGiven(studentId: number, milestone: number) {
  findStudent(studentId);
  const reward = sampleRewards.get(milestone);
  if (!reward) throw new ApiError(404, "정해 둔 리워드가 없어요.");
  sampleRewards.set(milestone, { ...reward, givenAt: null });
  return respond(rewardBoard());
}
