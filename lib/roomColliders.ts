/**
 * room-background.png 기준 이동 충돌/상호작용 영역 정의.
 *
 * 좌표계: 이미지 정규화 좌표 (0.0 ~ 1.0), 원점은 이미지 좌측 상단.
 *   x1,y1 = 사각형 좌상단 / x2,y2 = 사각형 우하단
 * 이미지 해상도에 종속되지 않도록 항상 0~1 비율로 관리하고, 실제 화면 픽셀로 그릴 때만
 * normalizedToScreen()으로 변환한다 (RoomBackground의 object-cover와 동일한 매핑).
 *
 * 판정 기준: 캐릭터 전체가 아니라 "발 중앙점(foot position)" 한 점만 검사한다.
 * 가구는 눈에 보이는 전체 크기가 아니라 "바닥과 실제로 맞닿는 부분(footprint)"만 막는다
 * (머리/장식이 가구와 겹쳐 보이는 건 허용, 발이 가구 밑으로 들어가는 것만 방지).
 *
 * 아래 수치는 배경 이미지를 보고 잡은 1차 추정치다. GAME_DEBUG.debugCollision = true로
 * 켜면 화면에 이 영역들이 그대로 오버레이되니, 그걸 보면서 숫자만 조정하면 된다.
 */

export type RectCollider = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type InteractionZone = RectCollider & {
  label: string;
  actionLabel: string;
  route: string;
  /**
   * 마우스 클릭/터치로 이 영역을 눌렀을 때 "해당 가구를 선택한 것"으로 보는 범위.
   * 발 위치 판정용 x1~y2와 달리, 벽에 그려진 가구 실루엣 + 앞쪽 발광 바닥까지 넓게 잡는다.
   */
  clickArea: Omit<RectCollider, "id">;
  /** 가구를 클릭했을 때 여울이가 걸어갈 바닥 지점 (이 영역 안, 충돌 영역 밖이어야 함) */
  approachPoint: { x: number; y: number };
};

/** 배경 원본 PNG 해상도 (public/home/room-background.png) */
export const BACKGROUND_IMAGE_SIZE = { width: 1672, height: 941 };

/**
 * "바닥과 벽이 만나는 내부 경계선" 기준 이동 가능 영역. 왼쪽/오른쪽/위/아래 벽을
 * 개별 Rect로 나누지 않고 하나의 사각 경계로 관리한다 (출입구도 더 이상 예외 없음 —
 * maxY = 아래쪽 주황색 벽이 시작되는 가장 윗부분. 이 선을 넘으면 무조건 collision).
 */
export const ROOM_BOUNDS = {
  minX: 0.03,
  maxX: 0.97,
  // 배경 픽셀상 실제 뒷벽 위치는 0.115지만, 이 카메라 각도에서는 화면 위쪽으로
  // 갈수록(수평선에 가까워질수록) 화면 y가 조금만 줄어도 world Z는 엄청나게 멀어진다.
  // 0.115를 그대로 쓰면 캐릭터가 세계 좌표로 한참(-13~-15 정도) 더 걸어가야 막혀서
  // 사실상 뒷벽이 없는 것처럼 느껴진다 — 그래서 방 깊이가 적당히 느껴지는 지점(z≈-7)에서
  // 막히도록 값을 낮췄다 (아래쪽 벽을 앞으로 당겼던 것과 같은 종류의 보정).
  minY: 0.28,
  // 기존 0.86 기준 아래쪽 빨간 영역 높이(1 - 0.86 = 0.14)의 절반(0.07)만큼 경계선을 위로 올림
  maxY: 0.79,
};

/**
 * 캐릭터를 점이 아니라 이 반지름의 원으로 근사해서 충돌을 판정한다 (정규화 좌표 단위).
 * 벽 여유 margin과 가구 원-사각형 거리 판정 둘 다 이 값 하나를 공유한다.
 */
export const PLAYER_RADIUS = 0.018;

/** 빨간 영역 — 이동 불가. 가구가 바닥과 맞닿는 부분만 (전체 실루엣 아님). 외곽 벽은 ROOM_BOUNDS가 담당. */
export const COLLIDERS: RectCollider[] = [
  // --- 왼쪽 가구 ---
  // 책장 앞의 대각선 흰색 발광 바닥은 원근 때문에 사다리꼴로 보이지만, 가구 자체는
  // 벽에 거의 평행해서 사각형으로 충분하다. 그 발광 바닥은 충돌이 아니라
  // INTERACTION_ZONES의 bookshelf가 담당 — 여기서 같이 덮으려고 크게 잡으면 안 됨.
  /** 큰 책장이 바닥과 닿는 부분 (책장 자체는 이보다 위로 높게 그려져 있음) */
  { id: "bookshelf", x1: 0.09, y1: 0.33, x2: 0.245, y2: 0.43 },
  /** 책장 오른쪽 작은 서랍장(위에 상자/책 더미) 바닥 부분 */
  { id: "leftDrawer", x1: 0.25, y1: 0.27, x2: 0.305, y2: 0.33 },
  /** 왼쪽 아래 화분 + 낮은 상자/책 더미 */
  { id: "leftPlant", x1: 0.03, y1: 0.42, x2: 0.12, y2: 0.53 },

  // --- 오른쪽 가구 ---
  /** 책상 본체가 바닥과 닿는 부분 (상판 전체가 아니라 다리/하단부만) */
  { id: "desk", x1: 0.735, y1: 0.28, x2: 0.955, y2: 0.33 },
  /** 책상 앞 의자가 실제로 차지하는 부분 */
  { id: "chair", x1: 0.765, y1: 0.36, x2: 0.865, y2: 0.46 },
  /** 책상 오른쪽 아래 서랍장 */
  { id: "rightDrawer", x1: 0.87, y1: 0.3, x2: 0.955, y2: 0.4 },
];

/**
 * 초록 영역 — 이동은 가능하지만(=충돌 아님), 발이 이 안에 들어오면 상호작용 프롬프트를 띄운다.
 * 흰색 발광 바닥 전체가 아니라 "가구 바로 앞" 정도로 좁게 잡는다 (방 중앙에서는 절대 활성화되면 안 됨).
 */
export const INTERACTION_ZONES: InteractionZone[] = [
  {
    id: "bookshelf",
    x1: 0.03,
    y1: 0.25,
    x2: 0.34,
    y2: 0.58,
    label: "책을 보러 갈까요?",
    actionLabel: "서재 가기",
    route: "/library",
    clickArea: { x1: 0.04, y1: 0.04, x2: 0.32, y2: 0.58 },
    approachPoint: { x: 0.25, y: 0.48 },
  },
  {
    id: "desk",
    x1: 0.68,
    y1: 0.25,
    x2: 0.97,
    y2: 0.5,
    label: "학습하러 갈까요?",
    actionLabel: "학습하기",
    route: "/study",
    clickArea: { x1: 0.73, y1: 0.18, x2: 0.96, y2: 0.5 },
    approachPoint: { x: 0.72, y: 0.42 },
  },
];

function pointInRect(x: number, y: number, rect: RectCollider): boolean {
  return x >= rect.x1 && x <= rect.x2 && y >= rect.y1 && y <= rect.y2;
}

/** 원(캐릭터)과 AABB(가구 rect) 사이의 최단거리가 radius보다 가까우면 겹친 것으로 본다 */
function circleIntersectsRect(x: number, y: number, radius: number, rect: RectCollider): boolean {
  const closestX = Math.max(rect.x1, Math.min(x, rect.x2));
  const closestY = Math.max(rect.y1, Math.min(y, rect.y2));
  const dx = x - closestX;
  const dy = y - closestY;
  return dx * dx + dy * dy < radius * radius;
}

/**
 * 발 위치(정규화 좌표)를 반지름 radius짜리 원으로 근사해서, ROOM_BOUNDS 밖으로
 * 나가거나 COLLIDERS 중 하나라도 겹치면 이동 불가로 본다. 점 하나만 검사할 때보다
 * 캐릭터가 벽/가구 모서리에 살짝 덜 파고들어 보인다.
 */
export function isBlocked(x: number, y: number, radius: number = PLAYER_RADIUS): boolean {
  if (
    x < ROOM_BOUNDS.minX + radius ||
    x > ROOM_BOUNDS.maxX - radius ||
    y < ROOM_BOUNDS.minY + radius ||
    y > ROOM_BOUNDS.maxY - radius
  ) {
    return true;
  }
  return COLLIDERS.some((rect) => circleIntersectsRect(x, y, radius, rect));
}

/**
 * 디버그 오버레이용 — ROOM_BOUNDS 바깥(화면 전체 폭 기준 위/아래/좌/우 4개 띠)을
 * COLLIDERS와 같은 형태의 Rect로 변환한다. 아래쪽은 출입구로 끊기지 않은 하나의
 * 연속된 띠로 나온다 (ROOM_BOUNDS가 유일한 소스라 여기서 따로 값을 하드코딩하지 않음).
 */
export function getRoomBoundaryRects(): RectCollider[] {
  return [
    { id: "outOfBounds-top", x1: 0, y1: 0, x2: 1, y2: ROOM_BOUNDS.minY },
    { id: "outOfBounds-bottom", x1: 0, y1: ROOM_BOUNDS.maxY, x2: 1, y2: 1 },
    { id: "outOfBounds-left", x1: 0, y1: 0, x2: ROOM_BOUNDS.minX, y2: 1 },
    { id: "outOfBounds-right", x1: ROOM_BOUNDS.maxX, y1: 0, x2: 1, y2: 1 },
  ];
}

/** 발 위치가 속한 상호작용 영역을 반환 (없으면 null) */
export function findInteractionZone(x: number, y: number): InteractionZone | null {
  return INTERACTION_ZONES.find((zone) => pointInRect(x, y, zone)) ?? null;
}

/** 클릭/터치 지점(정규화 좌표)이 가리키는 가구의 상호작용 영역을 반환 (없으면 null) */
export function findClickedInteractionZone(x: number, y: number): InteractionZone | null {
  return INTERACTION_ZONES.find((zone) => pointInRect(x, y, { id: zone.id, ...zone.clickArea })) ?? null;
}

/**
 * 이미지 정규화 좌표(0~1) → 실제 화면 픽셀 좌표.
 * <img class="object-cover object-center">가 배경을 그리는 것과 동일한 매핑이라,
 * 디버그 오버레이의 사각형/점을 배경 위에 정확히 겹쳐 그릴 수 있다.
 */
export function normalizedToScreen(
  nx: number,
  ny: number,
  viewportWidth: number,
  viewportHeight: number,
  imageWidth: number = BACKGROUND_IMAGE_SIZE.width,
  imageHeight: number = BACKGROUND_IMAGE_SIZE.height
): { x: number; y: number } {
  const scale = Math.max(viewportWidth / imageWidth, viewportHeight / imageHeight);
  const displayedWidth = imageWidth * scale;
  const displayedHeight = imageHeight * scale;
  const offsetX = (viewportWidth - displayedWidth) / 2;
  const offsetY = (viewportHeight - displayedHeight) / 2;
  return { x: offsetX + nx * displayedWidth, y: offsetY + ny * displayedHeight };
}

/** normalizedToScreen의 역변환 — 화면 픽셀 좌표 → 이미지 정규화 좌표(0~1). */
export function screenToNormalized(
  sx: number,
  sy: number,
  viewportWidth: number,
  viewportHeight: number,
  imageWidth: number = BACKGROUND_IMAGE_SIZE.width,
  imageHeight: number = BACKGROUND_IMAGE_SIZE.height
): { x: number; y: number } {
  const scale = Math.max(viewportWidth / imageWidth, viewportHeight / imageHeight);
  const displayedWidth = imageWidth * scale;
  const displayedHeight = imageHeight * scale;
  const offsetX = (viewportWidth - displayedWidth) / 2;
  const offsetY = (viewportHeight - displayedHeight) / 2;
  return { x: (sx - offsetX) / displayedWidth, y: (sy - offsetY) / displayedHeight };
}
