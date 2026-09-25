"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import BookshelfDevPanel from "@/components/library/BookshelfDevPanel";
import SideNav, { useSideNavWidth } from "@/components/nav/SideNav";
import { Anchor, useElementSize, type Scale } from "@/components/stage/Anchor";
import { useCompletedBooks } from "@/lib/bookshelf";

// 좌표는 Figma "Group 13" 스탬프 시안의 배경 그림(1672×902, 위쪽 창 막대 제외) 기준이다.
const STAGE_WIDTH = 1672;
const STAGE_HEIGHT = 902;

// 카드 안 5×3 도장 자리(가운데 좌표)
const SLOT_X = [396, 617, 836, 1055, 1276];
const SLOT_Y = [364, 553, 735];
const SLOT_SIZE = 172;
const SLOTS = SLOT_Y.flatMap((y) => SLOT_X.map((x) => ({ x: x - SLOT_SIZE / 2, y: y - SLOT_SIZE / 2 })));
const STAMPS_PER_CARD = SLOTS.length;

// 이미 찍히는 걸 본 도장 수. 새로 받은 도장만 "쿵" 찍히는 애니메이션을 보여 주려고 기억해 둔다.
const SEEN_KEY = "yeoul.stamps.seen.v1";

function readSeenCount() {
  try {
    return Number(window.localStorage.getItem(SEEN_KEY) ?? 0) || 0;
  } catch {
    return 0;
  }
}

/** 도장마다 살짝 다른 각도로 찍힌 느낌 (같은 도장은 항상 같은 각도) */
function stampRotation(index: number) {
  return ((index * 37) % 17) - 8;
}

export default function StampScreen() {
  // 책 한 권을 끝낼 때마다 도장 하나 — 책장에 꽂힌 책 수가 곧 도장 수다.
  const stampCount = useCompletedBooks().length;
  const sideNavWidth = useSideNavWidth();
  const [stageRef, stageSize] = useElementSize<HTMLDivElement>();
  const [animateFrom] = useState(() => (typeof window === "undefined" ? 0 : readSeenCount()));

  const totalCards = Math.max(1, Math.ceil(stampCount / STAMPS_PER_CARD));
  // null이면 가장 최근 도장이 있는 마지막 카드를 보여준다.
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const card = Math.min(selectedCard ?? totalCards - 1, totalCards - 1);
  const cardStart = card * STAMPS_PER_CARD;

  useEffect(() => {
    try {
      if (stampCount > 0) window.localStorage.setItem(SEEN_KEY, String(stampCount));
    } catch {
      // 저장이 막혀 있으면 다음에도 애니메이션이 한 번 더 나올 뿐이다.
    }
  }, [stampCount]);

  const scale: Scale | null = stageSize
    ? { x: stageSize.width / STAGE_WIDTH, y: stageSize.height / STAGE_HEIGHT }
    : null;

  return (
    <main className="relative h-screen w-full overflow-hidden bg-[#FBF8F2] font-kr">
      <SideNav />

      <div ref={stageRef} className="absolute inset-y-0 right-0 overflow-hidden" style={{ left: sideNavWidth }}>
        {/* 제목 "나의 스탬프" 팻말은 배경 그림에 들어 있다. */}
        <Image
          src="/stamp/card-bg-notext.png"
          alt=""
          width={STAGE_WIDTH}
          height={STAGE_HEIGHT}
          preload
          className="absolute inset-0 size-full max-w-none"
        />
        <h1 className="sr-only">나의 스탬프</h1>

        {scale && (
          <>

            <ol aria-label={`스탬프 ${stampCount}개`}>
              {SLOTS.map((slot, i) => {
                const index = cardStart + i;
                const stamped = index < stampCount;
                const isNew = stamped && index >= animateFrom;
                return (
                  <li key={index} aria-label={stamped ? `${index + 1}번째 스탬프` : "빈 스탬프 자리"}>
                    <Anchor x={slot.x} y={slot.y} scale={scale}>
                      <div className="relative" style={{ width: SLOT_SIZE, height: SLOT_SIZE }}>
                        <Image src="/stamp/paw-empty.png" alt="" fill sizes="172px" />
                        {stamped && (
                          <div className="absolute inset-0" style={{ rotate: `${stampRotation(index)}deg` }}>
                            <div
                              className={`size-full ${isNew ? "animate-stamp" : ""}`}
                              style={isNew ? { animationDelay: `${(index - animateFrom) * 220 + 300}ms` } : undefined}
                            >
                              {/* 찍히면 아래 빈 자리(회색 발자국)를 가린다 */}
                              <div className="absolute inset-[7%] rounded-full bg-[#FCFDFD]" />
                              <Image src="/stamp/paw-stamped.png" alt="" fill sizes="172px" />
                            </div>
                          </div>
                        )}
                      </div>
                    </Anchor>
                  </li>
                );
              })}
            </ol>

            {totalCards > 1 && (
              <Anchor x={STAGE_WIDTH / 2} y={856} scale={scale} centerX>
                <nav aria-label="스탬프 카드 넘기기" className="flex items-center gap-[14px]">
                  <button
                    type="button"
                    aria-label="이전 스탬프 카드"
                    disabled={card === 0}
                    onClick={() => setSelectedCard(card - 1)}
                    className="flex size-[38px] cursor-pointer items-center justify-center rounded-full bg-white text-[18px] text-[#8B6650] shadow-sm transition hover:bg-[#FBF4EC] disabled:cursor-default disabled:opacity-40"
                  >
                    ‹
                  </button>
                  <p className="min-w-[56px] text-center font-display text-[20px] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">
                    {card + 1} / {totalCards}
                  </p>
                  <button
                    type="button"
                    aria-label="다음 스탬프 카드"
                    disabled={card === totalCards - 1}
                    onClick={() => setSelectedCard(card + 1)}
                    className="flex size-[38px] cursor-pointer items-center justify-center rounded-full bg-white text-[18px] text-[#8B6650] shadow-sm transition hover:bg-[#FBF4EC] disabled:cursor-default disabled:opacity-40"
                  >
                    ›
                  </button>
                </nav>
              </Anchor>
            )}
          </>
        )}

        <BookshelfDevPanel />
      </div>
    </main>
  );
}
