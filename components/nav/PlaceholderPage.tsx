"use client";

import SideNav, { useSideNavWidth } from "@/components/nav/SideNav";

type PlaceholderPageProps = {
  title: string;
  description: string;
};

/** 아직 기능이 없는 메뉴 페이지. 사이드바가 있어 현재 메뉴가 칠해진 상태로 보인다. */
export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  const sideNavWidth = useSideNavWidth();
  return (
    <main className="relative h-screen w-full overflow-hidden bg-[#FBF4E9] font-kr">
      <SideNav />
      <div
        className="absolute inset-y-0 right-0 flex flex-col items-center justify-center gap-3 px-6 text-center"
        style={{ left: sideNavWidth }}
      >
        <h1 className="text-2xl font-bold text-[#6B4A2B]">{title}</h1>
        <p className="max-w-sm text-sm text-[#9A7C5C]">{description}</p>
      </div>
    </main>
  );
}
