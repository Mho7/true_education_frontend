import * as THREE from "three";

/**
 * 3D world 좌표를 카메라로 투영해 뷰포트 픽셀 좌표를 구한 뒤, room-background.png가
 * 쓰는 `object-cover object-center` 매핑을 그대로 역산해서 배경 원본 해상도 기준
 * 픽셀 좌표로 변환한다. lib/roomColliders.ts의 정규화 좌표 충돌 판정이 이 함수를 사용한다.
 */
export function worldToImagePixel(
  worldPos: THREE.Vector3,
  camera: THREE.Camera,
  viewportWidth: number,
  viewportHeight: number,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number } {
  const ndc = worldPos.clone().project(camera);
  const screenX = ((ndc.x + 1) / 2) * viewportWidth;
  const screenY = ((1 - ndc.y) / 2) * viewportHeight;

  // object-cover: 컨테이너를 완전히 덮도록 확대 후 중앙 기준으로 잘라낸다.
  const scale = Math.max(viewportWidth / imageWidth, viewportHeight / imageHeight);
  const offsetX = (imageWidth * scale - viewportWidth) / 2;
  const offsetY = (imageHeight * scale - viewportHeight) / 2;

  return {
    x: (screenX + offsetX) / scale,
    y: (screenY + offsetY) / scale,
  };
}
