"use client";

/** Layer 1 — 2D room art. Canvas와 Foreground가 같은 정렬 방식을 쓰도록 object-cover 고정. */
export default function RoomBackground() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/home/room-background.png"
      alt=""
      aria-hidden="true"
      className="absolute inset-0 z-0 h-full w-full object-cover object-center"
    />
  );
}
