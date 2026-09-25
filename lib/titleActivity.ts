// 4단계 제목 짓기 데이터. 아이가 읽은 이야기에 스스로 제목을 붙이고, 원래 제목과 비교해 본다.

export type TitleActivity = {
  /** 원래 이야기의 제목 (완성 화면에서 보여 준다) */
  originalTitle: string;
  /** "생각이 잘 안 나요"를 누르면 보여 줄, 이 이야기에 맞춘 떠올리기 질문 */
  hintQuestions: string[];
};

/** 어떤 이야기에나 쓰는 처음 떠올리기 질문 */
export const GENERAL_PROMPTS = ["누가 나왔나요?", "어떤 일이 있었나요?", "무엇이 가장 기억에 남았나요?"];

// 예시 책("작은 곰과 꿀단지")
const SAMPLE_ACTIVITY: TitleActivity = {
  originalTitle: "작은 곰과 꿀단지",
  hintQuestions: ["작은 곰은 숲속 길에서 무엇을 발견했나요?", "작은 곰은 꿀을 누구와 함께 먹었나요?", "나누어 먹은 꿀은 어떤 맛이었나요?"],
};

/**
 * 제목 짓기 데이터를 가져온다. 서버(페이지)에서 불러 화면에 넘긴다.
 * TODO: DB가 붙으면 읽은 책의 원래 제목과 힌트 질문을 불러와 TitleActivity 모양으로 돌려준다.
 */
export async function getTitleActivity(): Promise<TitleActivity> {
  return SAMPLE_ACTIVITY;
}
