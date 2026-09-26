import type { Metadata } from "next";
import GuardianShell from "@/components/guardian/GuardianShell";

export const metadata: Metadata = {
  title: "보호자 대시보드 | 여울",
};

// 보호자 페이지 공통 틀. 왼쪽 메뉴와 연결된 아이 목록을 한 번만 불러 모든 보호자 페이지가 함께 쓴다.
export default function GuardianLayout({ children }: LayoutProps<"/guardian">) {
  return <GuardianShell>{children}</GuardianShell>;
}
