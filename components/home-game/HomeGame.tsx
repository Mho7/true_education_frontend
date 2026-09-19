"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import GameScene from "./GameScene";
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
    <div className="relative h-screen w-full overflow-hidden bg-[#eaf4f4]">
      <GameErrorBoundary>
        <GameScene onActiveInteractionChange={setActiveId} onInteract={handleInteract} />
      </GameErrorBoundary>
      <InteractionUI active={active} />
    </div>
  );
}
