// 선물 도장(5, 10, 15번째 칸). 발자국 도장(172×172 그림)과 같은 크기·색 톤으로 그린다.

const STAMP_RED = "#EF8A71";
const GOLD = "#E2AE4F";

/** 선물 상자. 172×172 좌표계 가운데에 놓인다. */
function GiftShape({ color, ribbon }: { color: string; ribbon: string }) {
  return (
    <g>
      {/* 리본 매듭 */}
      <path d="M86 66c-6-14-26-20-30-9-3 8 12 11 30 9Z" fill={color} />
      <path d="M86 66c6-14 26-20 30-9 3 8-12 11-30 9Z" fill={color} />
      {/* 뚜껑과 몸통 */}
      <rect x="46" y="66" width="80" height="20" rx="5" fill={color} />
      <rect x="52" y="89" width="68" height="44" rx="5" fill={color} />
      {/* 세로 리본 */}
      <rect x="80" y="66" width="12" height="67" fill={ribbon} />
    </g>
  );
}

export function RewardStampEmpty() {
  return (
    <svg viewBox="0 0 172 172" aria-hidden className="size-full">
      <circle cx="86" cy="86" r="78" fill="#FFF8EA" stroke={GOLD} strokeWidth="3" strokeDasharray="10 8" strokeLinecap="round" />
      <g opacity="0.55">
        <GiftShape color={GOLD} ribbon="#FFF8EA" />
      </g>
    </svg>
  );
}

export function RewardStampFilled() {
  return (
    <svg viewBox="0 0 172 172" aria-hidden className="size-full">
      <circle cx="86" cy="86" r="80" fill="#FCFDFD" />
      <circle cx="86" cy="86" r="77" fill="none" stroke={STAMP_RED} strokeWidth="6" />
      <circle cx="86" cy="86" r="68" fill="none" stroke={STAMP_RED} strokeWidth="2" />
      <GiftShape color={STAMP_RED} ribbon="#FCFDFD" />
      {/* 반짝임 */}
      <path d="M140 30l3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill={GOLD} />
      <path d="M32 132l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill={GOLD} />
    </svg>
  );
}

/** 팝업 머리에 쓰는 작은 선물 아이콘 */
export function GiftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="40 44 92 92" aria-hidden className={className}>
      <GiftShape color={STAMP_RED} ribbon="#FFFFFF" />
    </svg>
  );
}
