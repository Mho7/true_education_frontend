"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import RoomBackground from "./RoomBackground";
import GameCanvas from "./GameCanvas";
import GameErrorBoundary from "./GameErrorBoundary";
import InteractionUI from "./InteractionUI";
import HomeMenu from "./HomeMenu";
import CollisionDebugOverlay from "./CollisionDebugOverlay";
import type { InteractionZone } from "@/lib/roomColliders";
import { GAME_DEBUG } from "@/lib/gameConfig";
import { takeHomeCompletionNotice, useStudyEntryGate } from "@/lib/dailyStudy";
import DailyStudyCompleteModal from "@/components/study/DailyStudyCompleteModal";
import DailyStudyDevControls from "@/components/dev/DailyStudyDevControls";

/** 홈 화면이 먼저 보인 뒤 오늘 학습 완료 안내가 뜨기까지 */
const COMPLETION_NOTICE_DELAY = 400;

export default function HomeGame() {
  const router = useRouter();
  const [active, setActive] = useState<InteractionZone | null>(null);
  // Player.tsx가 매 프레임 발 위치(정규화 좌표)를 써넣는 ref. 디버그 오버레이가
  // 리렌더 없이 이 값을 읽어 파란 점을 움직인다.
  const footNormRef = useRef({ x: 0.5, y: 0.5 });
  // 오늘 학습을 끝냈으면 학습으로 가는 대신 완료 안내를 띄운다.
  const { noticeOpen, blockStudyEntry, closeNotice } = useStudyEntryGate();
  const [autoNoticeOpen, setAutoNoticeOpen] = useState(false);

  // 오늘 학습을 끝내고 홈에 처음 왔을 때(또는 /study로 바로 들어왔다가 돌아왔을 때) 완료 안내를 저절로 띄운다.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (takeHomeCompletionNotice()) setAutoNoticeOpen(true);
    }, COMPLETION_NOTICE_DELAY);
    return () => window.clearTimeout(timer);
  }, []);

  const handleInteract = useCallback(
    (route: string) => {
      if (route === "/study" && blockStudyEntry()) return;
      router.push(route);
    },
    [router, blockStudyEntry]
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

      {/* Layer 5 */}
      <HomeMenu onStudyEntry={blockStudyEntry} />

      {/* 개발용: 오늘 학습 제한 초기화 */}
      {process.env.NODE_ENV === "development" && <DailyStudyDevControls />}

      <DailyStudyCompleteModal
        open={noticeOpen || autoNoticeOpen}
        onClose={() => {
          closeNotice();
          setAutoNoticeOpen(false);
        }}
      />
    </div>
  );
}
