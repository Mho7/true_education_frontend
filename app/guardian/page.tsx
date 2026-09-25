import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "보호자 대시보드 | 여울",
};

// 보호자 대시보드. 한 화면으로만 구성할 예정이라 사이드바 없이 비워 둔다.
export default function GuardianPage() {
  return (
    <main className="h-screen w-full bg-[#FBF8F2] font-kr">
      <h1 className="sr-only">보호자 대시보드</h1>
    </main>
  );
}
