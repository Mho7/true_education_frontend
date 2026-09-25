import type { Metadata } from "next";
import StudyScreen from "@/components/study/StudyScreen";

export const metadata: Metadata = {
  title: "학습 | 여울",
};

export default function StudyPage() {
  return <StudyScreen />;
}
