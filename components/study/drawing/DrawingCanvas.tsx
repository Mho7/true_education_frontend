"use client";

import { useEffect, useRef, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { COVER_ART_HEIGHT, COVER_ART_WIDTH } from "@/lib/coverArt";
import {
  CANVAS_PIXEL_RATIO,
  drawDot,
  drawSegment,
  ERASER_WIDTH,
  PAPER_COLOR,
  PEN_WIDTH,
  renderDrawing,
  type DrawingAction,
  type DrawingTool,
  type Point,
  type Stroke,
} from "@/lib/drawing";

type DrawingCanvasProps = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** 지금까지 그린 선들. 바뀌면(되돌리기·전체 지우기·선 추가) 캔버스를 처음부터 다시 그린다. */
  actions: DrawingAction[];
  tool: DrawingTool;
  color: string;
  onStrokeStart: () => void;
  /** 손을 떼면 방금 그린 선 하나를 넘긴다 */
  onStrokeEnd: (stroke: Stroke) => void;
  /** 캔버스 그림이 바뀔 때마다 부른다 (표지 미리보기 갱신용) */
  onPaint: () => void;
};

/**
 * 마우스·터치·펜으로 그리는 캔버스. 크기는 COVER_ART(652×636) 좌표이고, 실제 해상도는 CANVAS_PIXEL_RATIO배다.
 * LessonFrame이 화면 전체를 CSS transform으로 확대/축소하므로, 손 위치는 getBoundingClientRect로 캔버스 좌표로 바꾼다.
 */
export default function DrawingCanvas({ canvasRef, actions, tool, color, onStrokeStart, onStrokeEnd, onPaint }: DrawingCanvasProps) {
  // 지금 그리고 있는 선. 움직일 때마다 다시 렌더링하지 않도록 ref에 둔다.
  const activeRef = useRef<{ pointerId: number; stroke: Stroke } | null>(null);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    renderDrawing(ctx, actions);
    onPaint();
  }, [actions, canvasRef, onPaint]);

  function toCanvasPoint(rect: DOMRect, clientX: number, clientY: number): Point {
    return {
      x: ((clientX - rect.left) / rect.width) * COVER_ART_WIDTH,
      y: ((clientY - rect.top) / rect.height) * COVER_ART_HEIGHT,
    };
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    // 한 번에 한 선만 그린다 (두 번째 손가락은 무시)
    if (activeRef.current) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const canvas = event.currentTarget;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);

    const point = toCanvasPoint(canvas.getBoundingClientRect(), event.clientX, event.clientY);
    const stroke: Stroke = {
      tool,
      color: tool === "eraser" ? PAPER_COLOR : color,
      width: tool === "eraser" ? ERASER_WIDTH : PEN_WIDTH,
      points: [point],
    };
    activeRef.current = { pointerId: event.pointerId, stroke };
    drawDot(ctx, stroke, point);
    onStrokeStart();
    onPaint();
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    const active = activeRef.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const canvas = event.currentTarget;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    // 빠르게 그을 때 브라우저가 한 번에 묶어 보낸 점들까지 모두 써서 선이 각지지 않게 한다.
    const coalesced = event.nativeEvent.getCoalescedEvents?.() ?? [];
    const samples = coalesced.length > 0 ? coalesced : [event.nativeEvent];
    const { stroke } = active;
    for (const sample of samples) {
      const point = toCanvasPoint(rect, sample.clientX, sample.clientY);
      const last = stroke.points[stroke.points.length - 1];
      if (Math.hypot(point.x - last.x, point.y - last.y) < 0.5) continue;
      stroke.points.push(point);
      drawSegment(ctx, stroke, last, point);
    }
    onPaint();
  }

  function handlePointerEnd(event: ReactPointerEvent<HTMLCanvasElement>) {
    const active = activeRef.current;
    if (!active || active.pointerId !== event.pointerId) return;
    activeRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    // 취소(pointercancel)돼도 이미 화면에 그려진 만큼은 선으로 남긴다.
    onStrokeEnd(active.stroke);
  }

  return (
    <canvas
      ref={canvasRef}
      width={COVER_ART_WIDTH * CANVAS_PIXEL_RATIO}
      height={COVER_ART_HEIGHT * CANVAS_PIXEL_RATIO}
      aria-label="그림 그리는 곳"
      className="absolute top-0 left-0 block cursor-crosshair touch-none select-none"
      style={{ width: COVER_ART_WIDTH, height: COVER_ART_HEIGHT, backgroundColor: PAPER_COLOR }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onLostPointerCapture={handlePointerEnd}
    />
  );
}
