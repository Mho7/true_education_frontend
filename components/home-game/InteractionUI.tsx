"use client";

import type { InteractiveObjectConfig } from "@/lib/interactiveObjects";

type InteractionUIProps = {
  active: InteractiveObjectConfig | null;
};

export default function InteractionUI({ active }: InteractionUIProps) {
  if (!active) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-8 z-30 flex justify-center">
      <div className="flex flex-col items-center gap-1 rounded-2xl bg-white/95 px-6 py-3 text-center shadow-lg ring-1 ring-black/5">
        <p className="text-base font-semibold text-zinc-800">{active.label}</p>
        <p className="text-xs font-medium tracking-wide text-zinc-500">
          SPACE 또는 E · {active.actionLabel}
        </p>
      </div>
    </div>
  );
}
