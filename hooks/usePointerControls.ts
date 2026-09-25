"use client";

import { useEffect, useRef } from "react";

/** canvas 기준 로컬 픽셀 좌표 */
export type PointerPosition = {
  x: number;
  y: number;
};

// 이 거리(px) 이상 움직이면 "탭"이 아니라 "드래그"로 본다 (손가락 떨림 허용치).
const TAP_MOVE_THRESHOLD = 10;

/**
 * 터치 스크롤/핀치 줌이 조작을 가로채지 않도록 element에 `touch-action: none`이 걸려 있어야 한다
 * (GameCanvas의 style에서 지정).
 *
 * 마우스/터치(Pointer Events) 입력을 ref에 보관해 useFrame에서 리렌더 없이 읽어가게 해주는 훅.
 * - 누르고 있는 동안: getHeldPosition()이 현재 포인터 위치를 반환 (캐릭터가 따라감)
 * - 짧게 눌렀다 뗀 경우: consumeTap()이 한 번만 그 위치를 반환 (가구 선택 판정용)
 * - 누르지 않은 상태의 마우스 위치: getHoverPosition() (커서 모양 변경용)
 */
export function usePointerControls(element: HTMLElement) {
  const heldRef = useRef<PointerPosition | null>(null);
  const hoverRef = useRef<PointerPosition | null>(null);
  const tapRef = useRef<PointerPosition | null>(null);
  const downRef = useRef<{ pointerId: number; start: PointerPosition; dragged: boolean } | null>(null);

  useEffect(() => {
    const toLocal = (event: PointerEvent): PointerPosition => {
      const rect = element.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const handleDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      // 멀티터치 시 첫 손가락만 사용
      if (downRef.current) return;
      const pos = toLocal(event);
      downRef.current = { pointerId: event.pointerId, start: pos, dragged: false };
      heldRef.current = pos;
      element.setPointerCapture(event.pointerId);
    };

    const handleMove = (event: PointerEvent) => {
      const pos = toLocal(event);
      const down = downRef.current;
      if (!down) {
        hoverRef.current = event.pointerType === "mouse" ? pos : null;
        return;
      }
      if (event.pointerId !== down.pointerId) return;
      heldRef.current = pos;
      if (Math.hypot(pos.x - down.start.x, pos.y - down.start.y) > TAP_MOVE_THRESHOLD) {
        down.dragged = true;
      }
    };

    const handleUp = (event: PointerEvent) => {
      const down = downRef.current;
      if (!down || event.pointerId !== down.pointerId) return;
      if (!down.dragged && event.type === "pointerup") {
        tapRef.current = toLocal(event);
      }
      downRef.current = null;
      heldRef.current = null;
    };

    const handleLeave = () => {
      hoverRef.current = null;
    };

    element.addEventListener("pointerdown", handleDown);
    element.addEventListener("pointermove", handleMove);
    element.addEventListener("pointerup", handleUp);
    element.addEventListener("pointercancel", handleUp);
    element.addEventListener("pointerleave", handleLeave);

    return () => {
      element.removeEventListener("pointerdown", handleDown);
      element.removeEventListener("pointermove", handleMove);
      element.removeEventListener("pointerup", handleUp);
      element.removeEventListener("pointercancel", handleUp);
      element.removeEventListener("pointerleave", handleLeave);
    };
  }, [element]);

  const getHeldPosition = () => heldRef.current;
  const getHoverPosition = () => hoverRef.current;

  const consumeTap = () => {
    const tap = tapRef.current;
    tapRef.current = null;
    return tap;
  };

  return { getHeldPosition, getHoverPosition, consumeTap };
}
