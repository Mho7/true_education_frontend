"use client";

import { useEffect, useState } from "react";
import { resetDailyStudyForDev } from "@/lib/dailyStudy";

/**
 * 개발 모드에서만 홈 화면 왼쪽 위에 뜨는 버튼. 오늘 학습을 끝내면 학습 화면에 들어갈 수 없으므로
 * 같은 날 다시 테스트할 수 있게 하루 학습 제한 상태(완료 날짜·안내 본 날짜)만 지운다.
 * 스탬프·책장·초안 등 다른 기록은 건드리지 않는다. 지워도 실제 하루 제한 기능에는 영향이 없다.
 */
export default function DailyStudyDevControls() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const timer = window.setTimeout(() => setDone(false), 1500);
    return () => window.clearTimeout(timer);
  }, [done]);

  if (process.env.NODE_ENV !== "development") return null;

  return (
    <button
      type="button"
      onClick={() => {
        resetDailyStudyForDev();
        setDone(true);
      }}
      className="absolute top-6 left-6 z-40 cursor-pointer rounded-full bg-[#5A4032]/80 px-3 py-1.5 font-kr text-[12px] text-white transition hover:bg-[#5A4032]"
    >
      {done ? "초기화했어요" : "개발용 · 오늘 학습 제한 초기화"}
    </button>
  );
}
