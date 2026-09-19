export type BoxCollider = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

export function makeBoxCollider(
  position: [number, number, number],
  size: [number, number, number]
): BoxCollider {
  const [x, , z] = position;
  const [width, , depth] = size;
  return {
    minX: x - width / 2,
    maxX: x + width / 2,
    minZ: z - depth / 2,
    maxZ: z + depth / 2,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/** 원(circle)과 AABB(box)가 XZ 평면에서 겹치는지 판정 */
export function circleIntersectsBox(
  circleX: number,
  circleZ: number,
  radius: number,
  box: BoxCollider
): boolean {
  const closestX = clamp(circleX, box.minX, box.maxX);
  const closestZ = clamp(circleZ, box.minZ, box.maxZ);
  const dx = circleX - closestX;
  const dz = circleZ - closestZ;
  return dx * dx + dz * dz < radius * radius;
}
