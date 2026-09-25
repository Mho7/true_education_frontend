// 2단계 이해 질문 데이터. 번갈아 읽기로 읽은 책 내용을 잘 이해했는지 묻는다.

export type ComprehensionQuestion = {
  id: string;
  /** 질문 종류 (누가·언제·어디서·무엇을·어떻게·왜) */
  category: string;
  question: string;
  choices: string[];
  /** choices 중 정답 번호 */
  answerIndex: number;
  /** 한 번 틀렸을 때 보여 줄 힌트 */
  hint: string;
  /** 두 번 이상 틀렸을 때 보여 줄 책 속 근거 문장 */
  evidence: string;
  /** 맞혔을 때 보여 줄 설명 */
  explanation: string;
};

// 예시 책("작은 곰과 꿀단지")으로 만든 질문
const SAMPLE_QUESTIONS: ComprehensionQuestion[] = [
  {
    id: "sample-who",
    category: "누가",
    question: "숲속 길에서 꿀단지를 발견한 것은 누구일까요?",
    choices: ["토끼", "작은 곰", "부엉이"],
    answerIndex: 1,
    hint: "숲속 길을 천천히 걸어간 동물을 떠올려 보세요.",
    evidence: "작은 곰은 숲속 길을 천천히 걸어갔어요. 그러다 반짝이는 꿀단지를 발견했어요.",
    explanation: "작은 곰이 숲속 길에서 꿀단지를 발견했어요.",
  },
  {
    id: "sample-what",
    category: "무엇을",
    question: "꿀단지 안에는 무엇이 가득했나요?",
    choices: ["반짝이는 보석", "맛있는 도토리", "달콤한 꿀"],
    answerIndex: 2,
    hint: "작은 곰이 친구들과 나누어 먹은 것을 떠올려 보세요.",
    evidence: "꿀단지 안에는 달콤한 꿀이 가득했어요.",
    explanation: "꿀단지 안에는 달콤한 꿀이 가득했어요.",
  },
  {
    id: "sample-why",
    category: "왜",
    question: "작은 곰은 왜 친구들을 불렀을까요?",
    choices: ["혼자 먹기에는 꿀이 너무 많아서", "길을 잃어버려서", "꿀단지가 너무 무거워서"],
    answerIndex: 0,
    hint: "작은 곰이 친구들을 생각한 까닭을 떠올려 보세요.",
    evidence: "작은 곰은 친구들이 생각났어요. 혼자 먹기에는 너무 많았거든요.",
    explanation: "꿀이 혼자 먹기에는 너무 많아서 친구들과 나누고 싶었어요.",
  },
  {
    id: "sample-where",
    category: "어디서",
    question: "친구들은 어디에 모여서 꿀을 나누어 먹었나요?",
    choices: ["강가", "토끼네 집", "나무 아래"],
    answerIndex: 2,
    hint: "친구들이 모두 모인 곳을 떠올려 보세요.",
    evidence: "친구들이 모두 나무 아래 모였어요. 꿀을 한 숟가락씩 나누어 먹었어요.",
    explanation: "친구들은 나무 아래에 모여 꿀을 나누어 먹었어요.",
  },
];

/**
 * 이해 질문을 가져온다. 서버(페이지)에서 불러 화면에 넘긴다.
 * TODO: DB가 붙으면 읽은 책에 맞는 질문을 불러와 ComprehensionQuestion 모양으로 돌려준다.
 */
export async function getComprehensionQuiz(): Promise<ComprehensionQuestion[]> {
  return SAMPLE_QUESTIONS;
}
