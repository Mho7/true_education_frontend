"use client";

import type { InteractionZone } from "@/lib/roomColliders";

type InteractionUIProps = {
  active: InteractionZone | null;
  onInteract: (route: string) => void;
};

export default function InteractionUI({ active, onInteract }: InteractionUIProps) {
  if (!active) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-8 z-30 flex justify-center">
      {/* 키보드가 없는 터치 환경에서도 이동할 수 있도록 카드 자체를 버튼으로 둔다. */}
      <button
        type="button"
        onClick={() => onInteract(active.route)}
        className="pointer-events-auto flex cursor-pointer flex-col items-center gap-1 rounded-2xl bg-white/95 px-6 py-3 text-center shadow-lg ring-1 ring-black/5 transition hover:bg-white active:scale-95"
      >
        <p className="text-base font-semibold text-zinc-800">{active.label}</p>
        <p className="text-xs font-medium tracking-wide text-zinc-500">
          눌러서 또는 SPACE · E · {active.actionLabel}
        </p>
      </button>
    </div>
  );
}
