import * as THREE from "three";

/**
 * 가운데는 살짝 진하고 가장자리로 갈수록 alpha가 0으로 부드럽게 사라지는
 * radial gradient 텍스처를 런타임에 생성한다 (별도 PNG 에셋 없이).
 * 여울이 contact shadow 전용이라 호출하는 쪽(ContactShadow.tsx)에서 1회만 생성해 재사용한다.
 */
export function createSoftShadowTexture(color: string): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("[createSoftShadowTexture] 2D context를 생성할 수 없습니다.");
  }

  const { r, g, b } = hexToRgb(color);
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.85)`);
  gradient.addColorStop(0.55, `rgba(${r}, ${g}, ${b}, 0.4)`);
  gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "");
  const value = parseInt(normalized, 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}
