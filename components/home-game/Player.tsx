"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
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
const ANIMATION_FADE_SECONDS = 0.25;
const IDLE_CLIP = "Idle";
const WALK_CLIP = "Walk";

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

  const { scene, animations } = useGLTF(GAME_CONFIG.player.modelPath);
  const { getMovement, consumeActionPressed } = useKeyboardControls();

  // GLB를 복제하고 bounding box를 계산해 발이 바닥(y=0)에 닿도록 자동 보정한다.
  const { model, groundOffset } = useMemo(() => {
    const cloned = scene.clone(true);

    // 이 GLB의 scene root는 [Tori_Hyper3D_Today, Yeowl_Rig] 두 개다.
    // Tori_Hyper3D_Today는 리깅 이전(구버전) body가 그대로 남아있는 것이라
    // 지우지 않으면 Yeowl_Rig와 겹쳐서 두 마리로 보인다. 애니메이션이 붙은
    // Yeowl_Rig만 남긴다.
    const staleUnriggedBody = cloned.getObjectByName("Tori_Hyper3D_Today");
    if (staleUnriggedBody) {
      cloned.remove(staleUnriggedBody);
    }

    const box = new THREE.Box3().setFromObject(cloned);
    return { model: cloned, groundOffset: -box.min.y };
  }, [scene]);

  // clone된 model 위에 애니메이션을 바인딩한다 (원본 scene이 아니라 model 기준이어야
  // 클립의 노드 이름이 실제로 렌더링되는 계층 구조와 일치한다).
  const { actions } = useAnimations(animations, model);
  const isMovingRef = useRef(false);

  useEffect(() => {
    actions[IDLE_CLIP]?.reset().fadeIn(ANIMATION_FADE_SECONDS).play();
    return () => {
      actions[IDLE_CLIP]?.fadeOut(ANIMATION_FADE_SECONDS);
      actions[WALK_CLIP]?.fadeOut(ANIMATION_FADE_SECONDS);
    };
  }, [actions]);

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

    // 상태가 실제로 바뀔 때만 crossfade (매 프레임 재생/재시작 방지)
    if (isMoving !== isMovingRef.current) {
      isMovingRef.current = isMoving;
      const nextClip = isMoving ? WALK_CLIP : IDLE_CLIP;
      const prevClip = isMoving ? IDLE_CLIP : WALK_CLIP;
      actions[nextClip]?.reset().fadeIn(ANIMATION_FADE_SECONDS).play();
      actions[prevClip]?.fadeOut(ANIMATION_FADE_SECONDS);
    }

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
