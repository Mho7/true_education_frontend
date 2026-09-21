"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import {
  COLLIDERS,
  INTERACTION_ZONES,
  getRoomBoundaryRects,
  normalizedToScreen,
  type RectCollider,
} from "@/lib/roomColliders";

type FootNorm = { x: number; y: number };

type CollisionDebugOverlayProps = {
  /** Player.tsx가 매 프레임 발 위치(정규화 좌표)를 써넣는 ref. React state가 아니라
   *  ref로 주고받아야 매 프레임 리렌더 없이 부드럽게 점을 움직일 수 있다. */
  footNormRef: RefObject<FootNorm>;
};

function useViewportSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return size;
}

function RectBox({
  rect,
  viewportWidth,
  viewportHeight,
  colorClassName,
}: {
  rect: RectCollider;
  viewportWidth: number;
  viewportHeight: number;
  colorClassName: string;
}) {
  const topLeft = normalizedToScreen(rect.x1, rect.y1, viewportWidth, viewportHeight);
  const bottomRight = normalizedToScreen(rect.x2, rect.y2, viewportWidth, viewportHeight);

  return (
    <div
      className={`absolute box-border ${colorClassName}`}
      style={{
        left: topLeft.x,
        top: topLeft.y,
        width: Math.max(0, bottomRight.x - topLeft.x),
        height: Math.max(0, bottomRight.y - topLeft.y),
      }}
    >
      <span className="absolute left-0 top-0 -translate-y-full whitespace-nowrap rounded-sm bg-black/70 px-1 text-[10px] font-bold text-white">
        {rect.id}
      </span>
    </div>
  );
}

/**
 * DEBUG ONLY (GAME_DEBUG.debugCollision). 빨강 = 이동 불가(COLLIDERS),
 * 초록 = 상호작용 영역(INTERACTION_ZONES), 파란 점 = 여울이의 실제 발 충돌 좌표.
 * 배경 이미지와 동일한 object-cover 매핑을 써서 화면 크기가 바뀌어도 항상 일치한다.
 */
export default function CollisionDebugOverlay({ footNormRef }: CollisionDebugOverlayProps) {
  const { width, height } = useViewportSize();
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (width === 0 || height === 0) return;
    let raf: number;
    const tick = () => {
      const dot = dotRef.current;
      const foot = footNormRef.current;
      if (dot && foot) {
        const { x, y } = normalizedToScreen(foot.x, foot.y, width, height);
        dot.style.transform = `translate(${x - 7}px, ${y - 7}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [footNormRef, width, height]);

  if (width === 0 || height === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      {getRoomBoundaryRects().map((rect) => (
        <RectBox
          key={`bounds-${rect.id}`}
          rect={rect}
          viewportWidth={width}
          viewportHeight={height}
          colorClassName="border border-red-500 bg-red-500/35"
        />
      ))}
      {COLLIDERS.map((rect) => (
        <RectBox
          key={`collider-${rect.id}`}
          rect={rect}
          viewportWidth={width}
          viewportHeight={height}
          colorClassName="border border-red-500 bg-red-500/35"
        />
      ))}
      {INTERACTION_ZONES.map((zone) => (
        <RectBox
          key={`zone-${zone.id}`}
          rect={zone}
          viewportWidth={width}
          viewportHeight={height}
          colorClassName="border border-green-400 bg-green-400/25"
        />
      ))}
      <div
        ref={dotRef}
        className="absolute left-0 top-0 h-3.5 w-3.5 rounded-full bg-blue-500 ring-2 ring-white"
      />
    </div>
  );
}
