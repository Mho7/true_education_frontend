"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import RoomBackground from "./RoomBackground";
import GameCanvas from "./GameCanvas";
import RoomForeground from "./RoomForeground";
import GameErrorBoundary from "./GameErrorBoundary";
import InteractionUI from "./InteractionUI";
import { INTERACTIVE_OBJECTS } from "@/lib/interactiveObjects";

export default function HomeGame() {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleInteract = useCallback(
    (route: string) => {
      router.push(route);
    },
    [router]
  );

  const active = INTERACTIVE_OBJECTS.find((obj) => obj.id === activeId) ?? null;

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#f7efe1]">
      {/* Layer 1 */}
      <RoomBackground />

      {/* Layer 2 */}
      <GameErrorBoundary>
        <GameCanvas onActiveInteractionChange={setActiveId} onInteract={handleInteract} />
      </GameErrorBoundary>

      {/* Layer 3 */}
      <RoomForeground />

      {/* Layer 4 */}
      <InteractionUI active={active} />
    </div>
  );
}
