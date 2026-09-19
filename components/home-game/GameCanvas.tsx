"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, useProgress } from "@react-three/drei";
import { GAME_CONFIG } from "@/lib/gameConfig";
import Player from "./Player";

type GameCanvasProps = {
  onActiveInteractionChange: (id: string | null) => void;
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
export default function GameCanvas({ onActiveInteractionChange, onInteract }: GameCanvasProps) {
  return (
    <Canvas
      // Canvas가 내부적으로 wrapper div에 position:relative를 강제로 지정하므로,
      // className이 아니라 style로 덮어써야 absolute + z-index가 실제로 적용된다.
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 10 }}
      gl={{ alpha: true }}
      camera={{
        position: GAME_CONFIG.camera.position,
        fov: GAME_CONFIG.camera.fov,
      }}
      onCreated={({ camera }) => {
        camera.lookAt(...GAME_CONFIG.camera.target);
      }}
    >
      <ambientLight intensity={0.75} color="#fff2df" />
      <directionalLight position={[6, 9, 5]} intensity={1.3} color="#ffe9c7" />

      <Suspense fallback={<Loader />}>
        <Player onActiveInteractionChange={onActiveInteractionChange} onInteract={onInteract} />
      </Suspense>
    </Canvas>
  );
}
