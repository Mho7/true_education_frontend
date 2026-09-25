// 그림 캔버스와 책 표지 그림 칸이 함께 쓰는 크기(비율). 서버(페이지)와 클라이언트가 함께 쓰므로 "use client"를 붙이지 않는다.
// 시안 "그림 그리기" 화면의 그림 영역이 652×636이고, 책 표지 안쪽 그림 칸(시안 181.4×177.0)도 같은 비율이다.
// 두 곳 모두 이 비율만 쓰므로 그림을 표지에 옮겨도 잘리거나 찌그러지지 않는다.
export const COVER_ART_WIDTH = 652;
export const COVER_ART_HEIGHT = 636;
export const COVER_ART_ASPECT = COVER_ART_WIDTH / COVER_ART_HEIGHT;
