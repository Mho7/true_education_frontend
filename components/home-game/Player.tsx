"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { GAME_CONFIG, GAME_DEBUG } from "@/lib/gameConfig";
import {
  isBlocked as isBlockedByRect,
  findInteractionZone,
  findClickedInteractionZone,
  normalizedToScreen,
  screenToNormalized,
  BACKGROUND_IMAGE_SIZE,
  type InteractionZone,
} from "@/lib/roomColliders";
import { useKeyboardControls } from "@/hooks/useKeyboardControls";
import { usePointerControls } from "@/hooks/usePointerControls";
import { worldToImagePixel } from "@/lib/screenProjection";
import { tuneYeowliMaterials } from "@/lib/tuneYeowliMaterials";

useGLTF.preload(GAME_CONFIG.player.modelPath);

type PlayerProps = {
  footNormRef: RefObject<{ x: number; y: number }>;
  shadowRef: RefObject<THREE.Mesh | null>;
  onActiveInteractionChange: (zone: InteractionZone | null) => void;
  onInteract: (route: string) => void;
  /** 마우스가 클릭 가능한 가구 위에 올라갔는지 (커서 모양 변경용, 바뀔 때만 호출) */
  onHoverClickableChange: (clickable: boolean) => void;
};

// 회전 감쇠 계수. 1 - exp(-TURN_SPEED * delta) 형태로 써서 프레임레이트와
// 무관하게 항상 같은 체감 속도로 목표 각도에 수렴한다 (naive lerp(a,b,speed*delta)는
// delta가 크게 튀는 프레임에서 오버슈트/불일치가 생길 수 있음).
const TURN_SPEED = 10;
const ANIMATION_FADE_SECONDS = 0.25;
// GLB를 다시 export하면 클립 이름이 바뀔 수 있으므로, 우선순위 후보 목록을 먼저 찾고
// 없으면 이름에 키워드가 포함된 클립을 fallback으로 탐색한다 (하드코딩 가정 금지).
const IDLE_CLIP_CANDIDATES = ["Yeoul_Idle", "Idle"];
const WALK_CLIP_CANDIDATES = ["Yeoul_Walk", "Walk", "Walking"];
// 클릭/터치 목표 지점까지 이 거리(world unit) 안으로 들어오면 도착으로 본다.
const ARRIVE_DISTANCE = 0.05;
// 목표 지점으로 가는 도중 벽/가구에 막혀 이 시간(초) 이상 못 움직이면 이동을 포기한다.
const STUCK_SECONDS = 0.3;

/** 후보 이름을 우선 탐색하고, 없으면 이름에 키워드가 포함된 클립을 찾는다. */
function resolveClipName(names: string[], candidates: string[], fallbackKeyword: string): string | null {
  const exact = candidates.find((c) => names.includes(c));
  if (exact) return exact;
  return names.find((n) => n.toLowerCase().includes(fallbackKeyword)) ?? null;
}

export default function Player({
  footNormRef,
  shadowRef,
  onActiveInteractionChange,
  onInteract,
  onHoverClickableChange,
}: PlayerProps) {
  // 실제 월드 이동/충돌을 담당하는 root. 회전은 이 그룹이 아니라 안쪽 modelRef가 맡는다.
  const groupRef = useRef<THREE.Group>(null!);
  // 여울이 모델의 "바라보는 방향" 회전만 담당하는 그룹 (position/충돌과 분리).
  const modelRef = useRef<THREE.Group>(null!);
  const activeIdRef = useRef<string | null>(null);
  // 매 프레임 새 객체를 만들지 않도록 재사용
  const targetQuaternionRef = useRef(new THREE.Quaternion());
  const targetEulerRef = useRef(new THREE.Euler());

  const { camera, size, gl } = useThree();
  const { scene, animations } = useGLTF(GAME_CONFIG.player.modelPath);
  const { getMovement, consumeActionPressed } = useKeyboardControls();
  const { getHeldPosition, getHoverPosition, consumeTap } = usePointerControls(gl.domElement);

  // 마우스/터치로 지정된 바닥 목표 지점(world). 키보드 입력이 들어오면 즉시 취소된다.
  const moveTargetRef = useRef<THREE.Vector3 | null>(null);
  // 가구(책장/책상)를 클릭했을 때, 도착하면 이동할 상호작용 영역
  const pendingZoneRef = useRef<InteractionZone | null>(null);
  const stuckTimeRef = useRef(0);
  const hoverClickableRef = useRef(false);
  const raycasterRef = useRef(new THREE.Raycaster());
  const ndcRef = useRef(new THREE.Vector2());
  const groundPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);

  // GLB를 복제하고 bounding box를 계산해 발이 바닥(y=0)에 닿도록 자동 보정한다.
  const { model, groundOffset } = useMemo(() => {
    // scene.clone(true) (기본 Object3D.clone)은 SkinnedMesh의 skeleton을 복제하지 않고
    // 원본 뼈를 그대로 참조한다 (three.js SkinnedMesh.copy()가 skeleton을 참조로만 복사).
    // 그 결과 애니메이션 믹서가 "복제된" 뼈를 움직여도 실제 렌더링에 쓰이는 skeleton은
    // 여전히 "원본" 뼈를 가리켜서 화면에 전혀 반영되지 않는다.
    // SkeletonUtils.clone은 skeleton과 bone 참조를 전부 새로 연결해준다.
    const cloned = cloneSkinned(scene) as THREE.Object3D;

    // 이 GLB는 export할 때마다 리깅 안 된 구버전 파츠(body 또는 액세서리)가
    // scene root에 같이 남아있는 경우가 있다 (예: Tori_Bowtie/Tori_Glasses가
    // Yeowl_Rig 안의 리깅된 사본과 중복). 애니메이션이 실제로 붙는 "Yeowl_Rig"
    // 계층만 남기고 나머지 top-level 잔여물은 전부 제거한다.
    const RIG_ROOT_NAME = "Yeowl_Rig";
    const hasRigRoot = cloned.children.some((child) => child.name === RIG_ROOT_NAME);
    if (hasRigRoot) {
      [...cloned.children]
        .filter((child) => child.name !== RIG_ROOT_NAME)
        .forEach((stale) => cloned.remove(stale));
    }

    // Blender Base Color는 그대로 두고, 웹 렌더링(색공간/조명/톤매핑)에 맞게 roughness/
    // emissive/envMapIntensity만 보정한다. clone 직후 1회만 실행 (useMemo라 리렌더/프레임마다 재실행 안 됨).
    tuneYeowliMaterials(cloned);

    const box = new THREE.Box3().setFromObject(cloned);
    return { model: cloned, groundOffset: -box.min.y };
  }, [scene]);

  // clone된 model 위에 애니메이션을 바인딩한다 (원본 scene이 아니라 model 기준이어야
  // 클립의 노드 이름이 실제로 렌더링되는 계층 구조와 일치한다).
  const { actions, names } = useAnimations(animations, model);
  const isMovingRef = useRef(false);

  const idleClip = useMemo(() => resolveClipName(names, IDLE_CLIP_CANDIDATES, "idle"), [names]);
  const walkClip = useMemo(() => resolveClipName(names, WALK_CLIP_CANDIDATES, "walk"), [names]);

  // GLB 진단: 애니메이션 클립/본 트랙, SkinnedMesh 여부를 1회만 콘솔에 출력한다.
  useEffect(() => {
    if (!GAME_DEBUG.logGLB) return;
    console.groupCollapsed("[GLB] yeowl.glb 진단");
    console.log("animations.length =", animations.length);
    animations.forEach((clip) => {
      console.log(`  clip "${clip.name}" tracks=${clip.tracks.length}:`, clip.tracks.map((t) => t.name));
    });
    let meshCount = 0;
    model.traverse((obj) => {
      const mesh = obj as THREE.SkinnedMesh;
      if (mesh.isMesh) {
        meshCount++;
        console.log(
          `  mesh "${obj.name}" isSkinnedMesh=${!!mesh.isSkinnedMesh} skeleton=${!!mesh.skeleton} morphTargets=${!!mesh.morphTargetDictionary}`
        );
      }
    });
    if (animations.length === 0) {
      console.warn("[GLB] animations.length === 0 → GLB export에 애니메이션이 없습니다 (코드 문제 아님, Blender export 확인 필요).");
    }
    if (meshCount === 0) {
      console.warn("[GLB] 렌더링 가능한 Mesh를 찾지 못했습니다.");
    } else {
      model.traverse((obj) => {
        const mesh = obj as THREE.SkinnedMesh;
        if (mesh.isMesh && !mesh.isSkinnedMesh) {
          console.warn(`[GLB] mesh "${obj.name}"가 SkinnedMesh가 아닙니다 → Skin Binding 문제 가능성.`);
        }
      });
    }
    console.log("resolved idleClip =", idleClip, "/ walkClip =", walkClip);
    if (!idleClip) console.warn("[GLB] Idle 애니메이션 후보를 찾지 못했습니다 → Idle: NOT AVAILABLE 처리.");
    if (!walkClip) console.warn("[GLB] Walk 애니메이션 후보를 찾지 못했습니다.");
    console.groupEnd();
  }, [model, animations, idleClip, walkClip]);

  useEffect(() => {
    if (idleClip) actions[idleClip]?.reset().fadeIn(ANIMATION_FADE_SECONDS).play();
    if (walkClip) actions[walkClip]?.setEffectiveTimeScale(0.8);
    return () => {
      if (idleClip) actions[idleClip]?.fadeOut(ANIMATION_FADE_SECONDS);
      if (walkClip) actions[walkClip]?.fadeOut(ANIMATION_FADE_SECONDS);
    };
  }, [actions, idleClip, walkClip]);

  // isometric 카메라 기준 "화면상 위/오른쪽" 방향을 world 벡터로 미리 구해둔다.
  // (카메라는 고정이라 GAME_CONFIG 값만으로 한 번만 계산하면 된다)
  const cameraBasis = useMemo(() => {
    const camPos = new THREE.Vector3(...GAME_CONFIG.camera.position);
    const camTarget = new THREE.Vector3(...GAME_CONFIG.camera.target);
    const forward = camTarget.clone().sub(camPos);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    return { forward, right };
  }, []);

  // world 발 위치(x, 0, z) -> room-background.png 기준 정규화 좌표(0~1).
  // lib/roomColliders.ts의 COLLIDERS/INTERACTION_ZONES가 전부 이 좌표계로 정의되어 있다.
  const worldToNormalized = (x: number, z: number) => {
    const pixel = worldToImagePixel(
      new THREE.Vector3(x, 0, z),
      camera,
      size.width,
      size.height,
      BACKGROUND_IMAGE_SIZE.width,
      BACKGROUND_IMAGE_SIZE.height
    );
    return { x: pixel.x / BACKGROUND_IMAGE_SIZE.width, y: pixel.y / BACKGROUND_IMAGE_SIZE.height };
  };

  // 캐릭터 "발 중앙점" 한 점만으로 판정한다 (원 둘레 샘플링 없음) — 가구/벽 footprint 충돌.
  const isBlockedByRoom = (x: number, z: number) => {
    if (size.width === 0 || size.height === 0) return false;
    const norm = worldToNormalized(x, z);
    return isBlockedByRect(norm.x, norm.y);
  };

  const isBlocked = (x: number, z: number) => {
    if (GAME_DEBUG.disableCollision) return false;
    return isBlockedByRoom(x, z);
  };

  // canvas 픽셀 좌표 -> 바닥(y=0) world 좌표. 수평선 위(바닥과 안 만나는 방향)를 누르면 null.
  const screenToGround = (sx: number, sy: number): THREE.Vector3 | null => {
    if (size.width === 0 || size.height === 0) return null;
    ndcRef.current.set((sx / size.width) * 2 - 1, -(sy / size.height) * 2 + 1);
    raycasterRef.current.setFromCamera(ndcRef.current, camera);
    return raycasterRef.current.ray.intersectPlane(groundPlane, new THREE.Vector3());
  };

  const lastCollisionLogRef = useRef<string | null>(null);
  const lastMovementLogRef = useRef<boolean | null>(null);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const { x: inputX, z: inputZ } = getMovement();
    const { speed, rotationOffset } = GAME_CONFIG.player;
    const hasKeyboardInput = inputX !== 0 || inputZ !== 0;

    // --- 마우스/터치 입력 ---
    // 짧게 탭한 곳이 가구(책장/책상)면 그 앞까지 걸어간 뒤 해당 페이지로 이동한다.
    const tap = consumeTap();
    if (tap && size.width > 0 && size.height > 0) {
      const tapNorm = screenToNormalized(tap.x, tap.y, size.width, size.height);
      const clickedZone = findClickedInteractionZone(tapNorm.x, tapNorm.y);
      if (clickedZone) {
        const approach = normalizedToScreen(
          clickedZone.approachPoint.x,
          clickedZone.approachPoint.y,
          size.width,
          size.height
        );
        pendingZoneRef.current = clickedZone;
        moveTargetRef.current = screenToGround(approach.x, approach.y);
      }
    }
    // 누르고 있는 동안에는 여울이가 포인터가 가리키는 바닥 지점을 계속 따라간다.
    const held = getHeldPosition();
    if (held) {
      pendingZoneRef.current = null;
      const ground = screenToGround(held.x, held.y);
      if (ground) moveTargetRef.current = ground;
    }
    if (hasKeyboardInput) {
      moveTargetRef.current = null;
      pendingZoneRef.current = null;
    }

    let moveX = 0;
    let moveZ = 0;
    let maxStep = Infinity;
    if (hasKeyboardInput) {
      // WASD 축을 world 축이 아니라 "화면상 방향"(카메라 forward/right)으로 변환한다.
      moveX = cameraBasis.right.x * inputX - cameraBasis.forward.x * inputZ;
      moveZ = cameraBasis.right.z * inputX - cameraBasis.forward.z * inputZ;
    } else if (moveTargetRef.current) {
      const dx = moveTargetRef.current.x - group.position.x;
      const dz = moveTargetRef.current.z - group.position.z;
      const distance = Math.hypot(dx, dz);
      if (distance < ARRIVE_DISTANCE) {
        moveTargetRef.current = null;
      } else {
        moveX = dx / distance;
        moveZ = dz / distance;
        // 목표 지점을 지나쳐서 앞뒤로 떨리지 않도록 남은 거리까지만 이동
        maxStep = distance;
      }
    }
    const hasInput = moveX !== 0 || moveZ !== 0;

    if (hasInput && modelRef.current) {
      const targetAngle = Math.atan2(moveX, moveZ) + rotationOffset;
      targetEulerRef.current.set(0, targetAngle, 0);
      targetQuaternionRef.current.setFromEuler(targetEulerRef.current);
      // 지수 감쇠: quaternion.slerp이 알아서 최단 경로로 회전하므로 wrap 처리가 불필요하다.
      const rotationAmount = 1 - Math.exp(-TURN_SPEED * delta);
      modelRef.current.quaternion.slerp(targetQuaternionRef.current, rotationAmount);
    }

    const step = Math.min(speed * delta, maxStep);
    let nextX = group.position.x + moveX * step;
    let nextZ = group.position.z + moveZ * step;

    // X축 이동 먼저 시도 후 충돌 시 되돌리기 (축 분리 방식 -> 벽을 따라 자연스럽게 미끄러짐)
    // 벽/가구 판정은 lib/roomColliders.ts의 이미지 정규화 좌표계 하나로만 한다 — 여기서
    // world 좌표를 다시 별도의 사각형(GAME_CONFIG.room)으로 clamp하면 안 된다. 카메라가
    // isometric이라 world XZ 사각형과 화면상 벽 경계가 전혀 일치하지 않기 때문
    // (예: world 우측 벽 근처 + 앞쪽 끝 조합이 화면상으로는 이미 벽을 한참 지나 화면 밖으로
    // 나가는 지점에 투영됨) — 실제로 이게 "여울이가 벽 위로 올라가는" 버그의 원인이었다.
    if (isBlocked(nextX, group.position.z)) {
      nextX = group.position.x;
    }

    if (isBlocked(nextX, nextZ)) {
      nextZ = group.position.z;
    }

    // 실제로 위치가 바뀐 경우에만 Walk, 키를 놓았거나 충돌로 막혔으면 Idle로 복귀
    const isMoving = nextX !== group.position.x || nextZ !== group.position.z;

    // 클릭/탭으로 지정한 목표가 벽/가구에 막혀 도달 불가능하면 잠시 후 이동을 멈춘다.
    // (누르고 있는 중에는 막혀 있어도 사용자가 방향을 바꿀 수 있으므로 유지)
    if (moveTargetRef.current && !held && !isMoving) {
      stuckTimeRef.current += delta;
      if (stuckTimeRef.current > STUCK_SECONDS) moveTargetRef.current = null;
    } else {
      stuckTimeRef.current = 0;
    }

    // 상태가 실제로 바뀔 때만 crossfade (매 프레임 재생/재시작 방지)
    if (isMoving !== isMovingRef.current) {
      isMovingRef.current = isMoving;
      const nextClipName = isMoving ? walkClip : idleClip;
      const prevClipName = isMoving ? idleClip : walkClip;
      if (nextClipName) actions[nextClipName]?.reset().fadeIn(ANIMATION_FADE_SECONDS).play();
      if (prevClipName) actions[prevClipName]?.fadeOut(ANIMATION_FADE_SECONDS);
    }

    group.position.x = nextX;
    group.position.z = nextZ;

    // Contact shadow는 여울이의 회전(modelRef)과 무관하게, collision과 동일한 foot point
    // (group.position.x/z)만 그대로 따라간다. groupRef 안에 넣지 않고 별도 mesh로 둔 이유는
    // groupRef의 scale(0.7)이 그림자 크기에도 곱해지는 걸 피하기 위해서다.
    if (shadowRef.current) {
      shadowRef.current.position.x = nextX;
      shadowRef.current.position.z = nextZ;
    }

    if (GAME_DEBUG.logMovement && hasInput !== lastMovementLogRef.current) {
      lastMovementLogRef.current = hasInput;
      console.log(
        `[Movement] input=(${inputX.toFixed(2)},${inputZ.toFixed(2)}) move=(${moveX.toFixed(2)},${moveZ.toFixed(2)}) pos=(${nextX.toFixed(2)},${nextZ.toFixed(2)}) isMoving=${isMoving}`
      );
    }

    // 최종 확정된 발 위치(정규화 좌표) — 디버그 로그, 상호작용 판정, 디버그 오버레이 점이 전부 이 값을 공유한다.
    const footNorm = worldToNormalized(nextX, nextZ);
    footNormRef.current.x = footNorm.x;
    footNormRef.current.y = footNorm.y;

    if (GAME_DEBUG.logCollision) {
      const roomBlocked = isBlockedByRoom(nextX, nextZ);
      const key = `${roomBlocked}|${nextX.toFixed(1)}|${nextZ.toFixed(1)}`;
      if (key !== lastCollisionLogRef.current) {
        lastCollisionLogRef.current = key;
        console.log(
          `[Collision] world=(${nextX.toFixed(2)}, ${nextZ.toFixed(2)}) norm=(${footNorm.x.toFixed(3)}, ${footNorm.y.toFixed(3)}) room=${roomBlocked}`
        );
      }
    }

    // 발이 속한 Interaction Zone 탐색 (변경될 때만 React state 갱신)
    const zone = findInteractionZone(footNorm.x, footNorm.y);

    if (zone?.id !== activeIdRef.current) {
      activeIdRef.current = zone?.id ?? null;
      onActiveInteractionChange(zone);
    }

    if (zone && consumeActionPressed()) {
      onInteract(zone.route);
    }

    // 가구를 클릭해서 걸어가는 중: 해당 영역에 들어왔거나, 더 갈 수 없으면(도착/막힘) 페이지 이동
    const pendingZone = pendingZoneRef.current;
    if (pendingZone && (zone?.id === pendingZone.id || !moveTargetRef.current)) {
      pendingZoneRef.current = null;
      moveTargetRef.current = null;
      onInteract(pendingZone.route);
    }

    // 마우스를 가구 위에 올리면 클릭 가능하다는 걸 커서로 알려준다.
    const hover = getHoverPosition();
    let hoverClickable = false;
    if (hover && size.width > 0 && size.height > 0) {
      const hoverNorm = screenToNormalized(hover.x, hover.y, size.width, size.height);
      hoverClickable = findClickedInteractionZone(hoverNorm.x, hoverNorm.y) !== null;
    }
    if (hoverClickable !== hoverClickableRef.current) {
      hoverClickableRef.current = hoverClickable;
      onHoverClickableChange(hoverClickable);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0.5]} scale={GAME_CONFIG.player.scale}>
      <group ref={modelRef}>
        <primitive object={model} position={[0, groundOffset + GAME_CONFIG.player.yOffset, 0]} />
      </group>
    </group>
  );
}
