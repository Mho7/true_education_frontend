"use client";

import { useState } from "react";
import { resetStudyProgress } from "@/lib/studyProgress";

// 개발 모드에서만 학습 화면 오른쪽 위에 뜨는 패널. 실제 배포(npm run build)에서는 렌더링되지 않는다.
export default function StudyDevPanel() {
  const [open, setOpen] = useState(false);
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="absolute top-4 right-4 z-40 flex flex-col items-end gap-2 font-kr">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="cursor-pointer rounded-full bg-[#5A4032]/80 px-3 py-1 text-[12px] text-white"
      >
        {open ? "개발용 패널 닫기" : "개발용"}
      </button>
      {open && (
        <div className="flex flex-col gap-2 rounded-2xl bg-white/85 p-3 shadow-lg backdrop-blur">
          <p className="text-[12px] text-[#8A7F76]">진행도를 지우고 새 책처럼 시작</p>
          <button
            type="button"
            className="cursor-pointer rounded-full bg-white px-3 py-1.5 text-[13px] font-medium text-[#5A4032] shadow-sm ring-1 ring-[#D9CFC4] transition hover:bg-[#FBF4EC]"
            onClick={resetStudyProgress}
          >
            인트로 다시 보기
          </button>
        </div>
      )}
    </div>
  );
}
