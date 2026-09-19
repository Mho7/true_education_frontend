"use client";

import { GAME_CONFIG } from "@/lib/gameConfig";
import { INTERACTIVE_OBJECTS } from "@/lib/interactiveObjects";

const desk = INTERACTIVE_OBJECTS.find((obj) => obj.id === "desk")!;
const bookshelf = INTERACTIVE_OBJECTS.find((obj) => obj.id === "bookshelf")!;
const COLORS = GAME_CONFIG.colors;

/**
 * Three.js 기본 Geometry로 만든 프로토타입 디오라마 공간.
 * 최종 Room/Furniture 에셋이 아니라 UX/Composition 검증용 placeholder다.
 */
export default function Room() {
  const { width, depth, wallHeight } = GAME_CONFIG.room;
  const halfWidth = width / 2;
  const halfDepth = depth / 2;

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={COLORS.floor} />
      </mesh>

      {/* Rug (decorative, open area) */}
      <mesh position={[-0.6, 0.005, 1.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.6, 32]} />
        <meshStandardMaterial color={COLORS.rug} />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, wallHeight / 2, -halfDepth]} receiveShadow>
        <boxGeometry args={[width, wallHeight, 0.2]} />
        <meshStandardMaterial color={COLORS.wall} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-halfWidth, wallHeight / 2, 0]} receiveShadow>
        <boxGeometry args={[0.2, wallHeight, depth]} />
        <meshStandardMaterial color={COLORS.wallShade} />
      </mesh>

      {/* Right wall */}
      <mesh position={[halfWidth, wallHeight / 2, 0]} receiveShadow>
        <boxGeometry args={[0.2, wallHeight, depth]} />
        <meshStandardMaterial color={COLORS.wallShade} />
      </mesh>

      {/* Window (decorative, back wall right side) */}
      <group position={[3.2, wallHeight * 0.62, -halfDepth + 0.11]}>
        <mesh>
          <boxGeometry args={[1.6, 1.1, 0.06]} />
          <meshStandardMaterial color={COLORS.windowFrame} />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[1.4, 0.9, 0.02]} />
          <meshStandardMaterial color={COLORS.windowGlass} />
        </mesh>
      </group>

      {/* Bookshelf */}
      <group position={bookshelf.position}>
        <mesh castShadow receiveShadow position={[0, bookshelf.colliderSize[1] / 2, 0]}>
          <boxGeometry args={bookshelf.colliderSize} />
          <meshStandardMaterial color={COLORS.bookshelfBody} />
        </mesh>

        {/* 선반 (가로 판) 3단 */}
        {[0.34, 0.62, 0.9].map((ratio) => (
          <mesh
            key={ratio}
            position={[0, bookshelf.colliderSize[1] * ratio, bookshelf.colliderSize[2] / 2 - 0.16]}
          >
            <boxGeometry args={[bookshelf.colliderSize[0] * 0.92, 0.06, 0.32]} />
            <meshStandardMaterial color={COLORS.bookshelfShelf} />
          </mesh>
        ))}

        {/* 책 (장식) */}
        {[
          { x: -0.9, color: COLORS.book1 },
          { x: -0.55, color: COLORS.book2 },
          { x: -0.2, color: COLORS.book3 },
          { x: 0.9, color: COLORS.book2 },
          { x: 0.55, color: COLORS.book1 },
          { x: 0.2, color: COLORS.book3 },
        ].map((book, i) => (
          <mesh key={i} position={[book.x, bookshelf.colliderSize[1] * 0.48, bookshelf.colliderSize[2] / 2 - 0.16]}>
            <boxGeometry args={[0.16, 0.42, 0.28]} />
            <meshStandardMaterial color={book.color} />
          </mesh>
        ))}
      </group>

      {/* Desk + Chair */}
      <group position={desk.position}>
        {/* Desktop */}
        <mesh castShadow receiveShadow position={[0, 0.62, 0]}>
          <boxGeometry args={[desk.colliderSize[0], 0.08, desk.colliderSize[2]]} />
          <meshStandardMaterial color={COLORS.deskTop} />
        </mesh>

        {/* Left leg */}
        <mesh
          castShadow
          receiveShadow
          position={[-desk.colliderSize[0] / 2 + 0.1, 0.29, desk.colliderSize[2] / 2 - 0.1]}
        >
          <boxGeometry args={[0.14, 0.58, 0.14]} />
          <meshStandardMaterial color={COLORS.deskLeg} />
        </mesh>

        {/* Right leg */}
        <mesh
          castShadow
          receiveShadow
          position={[desk.colliderSize[0] / 2 - 0.1, 0.29, desk.colliderSize[2] / 2 - 0.1]}
        >
          <boxGeometry args={[0.14, 0.58, 0.14]} />
          <meshStandardMaterial color={COLORS.deskLeg} />
        </mesh>

        {/* Desk lamp (decorative) */}
        <group position={[desk.colliderSize[0] / 2 - 0.3, 0.66, -desk.colliderSize[2] / 2 + 0.2]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.22, 8]} />
            <meshStandardMaterial color={COLORS.deskLeg} />
          </mesh>
          <mesh castShadow position={[0, 0.16, 0]}>
            <coneGeometry args={[0.12, 0.14, 12]} />
            <meshStandardMaterial color={COLORS.lampShade} />
          </mesh>
        </group>

        {/* Chair (decorative, not interactive) */}
        <group position={[0, 0, desk.colliderSize[2] / 2 + 0.6]}>
          <mesh castShadow receiveShadow position={[0, 0.26, 0]}>
            <boxGeometry args={[0.5, 0.06, 0.5]} />
            <meshStandardMaterial color={COLORS.chair} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 0.5, 0.22]}>
            <boxGeometry args={[0.5, 0.5, 0.06]} />
            <meshStandardMaterial color={COLORS.chair} />
          </mesh>
          {[
            [-0.2, -0.2],
            [0.2, -0.2],
            [-0.2, 0.2],
            [0.2, 0.2],
          ].map(([x, z], i) => (
            <mesh key={i} castShadow position={[x, 0.12, z]}>
              <boxGeometry args={[0.06, 0.24, 0.06]} />
              <meshStandardMaterial color={COLORS.deskLeg} />
            </mesh>
          ))}
        </group>
      </group>

      {/* Plants (decorative) */}
      <Plant position={[-halfWidth + 0.7, 0, 3]} />
      <Plant position={[halfWidth - 0.7, 0, 3.2]} />
    </group>
  );
}

function Plant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.16, 0.13, 0.32, 10]} />
        <meshStandardMaterial color={GAME_CONFIG.colors.plantPot} />
      </mesh>
      <mesh castShadow position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.26, 10, 10]} />
        <meshStandardMaterial color={GAME_CONFIG.colors.plantLeaf} />
      </mesh>
    </group>
  );
}
