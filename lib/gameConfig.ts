export const GAME_CONFIG = {
  player: {
    modelPath: "/models/yeowl_pre.glb",
    /** 모델 전체 크기 배율 */
    scale: 1,
    /** 초당 이동 속도 (world unit / sec) */
    speed: 3,
    /** 바닥 정렬 후 추가로 보정할 높이값 (모델이 붕 뜨거나 파묻힐 때 조정) */
    yOffset: 0,
    /**
     * 모델의 "정면"이 Three.js 기준(+Z)과 다를 때 보정하는 라디안 값.
     * 예: 모델이 뒤를 보고 걷는다면 Math.PI, 90도 틀어져 있다면 Math.PI / 2
     */
    rotationOffset: 0,
  },
  room: {
    /** Player 이동 경계(충돌 계산용) — 시각적 Room은 room-background.png가 담당한다 */
    width: 11,
    depth: 9,
  },
  camera: {
    position: [7, 7.5, 9] as [number, number, number],
    target: [0, 0.2, -0.6] as [number, number, number],
    fov: 36,
  },
  collision: {
    /** 플레이어를 원(circle)으로 근사할 때의 반지름 */
    playerRadius: 0.45,
  },
} as const;
