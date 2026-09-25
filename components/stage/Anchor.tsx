"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

// 배경 그림을 콘텐츠 영역에 꽉 맞추고(살짝 늘어날 수 있음), 그 위 UI를 그림 좌표에 붙일 때 쓰는 도구.

/** 요소의 실제 크기(px)를 따라간다 */
export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, size] as const;
}

export type Scale = { x: number; y: number };

/**
 * 시안 좌표(x, y)에 붙는 UI 묶음. 위치는 가로·세로 배율을 따로 적용해 배경 그림과 정확히 겹치고,
 * 크기는 세로 배율 하나로만 키워 글자·책이 찌그러지지 않는다.
 */
export function Anchor({
  x,
  y,
  scale,
  size = 1,
  centerX = false,
  children,
  className = "",
}: {
  x: number;
  y: number;
  scale: Scale;
  /** 시안 크기 대비 추가 배율 */
  size?: number;
  /** true면 x를 가운데 기준으로 둔다 */
  centerX?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const style: CSSProperties = {
    left: x * scale.x,
    top: y * scale.y,
    transform: `${centerX ? "translateX(-50%) " : ""}scale(${scale.y * size})`,
    transformOrigin: centerX ? "top center" : "top left",
  };
  return (
    <div className={`absolute ${className}`} style={style}>
      {children}
    </div>
  );
}

