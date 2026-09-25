import type { Metadata } from "next";
import PlaceholderPage from "@/components/nav/PlaceholderPage";

export const metadata: Metadata = {
  title: "스탬프 | 여울",
};

export default function StampPage() {
  return <PlaceholderPage title="스탬프 페이지 준비 중" description="실제 스탬프 기능은 이후 단계에서 구현됩니다." />;
}
