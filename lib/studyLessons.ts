// 학습 지도 단계 정보. 서버(페이지)와 클라이언트가 함께 쓰므로 "use client"를 붙이지 않는다.

/** 학습 지도의 단계 수. 1단계는 번갈아 읽기다. */
export const LESSON_COUNT = 4;

/** N단계 학습 페이지 주소 */
export function lessonHref(step: number) {
  return `/study/lesson/${step}`;
}
