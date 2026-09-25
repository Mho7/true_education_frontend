"use client";

import { Suspense, useRef, useState, type RefObject } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, useProgress } from "@react-three/drei";
import * as THREE from "three";
import { GAME_CONFIG, YEOWLI_VISUAL_CONFIG, YEOWLI_SHADOW_CONFIG } from "@/lib/gameConfig";
import type { InteractionZone } from "@/lib/roomColliders";
import Player from "./Player";
import ContactShadow from "./ContactShadow";

type GameCanvasProps = {
  footNormRef: RefObject<{ x: number; y: number }>;
  onActiveInteractionChange: (zone: InteractionZone | null) => void;
  onInteract: (route: string) => void;
};

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="whitespace-nowrap rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-zinc-600 shadow">
        불러오는 중... {Math.round(progress)}%
      </div>
    </Html>
  );
}

/** Layer 2 — room-background.png 위에 겹쳐지는 투명 Canvas. Yeowl만 그린다. */
export default function GameCanvas({ footNormRef, onActiveInteractionChange, onInteract }: GameCanvasProps) {
  const shadowRef = useRef<THREE.Mesh>(null);
  const [hoverClickable, setHoverClickable] = useState(false);

  return (
    <Canvas
      // Canvas가 내부적으로 wrapper div에 position:relative를 강제로 지정하므로,
      // className이 아니라 style로 덮어써야 absolute + z-index가 실제로 적용된다.
      // touchAction: none — 터치 드래그가 페이지 스크롤/핀치 줌으로 새지 않고 캐릭터 조작에만 쓰이게 한다.
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 10,
        touchAction: "none",
        cursor: hoverClickable ? "pointer" : undefined,
      }}
      gl={{ alpha: true }}
      // "soft" -> renderer.shadowMap.enabled = true / type = PCFSoftShadowMap (R3F 관용 표기).
      // 배경은 DOM <img>(RoomBackground)라 이 Canvas의 tone mapping/shadow와 무관하게 원본 색 그대로 유지된다.
      shadows="soft"
      camera={{
        position: GAME_CONFIG.camera.position,
        fov: GAME_CONFIG.camera.fov,
      }}
      onCreated={({ camera, gl }) => {
        camera.lookAt(...GAME_CONFIG.camera.target);

        // 여울이 GLB 색감을 웹에서 Blender와 비슷하게 보이도록 하는 renderer 보정.
        // 배경 <img>는 이 Canvas 밖의 별도 DOM 레이어라 영향을 받지 않는다.
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = YEOWLI_VISUAL_CONFIG.exposure;

        if (process.env.NODE_ENV === "development") {
          console.log(
            `[Yeowli Visual]\nExposure: ${YEOWLI_VISUAL_CONFIG.exposure}\nEmissive: ${YEOWLI_VISUAL_CONFIG.emissiveIntensity}\nRoughness: ${YEOWLI_VISUAL_CONFIG.roughness}\nKey light: ${YEOWLI_VISUAL_CONFIG.keyIntensity}\nAmbient light: ${YEOWLI_VISUAL_CONFIG.ambientIntensity}`
          );
        }
      }}
    >
      {/* 여울이 GLB 전용 조명 밸런스. 암부를 줄이고 크림톤 하이라이트를 얹는 목적이라
          배경 PNG와는 무관하다 (배경은 DOM 레이어라 이 빛의 영향을 받지 않음). */}
      <hemisphereLight
        color={YEOWLI_VISUAL_CONFIG.hemiSkyColor}
        groundColor={YEOWLI_VISUAL_CONFIG.hemiGroundColor}
        intensity={YEOWLI_VISUAL_CONFIG.hemiIntensity}
      />
      <directionalLight
        color={YEOWLI_VISUAL_CONFIG.keyColor}
        intensity={YEOWLI_VISUAL_CONFIG.keyIntensity}
        position={YEOWLI_VISUAL_CONFIG.keyPosition}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
      />
      <directionalLight
        color={YEOWLI_VISUAL_CONFIG.fillColor}
        intensity={YEOWLI_VISUAL_CONFIG.fillIntensity}
        position={YEOWLI_VISUAL_CONFIG.fillPosition}
      />
      <ambientLight color={YEOWLI_VISUAL_CONFIG.ambientColor} intensity={YEOWLI_VISUAL_CONFIG.ambientIntensity} />

      <Suspense fallback={<Loader />}>
        {YEOWLI_SHADOW_CONFIG.enabled && <ContactShadow shadowRef={shadowRef} />}
        <Player
          footNormRef={footNormRef}
          shadowRef={shadowRef}
          onActiveInteractionChange={onActiveInteractionChange}
          onInteract={onInteract}
          onHoverClickableChange={setHoverClickable}
        />
      </Suspense>
    </Canvas>
  );
}
