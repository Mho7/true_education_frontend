import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ComprehensionLesson from "@/components/study/lesson/ComprehensionLesson";
import LessonLoader from "@/components/study/lesson/LessonLoader";
import SequenceLesson from "@/components/study/lesson/SequenceLesson";
import TitleLesson from "@/components/study/lesson/TitleLesson";
import { getComprehensionQuiz } from "@/lib/comprehensionQuiz";
import { getSequenceQuiz } from "@/lib/sequenceQuiz";
import { LESSON_COUNT } from "@/lib/studyLessons";
import { getTitleActivity } from "@/lib/titleActivity";

export const metadata: Metadata = {
  title: "학습 | 여울",
};

export function generateStaticParams() {
  return Array.from({ length: LESSON_COUNT }, (_, i) => ({ step: String(i + 1) }));
}

export const dynamicParams = false;

// 학습 지도에서 발판을 누르면 오는 N단계 학습 페이지. 1단계 번갈아 읽기, 2단계 이해 질문, 3단계 순서 맞추기, 4단계 제목 짓기.
export default async function LessonPage(props: PageProps<"/study/lesson/[step]">) {
  const { step } = await props.params;
  const stepNumber = Number(step);
  if (!Number.isInteger(stepNumber) || stepNumber < 1 || stepNumber > LESSON_COUNT) notFound();
  // TODO(#5 백엔드 패치): 1~3단계는 서버 데이터 로딩으로 바뀌기 전까지 브라우저에서 불러온다(LessonLoader).
  if (stepNumber === 1) return <LessonLoader step={1} />;
  if (stepNumber === 2) return <ComprehensionLesson questions={await getComprehensionQuiz()} />;
  if (stepNumber === 3) return <SequenceLesson quiz={await getSequenceQuiz()} />;
  return <TitleLesson activity={await getTitleActivity()} />;
}
