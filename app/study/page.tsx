import type { Metadata } from "next";
import PlaceholderPage from "@/components/nav/PlaceholderPage";

export const metadata: Metadata = {
  title: "학습 | 여울",
};

export default function StudyPage() {
  return <PlaceholderPage title="학습 페이지 준비 중" description="실제 학습 기능은 이후 단계에서 구현됩니다." />;
}
