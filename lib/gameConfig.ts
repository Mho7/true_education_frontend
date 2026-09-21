export const GAME_CONFIG = {
  player: {
    modelPath: "/models/yeowl.glb",
    /** 모델 전체 크기 배율 */
    scale: 0.7,
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
  camera: {
    position: [7, 7.5, 9] as [number, number, number],
    target: [0, 0.2, -0.6] as [number, number, number],
    fov: 36,
  },
} as const;

/**
 * 개발용 디버그 플래그. 프로덕션 배포 전에는 모두 false로 꺼야 한다.
 * (이동/애니메이션/충돌 문제를 단계별로 격리해서 진단할 때 사용)
 */
export const GAME_DEBUG = {
  /** true면 충돌 검사를 완전히 건너뛰고 이동만 검증한다 */
  disableCollision: false,
  /** GLB 로드 시 animation clip / mesh / skeleton 정보를 1회 콘솔에 출력 */
  logGLB: true,
  /** 매 프레임 이동 벡터를 콘솔에 출력 (input 상태가 바뀔 때만) */
  logMovement: false,
  /** 충돌 판정 결과가 바뀔 때만 콘솔에 출력 */
  logCollision: false,
  /** true면 배경 PNG 레이어를 숨기고 3D 캐릭터만 보이게 한다 (배경 교체 작업 중 등에 사용) */
  hideRoomLayers: false,
  /**
   * true면 lib/roomColliders.ts의 충돌 영역(빨강)/상호작용 영역(초록)과
   * 여울이의 실제 발 충돌 좌표(파란 점)를 화면에 반투명 오버레이로 그린다.
   * 좌표를 눈으로 보면서 조정할 때 켜고, 프로덕션에서는 반드시 꺼야 한다.
   */
  debugCollision: false,
} as const;

/**
 * 여울이 GLB의 웹 렌더링 색감 보정값. Blender Base Color는 건드리지 않고,
 * Renderer(Color Space/Tone Mapping/Exposure) + Lighting + Material(Roughness/Emissive/EnvMap)만
 * 이 상수를 통해 조정한다. 배경(room-background.png)은 DOM <img>라 이 값들의 영향을 받지 않는다.
 */
export const YEOWLI_VISUAL_CONFIG = {
  /** ACESFilmicToneMapping 노출값. 추천 조정 범위 1.08 ~ 1.22 */
  exposure: 1.15,

  hemiSkyColor: "#fff1df",
  hemiGroundColor: "#b99478",
  hemiIntensity: 2.2,

  keyColor: "#ffe3bd",
  keyIntensity: 1.8,
  keyPosition: [-4, 7, 5] as [number, number, number],

  fillColor: "#fff6e8",
  fillIntensity: 0.65,
  fillPosition: [4, 4, 3] as [number, number, number],

  ambientColor: "#fff5ea",
  ambientIntensity: 0.6,

  /** 아래 4개는 lib/tuneYeowliMaterials.ts가 GLB 로드 직후 1회 적용한다 (mat.color는 절대 변경하지 않음) */
  roughness: 0.88,
  metalness: 0.0,
  emissiveColor: "#321b10",
  /** 암부를 얼마나 들어올릴지. 추천 조정 범위 0.04 ~ 0.10 */
  emissiveIntensity: 0.07,
  envMapIntensity: 0.35,
} as const;

/**
 * 여울이 발밑 soft contact shadow (타원형 반투명 plane, 실시간 물리 그림자 아님).
 * 배경 PNG에 이미 창문 그림자 등이 그려져 있어서, 강한 real-time cast shadow 대신
 * 이 얕고 부드러운 타원으로 "바닥에 붙어 있는 느낌"만 준다.
 */
export const YEOWLI_SHADOW_CONFIG = {
  enabled: true,
  /** 타원의 world 가로/세로 크기 */
  width: 0.82,
  height: 0.32,
  opacity: 0.15,
  /** 완전 검정 대신 방 톤에 맞는 따뜻한 갈색 */
  color: "#6b4a35",
  /** 바닥(y=0)과 완전히 같은 높이면 z-fighting이 생기므로 아주 살짝 띄운다 */
  yOffset: 0.005,
} as const;
