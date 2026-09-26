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
