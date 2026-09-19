"use client";

import { GAME_CONFIG } from "@/lib/gameConfig";
import { INTERACTIVE_OBJECTS } from "@/lib/interactiveObjects";

const desk = INTERACTIVE_OBJECTS.find((obj) => obj.id === "desk")!;
const bookshelf = INTERACTIVE_OBJECTS.find((obj) => obj.id === "bookshelf")!;

/**
 * Three.js 기본 Geometry로 만든 프로토타입 공간.
 * 최종 Room/Furniture 에셋이 아니라 UX 검증용 placeholder다.
 */
export default function Room() {
  const { width, depth, wallHeight, doorPosition } = GAME_CONFIG.room;
  const halfWidth = width / 2;
  const halfDepth = depth / 2;

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#f5ecd9" />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, wallHeight / 2, -halfDepth]} receiveShadow>
        <boxGeometry args={[width, wallHeight, 0.2]} />
        <meshStandardMaterial color="#cfe8e2" />
      </mesh>

      {/* Left wall */}
      <mesh position={[-halfWidth, wallHeight / 2, 0]} receiveShadow>
        <boxGeometry args={[0.2, wallHeight, depth]} />
        <meshStandardMaterial color="#cfe8e2" />
      </mesh>

      {/* Right wall */}
      <mesh position={[halfWidth, wallHeight / 2, 0]} receiveShadow>
        <boxGeometry args={[0.2, wallHeight, depth]} />
        <meshStandardMaterial color="#cfe8e2" />
      </mesh>

      {/* Desk */}
      <group position={desk.position}>
        <mesh castShadow receiveShadow position={[0, 0.55, 0]}>
          <boxGeometry args={[desk.colliderSize[0], 0.08, desk.colliderSize[2]]} />
          <meshStandardMaterial color="#c98a4b" />
        </mesh>
        <mesh castShadow receiveShadow position={[0, 0.27, 0]}>
          <boxGeometry
            args={[desk.colliderSize[0] * 0.85, 0.5, desk.colliderSize[2] * 0.85]}
          />
          <meshStandardMaterial color="#a8703a" />
        </mesh>
      </group>

      {/* Bookshelf */}
      <group position={bookshelf.position}>
        <mesh castShadow receiveShadow position={[0, bookshelf.colliderSize[1] / 2, 0]}>
          <boxGeometry args={bookshelf.colliderSize} />
          <meshStandardMaterial color="#8a5a3b" />
        </mesh>
        <mesh
          position={[
            0,
            bookshelf.colliderSize[1] * 0.68,
            bookshelf.colliderSize[2] / 2 + 0.02,
          ]}
        >
          <boxGeometry args={[bookshelf.colliderSize[0] * 0.8, 0.45, 0.05]} />
          <meshStandardMaterial color="#e07a5f" />
        </mesh>
        <mesh
          position={[
            0,
            bookshelf.colliderSize[1] * 0.35,
            bookshelf.colliderSize[2] / 2 + 0.02,
          ]}
        >
          <boxGeometry args={[bookshelf.colliderSize[0] * 0.8, 0.45, 0.05]} />
          <meshStandardMaterial color="#81b29a" />
        </mesh>
      </group>

      {/* Door (decorative, no collision) */}
      <mesh position={doorPosition}>
        <boxGeometry args={[1.2, 1.8, 0.1]} />
        <meshStandardMaterial color="#f2cc8f" />
      </mesh>
    </group>
  );
}
