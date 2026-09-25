"use client";

import { useSyncExternalStore, type ReactNode } from "react";

// Figma 시안 프레임 크기. 자식은 이 좌표계(px) 그대로 배치하고 스테이지가 화면에 맞춰 통째로 배율을 바꾼다.
export const DESIGN_WIDTH = 1536;
export const DESIGN_HEIGHT = 967;

// 이보다 좁으면 배율을 쓰지 않고 일반 반응형 레이아웃으로 둔다.
const MIN_STAGE_VIEWPORT = 1024;

type SafeArea = { width: number; height: number };

type DesignStageProps = {
  /**
   * cover: 배경 이미지(object-cover)와 같은 배율 — 배경과 요소 위치가 시안과 정확히 겹친다.
   * contain: 시안 프레임 전체가 화면 안에 들어오는 배율.
   */
  fit: "cover" | "contain";
  /** cover일 때도 반드시 화면 안에 보여야 하는 영역(프레임 중앙 기준, 시안 px) */
  safeArea?: SafeArea;
  /** 좁은 화면에서 쓰는 일반 레이아웃 클래스 */
  fallbackClassName?: string;
  children: ReactNode;
};

function subscribe(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

const getViewport = () => `${window.innerWidth}x${window.innerHeight}`;
const getServerViewport = () => null;

export default function DesignStage({ fit, safeArea, fallbackClassName = "", children }: DesignStageProps) {
  const viewport = useSyncExternalStore(subscribe, getViewport, getServerViewport);

  if (viewport === null) {
    // 배율을 모르는 첫 렌더에서는 레이아웃이 튀지 않도록 숨겨 둔다.
    return <div className="invisible">{children}</div>;
  }

  const [width, height] = viewport.split("x").map(Number);
  if (width < MIN_STAGE_VIEWPORT) {
    return <div className={fallbackClassName}>{children}</div>;
  }

  const byWidth = width / DESIGN_WIDTH;
  const byHeight = height / DESIGN_HEIGHT;
  let scale = fit === "cover" ? Math.max(byWidth, byHeight) : Math.min(byWidth, byHeight);
  if (safeArea) {
    scale = Math.min(scale, width / safeArea.width, height / safeArea.height);
  }

  return (
    <div
      data-design-stage
      className="absolute top-1/2 left-1/2"
      style={{
        width: DESIGN_WIDTH,
        height: DESIGN_HEIGHT,
        transform: `translate(-50%, -50%) scale(${scale})`,
      }}
    >
      {children}
    </div>
  );
}
