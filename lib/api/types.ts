// 백엔드 API 요청·응답 타입. 모두 여기에만 정의한다 (백엔드 DTO와 이름을 맞춘다).

// ---------- 인증 ----------

export type ApiRole = "STUDENT" | "PARENT";

export type LoginIdAvailabilityResponse = { available: boolean };

type SignupBaseRequest = {
  name: string;
  loginId: string;
  password: string;
};

export type SignupStudentRequest = SignupBaseRequest & {
  age?: number;
  /** 동의한 항목 id(activityRecord·speechToText·guardianView 모두 필수). 빠지면 400 */
  agreements: string[];
};

export type SignupStudentResponse = { id: number; studentCode: string };

export type SignupParentRequest = SignupBaseRequest & {
  /** 동의한 항목 id. marketing만 선택이고 나머지(terms·guardianPrivacy·childPrivacy·childSpeech·guardianDashboard)는 필수 */
  agreements: string[];
};

export type SignupParentResponse = { id: number };

export type LoginRequest = { role: ApiRole; loginId: string; password: string };

export type LoginResponse = { role: ApiRole };

export type MeResponse = {
  id: number;
  role: ApiRole;
  name: string;
  /** 학생만 */
  studentCode?: string;
};

// ---------- 학습 공통 ----------

export type LearningStage = "READING" | "QUESTION" | "ORDERING" | "TITLE" | "DRAWING" | "REFLECTION" | "COMPLETED";

/** GET /sessions/today */
export type TodayResponse = {
  /** LEARNING: 진행 중인 책 / DONE: 오늘 1권 완료 / NO_BOOK: 배정할 책이 없음 */
  type: "LEARNING" | "DONE" | "NO_BOOK";
  assignmentId?: number;
  book?: { id: number; title: string; author: string | null };
  stage?: LearningStage;
  savedPages?: number;
  totalPages?: number;
  steps?: { key: Exclude<LearningStage, "COMPLETED">; label: string; status: "DONE" | "CURRENT" | "LOCKED" }[];
  completedBook?: { assignmentId: number; title: string };
  stampsEarned?: number;
};

// ---------- 번갈아 읽기 ----------

export type ReadingSpeaker = "YEOUL" | "STUDENT";

export type ReadingLine = { id: string; text: string; speaker: ReadingSpeaker };

export type ReadingPage = {
  /** 1부터 */
  page: number;
  lines: ReadingLine[];
};

/** GET /assignments/{id}/reading */
export type ReadingResponse = {
  totalPages: number;
  /** 저장한 쪽 수. savedPages + 1 쪽부터 이어 읽는다 */
  savedPages: number;
  pages: ReadingPage[];
  glossary: Record<string, string>;
};

/** POST /assignments/{id}/reading/pages/{page} */
export type SaveReadingPageRequest = {
  /** 아이가 읽은 줄과 "읽어볼게요"부터 "다 읽었어요"까지 걸린 시간 */
  lines: { lineId: string; durationMs: number }[];
};

export type SaveReadingPageResponse = {
  savedPages: number;
  totalPages: number;
  /** 마지막 쪽을 저장하면 다음 단계(QUESTION)로 바뀐다 */
  stage: LearningStage;
};

// ---------- 보호자 대시보드 ----------

/** GET /parents/me/students */
export type LinkedStudent = { studentId: number; name: string };

/** GET·POST /parents/me/link-requests. 아이가 수락하면 목록에서 빠지고 연결된 아이(GET /parents/me/students)가 된다 */
export type LinkRequest = {
  studentId: number;
  /** 수락 전이라 가운데를 가린 이름(예: 김*울) */
  studentName: string;
  /** 보호자가 입력한 학생 코드 */
  studentCode: string;
  /** REJECTED: 아이가 거절(retryAfter 뒤에 다시 요청할 수 있다) */
  status: "PENDING" | "REJECTED";
  requestedAt: string;
  respondedAt: string | null;
  retryAfter: string | null;
};

/** POST /parents/me/link-requests. agreements는 그 아이에 대한 동의(childPrivacy·childSpeech·guardianDashboard 모두 필수) */
export type CreateLinkRequest = { studentCode: string; agreements: string[] };

/** GET /students/me/link-requests */
export type StudentLinkRequest = { parentId: number; parentName: string; requestedAt: string };

/** POST /students/me/link-requests/{parentId}/accept·reject */
export type LinkResponse = { parentId: number; status: "ACCEPTED" | "REJECTED" };

export type DashboardStage = "WHO" | "WHAT" | "WHY" | "EMOTION" | "ORDER";

/** COLLECTING: 판정 전 / NEEDS_HELP: 도움 필요 / COMFORTABLE: 잘함 / NORMAL: 보통 */
export type DashboardStageStatus = "COLLECTING" | "NEEDS_HELP" | "COMFORTABLE" | "NORMAL";

/** GET /parents/me/students/{studentId}/dashboard. 판정 기준·문구는 서버 값을 그대로 보여 준다. */
export type DashboardResponse = {
  student: LinkedStudent;
  summary: {
    completedBooks: number;
    stampTotal: number;
    inProgress: { assignmentId: number; title: string; stage: LearningStage } | null;
  };
  /** 날짜 오름차순 */
  readingSpeed: { date: string; syllablesPerMinute: number; syllables: number; durationMs: number }[];
  byStage: {
    stage: DashboardStage;
    label: string;
    total: number;
    /** 0~1, 푼 문제가 없으면 null */
    firstTryRate: number | null;
    afterRetryRate: number | null;
    revealedRate: number | null;
    status: DashboardStageStatus;
  }[];
  needsHelp: DashboardStage[];
  comfortable: DashboardStage[];
  comments: { stage: DashboardStage; status: Exclude<DashboardStageStatus, "COLLECTING">; text: string }[];
  /** 완료한 책이 3권 미만이면 true */
  collecting: boolean;
  collectingMessage?: string;
  /** 최근 완료 순. transcript는 아이가 그린 표지를 말로 설명한 글(책 내용 설명이 아니다) */
  reflections: {
    assignmentId: number;
    title: string;
    transcript: string;
    durationMs: number;
    completedAt: string;
    /** 아이가 그린 표지 그림 주소(없으면 null) */
    coverImageUrl: string | null;
  }[];
};

/** GET·PUT /parents/me/students/{studentId}/rewards[/{milestone}] */
export type RewardBoardResponse = {
  stampsPerReward: number;
  stampTotal: number;
  /** 목표치 오름차순 */
  rewards: {
    milestone: number;
    name: string;
    achieved: boolean;
    /** 보호자가 아이에게 리워드를 전하고 "선물했어요"를 누른 시각(ISO). 아직 안 줬으면 null */
    givenAt: string | null;
  }[];
  /** 아직 달성하지 않은 가장 작은 목표치 */
  nextMilestone: number;
};

export type SetRewardRequest = { name: string };

// ---------- 이해 질문 ----------

export type QuestionStage = "WHO" | "WHAT" | "WHY" | "EMOTION";

/** GET /assignments/{id}/questions 의 한 문제. 정답·힌트는 끝났거나 1차 오답 뒤에만 state에 들어온다. */
export type ComprehensionQuestion = {
  questionId: number;
  order: number;
  stage: QuestionStage;
  text: string;
  /** 보기 번호 = 배열 index(0부터) */
  options: string[];
  state: {
    attempts: number;
    finished: boolean;
    /** 끝난 문제만: 맞혔는지 */
    correct?: boolean;
    /** 끝난 문제만: 정답 보기 번호 */
    answer?: number;
    /** 1차 오답 뒤 아직 안 끝난 문제만 */
    hint?: string;
  };
};

/** POST /assignments/{id}/questions/{questionId}/attempts */
export type ChoiceAttemptRequest = { answer: number; responseTimeMs?: number };

/**
 * 정답: { correct: true, finished: true }
 * 1차 오답: { correct: false, finished: false, hint }
 * 2차 오답: { correct: false, finished: true, answer }
 */
export type ChoiceAttemptResponse = {
  correct: boolean;
  finished: boolean;
  hint?: string;
  answer?: number;
  stage: LearningStage;
};

// ---------- 순서 맞추기 ----------

/** GET /assignments/{id}/ordering. cards는 서버가 섞어서 보낸다. */
export type OrderingResponse = {
  questionId: number;
  text: string;
  cards: { id: string; text: string }[];
  state: {
    attempts: number;
    remaining: number;
    finished: boolean;
    correct?: boolean;
    /** 끝났을 때만: 정답 순서(카드 id) */
    answer?: string[];
    /** 2번 틀리고 아직 안 끝났을 때만: 이어하기용 힌트(가장 먼저 일어난 일) */
    hint?: string;
  };
};

/** POST /assignments/{id}/ordering/attempts */
export type OrderingAttemptRequest = { order: string[]; responseTimeMs?: number };

/**
 * 정답: { correct: true, finished: true }
 * 오답(기회 남음): { correct: false, finished: false, remaining }
 * 3번째 오답: { correct: false, finished: true, answer }
 */
export type OrderingAttemptResponse = {
  correct: boolean;
  finished: boolean;
  remaining?: number;
  answer?: string[];
  /** 2번째 오답(기회가 남았을 때): 가장 먼저 일어난 일 */
  hint?: string;
  stage: LearningStage;
};

// ---------- 여울이 음성(TTS) ----------

/** GET /books/{bookId}/lines/{lineId}/tts. 음성을 만들지 못하면 503 */
export type LineTtsResponse = { audioUrl: string };

// ---------- 제목 짓기 · 표지 그림 · 설명 말하기 ----------

/** 단계 저장 공통 응답. 마지막 단계(설명 말하기)를 마치면 completed·stampsEarned·stampTotal이 온다. */
export type StageResult = {
  stage: LearningStage;
  completed?: boolean;
  /** 이번에 받은 스탬프 수(1 또는 2) */
  stampsEarned?: number;
  /** 누적 스탬프 수 */
  stampTotal?: number;
};

/** PUT /assignments/{id}/title */
export type SaveTitleRequest = { title: string };
export type SaveTitleResponse = StageResult & { title: string };

/** POST /assignments/{id}/drawing (multipart 필드 image, PNG/WebP 2MB 이하) */
export type SaveDrawingResponse = StageResult & { imageUrl: string };

/** POST /assignments/{id}/reflection. 받아 적은 글이 비었으면 422 */
export type SaveReflectionRequest = { transcript: string; durationMs: number };
export type SaveReflectionResponse = StageResult & { transcript: string };

// ---------- 스탬프 · 보상 · 책장 (학생) ----------

/** GET /students/me/stamps */
export type StampTotalResponse = { total: number };

/** GET /bookshelf 의 한 권 */
export type ShelfItem = {
  assignmentId: number;
  /** 아이가 지은 제목, 없으면 원제 */
  title: string;
  originalTitle: string;
  /** 아이가 그린 표지, 없으면 책 기본 표지(없으면 null) */
  coverImageUrl: string | null;
  completedAt: string;
};

/** GET /bookshelf/{id} 의 시도 기록. answer는 이해 질문이면 고른 보기 번호, 순서 맞추기면 놓은 카드 id 순서 */
export type ShelfAttempt = { attemptNumber: number; answer: number | string[]; correct: boolean };

/** GET /bookshelf/{id}. 완료한 책만 열람할 수 있다(아니면 404) */
export type ShelfBook = ShelfItem & {
  source: { author: string | null; sourceUrl: string | null; license: string | null; bibliography: string | null };
  pages: ReadingPage[];
  glossary: Record<string, string>;
  questions: {
    questionId: number;
    order: number;
    stage: QuestionStage;
    text: string;
    options: string[];
    /** 정답 보기 번호 */
    answer: number;
    /** 차수 순 */
    attempts: ShelfAttempt[];
  }[];
  /** 순서 맞추기가 없는 책은 null. cards는 정답 순서 */
  ordering: { questionId: number; text: string; cards: { id: string; text: string }[]; attempts: ShelfAttempt[] } | null;
  reflection: { transcript: string; durationMs: number } | null;
};
