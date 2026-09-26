// 보호자 홈(시안 abcc.png)에 쓰는 선 아이콘. 색은 currentColor를 따른다.

type IconProps = { className?: string };

const line = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function OpenBookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} {...line}>
      <path d="M12 6.5C10.2 5.2 7.6 4.6 4 4.8v13c3.6-.2 6.2.4 8 1.7 1.8-1.3 4.4-1.9 8-1.7v-13c-3.6-.2-6.2.4-8 1.7Z" />
      <path d="M12 6.5v13" />
    </svg>
  );
}

export function HomeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M11.3 3.3a1 1 0 0 1 1.4 0l8 7.4a1 1 0 0 1-.7 1.7H19v7.1a1 1 0 0 1-1 1h-3.5v-5.2h-5v5.2H6a1 1 0 0 1-1-1v-7.1H4a1 1 0 0 1-.7-1.7l8-7.4Z" />
    </svg>
  );
}

export function RecordIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} {...line}>
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4.5" />
    </svg>
  );
}

export function GiftIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} {...line}>
      <rect x="4" y="8.5" width="16" height="4" rx="1" />
      <path d="M5.5 12.5V20h13v-7.5M12 8.5V20" />
      <path d="M12 8.5C10.8 5.8 7.6 4.9 7.3 6.9c-.3 1.7 2.6 1.6 4.7 1.6Zm0 0c1.2-2.7 4.4-3.6 4.7-1.6.3 1.7-2.6 1.6-4.7 1.6Z" />
    </svg>
  );
}

export function GearIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} {...line}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function BookStackIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M12 3.2 3 7.6l9 4.4 9-4.4-9-4.4Z" />
      <path d="m4.6 11.3-1.6.8 9 4.4 9-4.4-1.6-.8L12 15l-7.4-3.7Z" opacity="0.85" />
      <path d="m4.6 15.8-1.6.8 9 4.4 9-4.4-1.6-.8L12 19.5l-7.4-3.7Z" opacity="0.7" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} {...line} strokeWidth={2.4}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function ChevronIcon({ className, direction = "right" }: IconProps & { direction?: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} {...line} strokeWidth={2}>
      <path d={direction === "right" ? "M9 5l7 7-7 7" : "M15 5l-7 7 7 7"} />
    </svg>
  );
}

export function RingIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} {...line} strokeWidth={2}>
      <circle cx="12" cy="12" r="7.5" />
    </svg>
  );
}

export function HeartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} {...line} strokeWidth={2}>
      <path d="M12 19.5s-7.5-4.4-7.5-9.6A4.2 4.2 0 0 1 12 7.4a4.2 4.2 0 0 1 7.5 2.5c0 5.2-7.5 9.6-7.5 9.6Z" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} {...line} strokeWidth={2}>
      <path d="M19.5 12A7.5 7.5 0 1 1 12 4.5" />
      <path d="M12 8v4.3l2.8 1.7M16 3.8l2.9.4-.4 2.9" />
    </svg>
  );
}

export function SproutIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M11.2 20.5v-6.7C8.4 13.9 4.7 12.6 4 7.2c4.3-.4 7 1.5 7.9 4.6.9-4 3.8-6.3 8.1-5.8-.4 5.4-3.9 7.4-7.2 7.6v6.9h-1.6Z" />
    </svg>
  );
}

export function ChatBubbleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M12 4c4.7 0 8.5 3 8.5 6.8s-3.8 6.8-8.5 6.8c-.9 0-1.8-.1-2.6-.3L5.2 19.5l1-3.4C4.5 14.9 3.5 13 3.5 10.8 3.5 7 7.3 4 12 4Z" />
      <circle cx="8.3" cy="10.8" r="1.1" fill="#FFFFFF" />
      <circle cx="12" cy="10.8" r="1.1" fill="#FFFFFF" />
      <circle cx="15.7" cy="10.8" r="1.1" fill="#FFFFFF" />
    </svg>
  );
}
