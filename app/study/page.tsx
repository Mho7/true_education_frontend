import type { Metadata } from "next";
import StudyScreen from "@/components/study/StudyScreen";
import { getReadingBook } from "@/lib/readingStory";

export const metadata: Metadata = {
  title: "학습 | 여울",
};

export default async function StudyPage() {
  // "오늘 읽을 책은?" 소개에 번갈아 읽기로 읽을 책 제목을 보여 준다.
  const book = await getReadingBook();
  return <StudyScreen bookTitle={book.title} />;
}
