"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

// 이보다 좁은 창에서는 배율을 쓰지 않고 일반 반응형 레이아웃으로 둔다.
const DEFAULT_MIN_VIEWPORT = 1024;

type Size = { width: number; height: number };

type DesignStageProps = {
  /** Figma 시안 프레임 크기. 자식은 이 좌표계(px) 그대로 배치하고 스테이지가 통째로 배율을 바꾼다. */
  designWidth?: number;
  designHeight?: number;
  /**
   * cover: 부모 영역을 꽉 채우는 배율 — 배경 이미지(object-cover)와 요소 위치가 시안과 정확히 겹친다.
   * contain: 시안 프레임 전체가 부모 영역 안에 들어오는 배율.
   */
  fit: "cover" | "contain";
  /** cover일 때도 반드시 보여야 하는 영역(프레임 중앙 기준, 시안 px) */
  safeArea?: Size;
  /** 창 너비가 이보다 좁으면 fallbackClassName 레이아웃을 쓴다. 0이면 항상 스테이지를 쓴다. */
  minViewportWidth?: number;
  /** 좁은 화면에서 쓰는 일반 레이아웃 클래스 */
  fallbackClassName?: string;
  children: ReactNode;
};

/** 부모(position 지정된 요소) 영역을 측정해 시안 프레임을 가운데 두고 배율을 맞춘다. */
export default function DesignStage({
  designWidth = 1536,
  designHeight = 967,
  fit,
  safeArea,
  minViewportWidth = DEFAULT_MIN_VIEWPORT,
  fallbackClassName = "",
  children,
}: DesignStageProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<Size | null>(null);
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const useStage = viewportWidth !== null && viewportWidth >= minViewportWidth;

  useLayoutEffect(() => {
    const element = boxRef.current;
    if (!useStage || !element) return;
    const observer = new ResizeObserver(([entry]) => {
      setBox({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [useStage]);

  if (viewportWidth === null) {
    // 배율을 모르는 첫 렌더에서는 레이아웃이 튀지 않도록 숨겨 둔다.
    return <div className="invisible">{children}</div>;
  }

  if (!useStage) {
    return <div className={fallbackClassName}>{children}</div>;
  }

  let scale = 0;
  if (box) {
    const byWidth = box.width / designWidth;
    const byHeight = box.height / designHeight;
    scale = fit === "cover" ? Math.max(byWidth, byHeight) : Math.min(byWidth, byHeight);
    if (safeArea) {
      scale = Math.min(scale, box.width / safeArea.width, box.height / safeArea.height);
    }
  }

  return (
    <div ref={boxRef} className="absolute inset-0">
      <div
        data-design-stage
        className={`absolute top-1/2 left-1/2 ${box ? "" : "invisible"}`}
        style={{
          width: designWidth,
          height: designHeight,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
