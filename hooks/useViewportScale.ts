"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

/**
 * 창 높이 ÷ 시안 높이. 사이드바처럼 화면 가장자리에 붙는 요소를
 * 콘텐츠(DesignStage)와 같은 비율로 키우고 줄일 때 쓴다. 서버 렌더에서는 1.
 */
export function useViewportScale(designHeight: number) {
  return useSyncExternalStore(
    subscribe,
    () => window.innerHeight / designHeight,
    () => 1
  );
}
