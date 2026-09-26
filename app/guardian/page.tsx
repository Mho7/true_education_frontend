import type { Metadata } from "next";
import GuardianDashboard from "@/components/guardian/GuardianDashboard";

export const metadata: Metadata = {
  title: "보호자 대시보드 | 여울",
};

// 보호자 대시보드. 한 화면으로만 구성해 사이드바 없이 둔다. 데이터는 로그인한 보호자 세션으로 브라우저에서 불러온다.
export default function GuardianPage() {
  return (
    <main className="min-h-screen w-full bg-[#FBF8F2] font-kr">
      <GuardianDashboard />
    </main>
  );
}
