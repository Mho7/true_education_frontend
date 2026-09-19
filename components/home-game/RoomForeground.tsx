"use client";

import { useState } from "react";

/**
 * Layer 3 — Yeowl보다 앞에 있어야 하는 오브젝트만 담은 투명 PNG.
 * 파일이 아직 없거나 로드에 실패해도 Home 전체가 깨지지 않도록 조용히 숨긴다.
 */
export default function RoomForeground() {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/home/room-foreground.png"
      alt=""
      aria-hidden="true"
      onError={() => setFailed(true)}
      className="pointer-events-none absolute inset-0 z-20 h-full w-full object-cover object-center"
    />
  );
}
