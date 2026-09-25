"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { FOX_ASPECT, type FoxPose } from "./studyMap";

const FOX_POSES = Object.keys(FOX_ASPECT) as FoxPose[];

/**
 * 발끝(x, y)에 서 있는 여울이. 포즈를 바꿀 때 새 그림을 받느라 깜빡이지 않도록
 * 모든 포즈를 미리 겹쳐 두고 지금 포즈만 보이게 한다.
 */
export function Fox({ x, y, height, pose, className = "" }: { x: number; y: number; height: number; pose: FoxPose; className?: string }) {
  return (
    <div className={`absolute ${className}`} style={{ left: x, top: y }}>
      {FOX_POSES.map((name) => {
        const width = height * FOX_ASPECT[name];
        return (
          <Image
            key={name}
            src={`/study/fox-${name}.png`}
            alt=""
            width={Math.round(width)}
            height={Math.round(height)}
            preload
            className={`absolute bottom-0 max-w-none select-none ${name === pose ? "" : "invisible"}`}
            style={{ left: -width / 2, width, height }}
            draggable={false}
          />
        );
      })}
    </div>
  );
}

// 말풍선 그림(900×450)에서 몸통이 차지하는 자리: 가로 41~877, 세로 68~350. 그 아래는 꼬리다.
// 글자 상자를 몸통에 맞추고, 그림은 몸통 바깥 여백만큼 넓혀서 깐다(%는 글자 상자 기준).
const BUBBLE_BODY = { left: 41, right: 900 - 877, top: 68, bottom: 450 - 350, width: 877 - 41, height: 350 - 68 };
const BUBBLE_INSET = {
  top: `-${(BUBBLE_BODY.top / BUBBLE_BODY.height) * 100}%`,
  bottom: `-${(BUBBLE_BODY.bottom / BUBBLE_BODY.height) * 100}%`,
  near: `-${(BUBBLE_BODY.left / BUBBLE_BODY.width) * 100}%`,
  far: `-${(BUBBLE_BODY.right / BUBBLE_BODY.width) * 100}%`,
};

/**
 * 말풍선. (x, y)는 꼬리 끝이다. flipped면 꼬리가 오른쪽 아래에 오고 풍선은 왼쪽으로 펼쳐진다.
 * key로 대사를 넘기면 대사가 바뀔 때마다 톡 튀어나온다.
 */
export function SpeechBubble({ x, y, flipped = false, children }: { x: number; y: number; flipped?: boolean; children: ReactNode }) {
  const style: CSSProperties = {
    left: x,
    top: y,
    transform: `translate(${flipped ? "-100%" : "0"}, -100%)`,
  };
  return (
    // 꼬리가 글자 상자 아래로 내려오는 만큼(pb) 띄운다.
    <div className="pointer-events-none absolute pb-[16px]" style={style}>
      <div className="relative animate-pop-in" style={{ transformOrigin: flipped ? "bottom right" : "bottom left" }}>
        <div
          className="absolute"
          style={{
            top: BUBBLE_INSET.top,
            bottom: BUBBLE_INSET.bottom,
            left: flipped ? BUBBLE_INSET.far : BUBBLE_INSET.near,
            right: flipped ? BUBBLE_INSET.near : BUBBLE_INSET.far,
          }}
        >
          <Image
            src="/study/bubble.png"
            alt=""
            fill
            sizes="600px"
            preload
            className="select-none"
            style={flipped ? { transform: "scaleX(-1)" } : undefined}
            draggable={false}
          />
        </div>
        <p className="relative min-w-[260px] px-[40px] py-[20px] text-center font-cocochoi text-[34px] leading-[46px] whitespace-pre-line text-[#4A3A2E]">
          {children}
        </p>
      </div>
    </div>
  );
}

/** 다음에 누를 곳 위에서 통통 튀는 화살표. 부모 상자 가운데 위에 뜬다. */
export function NextArrow() {
  return (
    <div className="pointer-events-none absolute bottom-full left-1/2 mb-[6px] -translate-x-1/2">
      <svg viewBox="0 0 48 44" aria-hidden className="h-[44px] w-[48px] animate-bounce drop-shadow-[0_3px_4px_rgba(90,62,46,0.35)]">
        <path d="M6 8h36L24 38Z" fill="#FFD84D" stroke="#FFFFFF" strokeWidth="5" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

const PILL_CLASS_NAME =
  "relative flex h-[76px] min-w-[280px] cursor-pointer items-center justify-center rounded-full bg-[#9AEB19] px-[40px] font-display text-[28px] text-[#5C5149] shadow-[0_8px_18px_rgba(70,110,20,0.28)] transition hover:brightness-105 active:scale-[0.97]";

/** 시안의 연두색 알약 버튼 (시안 "마지막"의 "보물상자 열기" 모양). href를 주면 링크가 된다. */
export function PillButton({ children, onClick, href }: { children: ReactNode; onClick?: () => void; href?: string }) {
  const content = (
    <>
      {/* 시안처럼 안쪽에 한 겹 밝은 띠를 둔다 */}
      <span aria-hidden className="absolute inset-[6px] rounded-full bg-[#D9D9D9]/30" />
      <span className="relative whitespace-nowrap">{children}</span>
    </>
  );
  if (href) {
    return (
      <Link href={href} className={PILL_CLASS_NAME}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={PILL_CLASS_NAME}>
      {content}
    </button>
  );
}
