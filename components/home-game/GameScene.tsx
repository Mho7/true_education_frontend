"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, useProgress } from "@react-three/drei";
import { GAME_CONFIG } from "@/lib/gameConfig";
import Room from "./Room";
import Player from "./Player";

type GameSceneProps = {
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

export default function GameScene({ onActiveInteractionChange, onInteract }: GameSceneProps) {
  return (
    <Canvas
      shadows
      camera={{
        position: GAME_CONFIG.camera.position,
        fov: GAME_CONFIG.camera.fov,
      }}
      onCreated={({ camera }) => {
        camera.lookAt(...GAME_CONFIG.camera.target);
      }}
    >
      <color attach="background" args={["#eaf4f4"]} />
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[5, 8, 4]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      <Suspense fallback={<Loader />}>
        <Room />
        <Player onActiveInteractionChange={onActiveInteractionChange} onInteract={onInteract} />
      </Suspense>
    </Canvas>
  );
}
