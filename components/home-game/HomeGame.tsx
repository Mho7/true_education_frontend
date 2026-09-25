"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import RoomBackground from "./RoomBackground";
import GameCanvas from "./GameCanvas";
import GameErrorBoundary from "./GameErrorBoundary";
import InteractionUI from "./InteractionUI";
import CollisionDebugOverlay from "./CollisionDebugOverlay";
import type { InteractionZone } from "@/lib/roomColliders";
import { GAME_DEBUG } from "@/lib/gameConfig";

export default function HomeGame() {
  const router = useRouter();
  const [active, setActive] = useState<InteractionZone | null>(null);
  // Player.tsx가 매 프레임 발 위치(정규화 좌표)를 써넣는 ref. 디버그 오버레이가
  // 리렌더 없이 이 값을 읽어 파란 점을 움직인다.
  const footNormRef = useRef({ x: 0.5, y: 0.5 });

  const handleInteract = useCallback(
    (route: string) => {
      router.push(route);
    },
    [router]
  );

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#f7efe1]">
      {/* Layer 1 */}
      {!GAME_DEBUG.hideRoomLayers && <RoomBackground />}

      {/* Layer 2 */}
      <GameErrorBoundary>
        <GameCanvas
          footNormRef={footNormRef}
          onActiveInteractionChange={setActive}
          onInteract={handleInteract}
        />
      </GameErrorBoundary>

      {/* Layer 3 (debug only) */}
      {GAME_DEBUG.debugCollision && <CollisionDebugOverlay footNormRef={footNormRef} />}

      {/* Layer 4 */}
      <InteractionUI active={active} onInteract={handleInteract} />

    </div>
  );
}
