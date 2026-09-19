"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { GAME_CONFIG } from "@/lib/gameConfig";
import { INTERACTIVE_OBJECTS } from "@/lib/interactiveObjects";
import { useKeyboardControls } from "@/hooks/useKeyboardControls";
import { circleIntersectsBox, makeBoxCollider } from "@/lib/collision";

useGLTF.preload(GAME_CONFIG.player.modelPath);

type PlayerProps = {
  onActiveInteractionChange: (id: string | null) => void;
  onInteract: (route: string) => void;
};

const ROTATION_LERP_SPEED = 10;

/** target 각도를 current와 가장 가까운 방향(최단 경로)으로 감아준다 */
function wrapTowards(target: number, current: number) {
  let delta = (target - current) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return current + delta;
}

export default function Player({ onActiveInteractionChange, onInteract }: PlayerProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const facingRef = useRef(0);
  const activeIdRef = useRef<string | null>(null);

  const { scene } = useGLTF(GAME_CONFIG.player.modelPath);
  const { getMovement, consumeActionPressed } = useKeyboardControls();

  // GLB를 복제하고 bounding box를 계산해 발이 바닥(y=0)에 닿도록 자동 보정한다.
  const { model, groundOffset } = useMemo(() => {
    const cloned = scene.clone(true);
    const box = new THREE.Box3().setFromObject(cloned);
    return { model: cloned, groundOffset: -box.min.y };
  }, [scene]);

  const colliders = useMemo(
    () =>
      INTERACTIVE_OBJECTS.map((obj) => ({
        id: obj.id,
        box: makeBoxCollider(obj.position, obj.colliderSize),
      })),
    []
  );

  const bounds = useMemo(() => {
    const halfWidth = GAME_CONFIG.room.width / 2;
    const halfDepth = GAME_CONFIG.room.depth / 2;
    const radius = GAME_CONFIG.collision.playerRadius;
    return {
      minX: -halfWidth + radius,
      maxX: halfWidth - radius,
      minZ: -halfDepth + radius,
      maxZ: halfDepth - radius,
    };
  }, []);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const { x, z } = getMovement();
    const { speed, rotationOffset } = GAME_CONFIG.player;
    const radius = GAME_CONFIG.collision.playerRadius;
    const isMoving = x !== 0 || z !== 0;

    if (isMoving) {
      const targetRotation = Math.atan2(x, z) + rotationOffset;
      facingRef.current = THREE.MathUtils.lerp(
        facingRef.current,
        wrapTowards(targetRotation, facingRef.current),
        Math.min(1, delta * ROTATION_LERP_SPEED)
      );
      group.rotation.y = facingRef.current;
    }

    let nextX = group.position.x + x * speed * delta;
    let nextZ = group.position.z + z * speed * delta;

    // X축 이동 먼저 시도 후 충돌 시 되돌리기 (축 분리 방식 -> 벽을 따라 자연스럽게 미끄러짐)
    if (colliders.some(({ box }) => circleIntersectsBox(nextX, group.position.z, radius, box))) {
      nextX = group.position.x;
    }
    nextX = THREE.MathUtils.clamp(nextX, bounds.minX, bounds.maxX);

    if (colliders.some(({ box }) => circleIntersectsBox(nextX, nextZ, radius, box))) {
      nextZ = group.position.z;
    }
    nextZ = THREE.MathUtils.clamp(nextZ, bounds.minZ, bounds.maxZ);

    group.position.x = nextX;
    group.position.z = nextZ;

    // 가장 가까운 Interaction 대상 탐색 (변경될 때만 React state 갱신)
    let closestId: string | null = null;
    let closestDistance = Infinity;
    for (const obj of INTERACTIVE_OBJECTS) {
      const dx = nextX - obj.position[0];
      const dz = nextZ - obj.position[2];
      const distance = Math.hypot(dx, dz);
      if (distance <= obj.interactionDistance && distance < closestDistance) {
        closestDistance = distance;
        closestId = obj.id;
      }
    }

    if (closestId !== activeIdRef.current) {
      activeIdRef.current = closestId;
      onActiveInteractionChange(closestId);
    }

    if (closestId && consumeActionPressed()) {
      const target = INTERACTIVE_OBJECTS.find((obj) => obj.id === closestId);
      if (target) onInteract(target.route);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0.5]} scale={GAME_CONFIG.player.scale}>
      <primitive object={model} position={[0, groundOffset + GAME_CONFIG.player.yOffset, 0]} />
    </group>
  );
}
