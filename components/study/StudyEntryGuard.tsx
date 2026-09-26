"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { DAILY_STUDY_NOTICE_HREF, useCompletedStudyToday } from "@/lib/dailyStudy";

/**
 * 오늘 학습을 이미 끝냈는데 주소창 등으로 학습 화면에 바로 들어오면, 새 학습을 시작하지 않고
 * 홈으로 보내 완료 안내를 띄운다. 학습 화면 안에서 오갈 때는 다시 확인하지 않는다.
 */
export default function StudyEntryGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  // 서버 렌더·첫 화면에서는 아직 모르므로 null이다.
  const completed = useCompletedStudyToday();
  // 들어올 때 한 번만 정한다. 학습 중에 보물상자를 열어 오늘 완료로 바뀌어도 보상 장면을 닫지 않는다.
  const [entry, setEntry] = useState<"open" | "blocked" | null>(null);
  if (entry === null && completed !== null) setEntry(completed ? "blocked" : "open");

  useEffect(() => {
    if (entry === "blocked") router.replace(DAILY_STUDY_NOTICE_HREF);
  }, [entry, router]);

  // 확인하기 전이나 돌려보낼 때는 학습 화면을 그리지 않아 새 학습이 잠깐이라도 시작되지 않게 한다.
  return entry === "open" ? children : null;
}
