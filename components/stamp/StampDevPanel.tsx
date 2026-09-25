"use client";

import { useState } from "react";
import { addStamps, clearStamps } from "@/lib/stamps";

// 개발 모드에서만 스탬프 화면 오른쪽 위에 뜨는 더미 데이터 패널. 실제 배포(npm run build)에서는 렌더링되지 않는다.
export default function StampDevPanel() {
  const [open, setOpen] = useState(true);
  if (process.env.NODE_ENV !== "development") return null;

  const buttonClassName =
    "cursor-pointer rounded-full bg-white px-3 py-1.5 text-[13px] font-medium text-[#5A4032] shadow-sm ring-1 ring-[#D9CFC4] transition hover:bg-[#FBF4EC]";

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
          <p className="text-[12px] text-[#8A7F76]">더미 스탬프 (보물상자 가정)</p>
          <div className="flex gap-2">
            <button type="button" className={buttonClassName} onClick={() => addStamps(1)}>
              +1개
            </button>
            <button type="button" className={buttonClassName} onClick={() => addStamps(5)}>
              +5개
            </button>
            <button type="button" className={buttonClassName} onClick={clearStamps}>
              비우기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
