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
  /** 학습 내용 보호자 전달 동의(필수). false면 400 */
  guardianShareAgreed: boolean;
};

export type SignupStudentResponse = { id: number; studentCode: string };

export type SignupParentRequest = SignupBaseRequest & {
  /** 학생 가입 시 발급된 6자리 코드(대소문자 구분) */
  studentCode: string;
  /** 이용약관·개인정보 처리방침 동의(필수) */
  termsAgreed: boolean;
  /** 마케팅 정보 수신 동의(선택) */
  marketingAgreed: boolean;
  /** 자녀 개인정보 수집·이용 동의(법정대리인, 필수) */
  guardianConsentAgreed: boolean;
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
