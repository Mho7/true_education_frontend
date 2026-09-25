// 학습 지도 좌표. Figma "AI독서서비스 (2)" 시안은 1340×1024 화면이고, 지도 그림(2171×724)을 3301×1100으로
// 늘려 가로로 옮겨 가며 보여 준다. 아래 좌표는 모두 그 3301×1100 지도(월드) 기준이다.

export const VIEW_WIDTH = 1340;
export const VIEW_HEIGHT = 1024;
export const MAP_WIDTH = 3301;
export const MAP_HEIGHT = 1100;

export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; width: number; height: number };

export type FoxPose = "idle" | "walk" | "run-back" | "run-side" | "think" | "wink" | "cheer" | "jump";

/** 여백을 잘라 낸 캐릭터 그림의 가로/세로 비율 (public/study/fox-*.png) */
export const FOX_ASPECT: Record<FoxPose, number> = {
  idle: 616 / 640,
  walk: 512 / 498,
  "run-back": 639 / 640,
  "run-side": 679 / 640,
  think: 498 / 640,
  wink: 575 / 640,
  cheer: 584 / 640,
  jump: 450 / 532,
};

/** 멀리(위쪽 길) 있을수록 작게 보이도록 발끝 높이로 캐릭터 키를 정한다. */
export function foxHeight(feetY: number) {
  return 255 + ((feetY - 543) * 45) / 157;
}

/**
 * 학습 발판 (1~4단계). 1단계는 여울이가 처음 서 있는 출발점이다(지도 그림에 그려진 자리에 맞춤).
 * 시안에서 발판 그림은 이 사각형에 맞춰 늘려 그린다.
 */
export const STAGE_PADS: Rect[] = [
  { x: 97, y: 598, width: 318, height: 140 },
  { x: 863, y: 549, width: 315, height: 147 },
  { x: 1587, y: 444, width: 289, height: 124 },
  { x: 2535, y: 564, width: 289, height: 124 },
];

/**
 * 여울이가 서는 곳: 0~3 = 1~4단계 발판, 4 = 보물상자 앞.
 * feet는 캐릭터 발끝(아래 가운데), camera는 시안 화면 왼쪽 끝의 지도 x.
 */
export const STATIONS: { feet: Point; camera: number }[] = [
  { feet: { x: 215, y: 695 }, camera: 23 },
  { feet: { x: 826, y: 665 }, camera: 565 },
  { feet: { x: 1654, y: 543 }, camera: 1073 },
  { feet: { x: 2509, y: 674 }, camera: 1506 },
  { feet: { x: 3010, y: 640 }, camera: 1961 },
];

/** 정거장 사이 길. via는 시안 "걷기1~4" 프레임의 캐릭터 발끝이고, pose는 그 프레임의 달리는 모습이다. */
export const LEGS: { via: Point; pose: FoxPose }[] = [
  { via: { x: 615, y: 700 }, pose: "walk" },
  { via: { x: 1352, y: 645 }, pose: "run-back" },
  { via: { x: 2064, y: 640 }, pose: "run-side" },
  { via: { x: 2811, y: 665 }, pose: "run-back" },
];

/** 지도 그림 오른쪽 끝에 그려진 보물상자. 4단계를 끝내면 여기를 눌러 보물상자로 간다. */
export const MAP_CHEST: Rect = { x: 3040, y: 465, width: 170, height: 135 };

export const LESSON_COUNT = STAGE_PADS.length;
