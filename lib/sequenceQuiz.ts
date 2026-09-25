// 3단계 순서 맞추기 데이터. 책에서 일어난 일을 차례대로 고른다.

export type SequenceQuiz = {
  id: string;
  /** 일어난 차례대로 적은 문장 */
  events: string[];
  /** 화면에 보여 줄 순서 (events의 번호). 처음부터 정답 순서로 보이지 않게 섞어 둔다. */
  displayOrder: number[];
};

// 예시 책("작은 곰과 꿀단지")으로 만든 문제
const SAMPLE_QUIZ: SequenceQuiz = {
  id: "sample-little-bear-sequence",
  events: [
    "작은 곰이 숲속 길에서 꿀단지를 발견했어요.",
    "작은 곰이 토끼에게 같이 꿀을 먹자고 했어요.",
    "다람쥐와 부엉이도 나무 아래로 모였어요.",
    "친구들과 꿀을 나누어 먹으니 더 달콤했어요.",
  ],
  displayOrder: [2, 0, 3, 1],
};

/**
 * 순서 맞추기 문제를 가져온다. 서버(페이지)에서 불러 화면에 넘긴다.
 * TODO: DB가 붙으면 읽은 책에 맞는 문제를 불러와 SequenceQuiz 모양으로 돌려준다
 *       (보여 줄 순서를 DB가 주지 않으면 여기서 섞는다).
 */
export async function getSequenceQuiz(): Promise<SequenceQuiz> {
  return SAMPLE_QUIZ;
}
