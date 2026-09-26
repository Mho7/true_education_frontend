import type { Metadata } from "next";
import GuardianHome from "@/components/guardian/GuardianHome";

export const metadata: Metadata = {
  title: "보호자 대시보드 | 여울",
};

// 보호자 대시보드(시안 abcc.png). 보호자로 로그인하면 이 화면으로 온다.
export default function GuardianPage() {
  return <GuardianHome />;
}
