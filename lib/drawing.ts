// 그림 그리기 데이터와 캔버스에 그리는 도구. 그림은 비트맵이 아니라 선(stroke) 목록으로 들고 있다가
// 되돌리기·전체 지우기 때 처음부터 다시 그린다.

import { COVER_ART_HEIGHT, COVER_ART_WIDTH } from "./coverArt";

/** 펜 굵기 (그림 캔버스 좌표 px) */
export const PEN_WIDTH = 8;
/** 지우개 굵기 (그림 캔버스 좌표 px) */
export const ERASER_WIDTH = 28;
/** 그림 캔버스의 실제 해상도 배율. 화면에 확대돼도 선이 흐려지지 않게 2배로 그린다. */
export const CANVAS_PIXEL_RATIO = 2;
/** 그림 종이 색 (저장할 때 이 색 위에 그림을 얹는다) */
export const PAPER_COLOR = "#FFFFFF";

/** 시안 색 팔레트 (위 줄 6개, 아래 줄 6개) */
export const PALETTE: { color: string; label: string }[] = [
  { color: "#E5484D", label: "빨강" },
  { color: "#F28C28", label: "주황" },
  { color: "#F5C542", label: "노랑" },
  { color: "#9ACD5B", label: "연두" },
  { color: "#3E9B44", label: "초록" },
  { color: "#7CC3EE", label: "하늘" },
  { color: "#3B82D9", label: "파랑" },
  { color: "#8E5BC9", label: "보라" },
  { color: "#F08DB0", label: "분홍" },
  { color: "#F5C9A0", label: "살구" },
  { color: "#8A5638", label: "갈색" },
  { color: "#2A221F", label: "검정" },
];
export const DEFAULT_PEN_COLOR = "#3E9B44";

export type DrawingTool = "pen" | "eraser";
/** 그림 캔버스 좌표 (0~COVER_ART_WIDTH, 0~COVER_ART_HEIGHT) */
export type Point = { x: number; y: number };
export type Stroke = { tool: DrawingTool; color: string; width: number; points: Point[] };
/** 되돌리기 단위. 전체 지우기도 하나의 동작이라 되돌릴 수 있다. */
export type DrawingAction = { type: "stroke"; stroke: Stroke } | { type: "clear" };

/** 마지막 전체 지우기 이후에 그린 선들 (지금 캔버스에 보이는 선) */
export function visibleStrokes(actions: DrawingAction[]): Stroke[] {
  const strokes: Stroke[] = [];
  for (const action of actions) {
    if (action.type === "clear") strokes.length = 0;
    else strokes.push(action.stroke);
  }
  return strokes;
}

function applyStyle(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  ctx.setTransform(CANVAS_PIXEL_RATIO, 0, 0, CANVAS_PIXEL_RATIO, 0, 0);
  // 지우개는 투명하게 파낸다. 캔버스 뒤 종이색(흰색)이 보이고, 표지 미리보기에도 그대로 옮겨진다.
  ctx.globalCompositeOperation = stroke.tool === "eraser" ? "destination-out" : "source-over";
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;
  ctx.lineWidth = stroke.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

/** 선의 첫 점 (톡 찍기만 해도 점이 남는다) */
export function drawDot(ctx: CanvasRenderingContext2D, stroke: Stroke, point: Point) {
  applyStyle(ctx, stroke);
  ctx.beginPath();
  ctx.arc(point.x, point.y, stroke.width / 2, 0, Math.PI * 2);
  ctx.fill();
}

/** 그리는 중에 새로 들어온 한 마디만 덧그린다 */
export function drawSegment(ctx: CanvasRenderingContext2D, stroke: Stroke, from: Point, to: Point) {
  applyStyle(ctx, stroke);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  const [first, ...rest] = stroke.points;
  if (!first) return;
  if (rest.length === 0) {
    drawDot(ctx, stroke, first);
    return;
  }
  applyStyle(ctx, stroke);
  ctx.beginPath();
  ctx.moveTo(first.x, first.y);
  for (const point of rest) ctx.lineTo(point.x, point.y);
  ctx.stroke();
}

/** 캔버스를 비우고 지금 보이는 선을 모두 다시 그린다 */
export function renderDrawing(ctx: CanvasRenderingContext2D, actions: DrawingAction[]) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (const stroke of visibleStrokes(actions)) drawStroke(ctx, stroke);
}

/**
 * 완성한 그림을 표지 그림 칸 비율(COVER_ART) 그대로 이미지(data URL)로 만든다. 종이색 위에 얹어 투명한 곳이 없다.
 * WebP를 못 만드는 브라우저(Safari 등)는 PNG로 만든다.
 */
export function createDrawingSnapshot(source: HTMLCanvasElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = COVER_ART_WIDTH;
  canvas.height = COVER_ART_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return source.toDataURL("image/png");
  ctx.fillStyle = PAPER_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  const webp = canvas.toDataURL("image/webp", 0.9);
  return webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/png");
}
