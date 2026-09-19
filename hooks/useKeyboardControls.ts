"use client";

import { useEffect, useRef } from "react";

export type MovementInput = {
  x: number;
  z: number;
};

type ControlKey = "up" | "down" | "left" | "right" | "action";

const KEY_MAP: Record<string, ControlKey> = {
  KeyW: "up",
  ArrowUp: "up",
  KeyS: "down",
  ArrowDown: "down",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  Space: "action",
  KeyE: "action",
};

/**
 * 키보드 입력을 ref에 보관해 매 프레임 React state 갱신 없이
 * useFrame 내부에서 직접 읽어갈 수 있게 해주는 훅.
 */
export function useKeyboardControls() {
  const pressedRef = useRef<Record<ControlKey, boolean>>({
    up: false,
    down: false,
    left: false,
    right: false,
    action: false,
  });
  const actionJustPressedRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = KEY_MAP[event.code];
      if (!key) return;

      if (key === "action" && !pressedRef.current.action) {
        actionJustPressedRef.current = true;
      }
      pressedRef.current[key] = true;

      if (key !== "action") {
        event.preventDefault();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = KEY_MAP[event.code];
      if (!key) return;
      pressedRef.current[key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const getMovement = (): MovementInput => {
    const state = pressedRef.current;
    let x = 0;
    let z = 0;

    if (state.up) z -= 1;
    if (state.down) z += 1;
    if (state.left) x -= 1;
    if (state.right) x += 1;

    const length = Math.hypot(x, z);
    if (length > 0) {
      x /= length;
      z /= length;
    }

    return { x, z };
  };

  const consumeActionPressed = () => {
    if (actionJustPressedRef.current) {
      actionJustPressedRef.current = false;
      return true;
    }
    return false;
  };

  return { getMovement, consumeActionPressed };
}
