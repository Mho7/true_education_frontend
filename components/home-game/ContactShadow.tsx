"use client";

import { useMemo, type RefObject } from "react";
import * as THREE from "three";
import { YEOWLI_SHADOW_CONFIG } from "@/lib/gameConfig";
import { createSoftShadowTexture } from "@/lib/softShadowTexture";

type ContactShadowProps = {
  shadowRef: RefObject<THREE.Mesh | null>;
};

/**
 * 여울이 발밑 soft contact shadow. 실시간 물리 그림자가 아니라, 살짝 띄운 반투명
 * 타원 plane 하나다 — 배경 PNG에 이미 그려진 창문 그림자 등과 충돌하지 않도록
 * 아주 옅고 부드럽게만 접지감을 준다.
 *
 * 위치(x, z)는 이 컴포넌트가 아니라 Player.tsx의 기존 useFrame이 매 프레임
 * `shadowRef.current.position`에 직접 써준다 (collision에 쓰는 foot point와 동일 기준 —
 * 새 useFrame을 추가하지 않고 기존 이동 루프에 통합).
 */
export default function ContactShadow({ shadowRef }: ContactShadowProps) {
  // 텍스처에 색을 이미 구웠으므로 material.color는 흰색(기본값)으로 둬서 이중으로
  // 곱해지지 않게 한다 (아니면 브라운이 자기자신과 곱해져 탁하게 어두워짐).
  const texture = useMemo(() => createSoftShadowTexture(YEOWLI_SHADOW_CONFIG.color), []);

  return (
    <mesh
      ref={shadowRef}
      position={[0, YEOWLI_SHADOW_CONFIG.yOffset, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      renderOrder={-1}
    >
      <planeGeometry args={[YEOWLI_SHADOW_CONFIG.width, YEOWLI_SHADOW_CONFIG.height]} />
      <meshBasicMaterial map={texture} transparent opacity={YEOWLI_SHADOW_CONFIG.opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
