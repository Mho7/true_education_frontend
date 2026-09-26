// ⚠ 이 브랜치(main 기준)에는 백엔드 연동이 없어서 보호자 대시보드에 필요한 인증 API만 예시로 흉내 낸다.
// 실제 구현(회원가입·로그인 포함)은 feat/api-ready-ui의 같은 파일에 있다. 두 브랜치를 합칠 때는 그쪽 파일을 쓴다.

import type { MeResponse } from "./types";

export function logout() {
  return Promise.resolve({ success: true });
}

export function getMe(): Promise<MeResponse> {
  return new Promise((resolve) => setTimeout(() => resolve({ id: 1, role: "PARENT", name: "다은 보호자" }), 250));
}
