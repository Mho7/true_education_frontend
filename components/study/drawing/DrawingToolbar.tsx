"use client";

import type { ReactNode } from "react";
import { PALETTE, type DrawingTool } from "@/lib/drawing";

// 좌표는 그리기 판(시안 652×754, 콘텐츠 캔버스 x=56, y=73) 기준이다. 아래 칸(y≥637)에 도구가 있다.
const SWATCH_SIZE = 43;
const SWATCH_FIRST_CENTER = { x: 51, y: 669 };
const SWATCH_GAP = { x: 56, y: 52 };
const SWATCHES_PER_ROW = 6;
const TOOL_BUTTON_TOP = 661;

type DrawingToolbarProps = {
  tool: DrawingTool;
  color: string;
  canUndo: boolean;
  canClear: boolean;
  onSelectColor: (color: string) => void;
  onSelectEraser: () => void;
  onUndo: () => void;
  onClear: () => void;
};

export default function DrawingToolbar({ tool, color, canUndo, canClear, onSelectColor, onSelectEraser, onUndo, onClear }: DrawingToolbarProps) {
  return (
    <>
      <div role="group" aria-label="색 고르기">
        {PALETTE.map((swatch, index) => {
          // 지우개를 쓰는 동안에는 색 선택 표시를 끈다. 색을 누르면 다시 펜이 된다.
          const selected = tool === "pen" && swatch.color === color;
          const cx = SWATCH_FIRST_CENTER.x + (index % SWATCHES_PER_ROW) * SWATCH_GAP.x;
          const cy = SWATCH_FIRST_CENTER.y + Math.floor(index / SWATCHES_PER_ROW) * SWATCH_GAP.y;
          return (
            <button
              key={swatch.color}
              type="button"
              aria-label={swatch.label}
              aria-pressed={selected}
              onClick={() => onSelectColor(swatch.color)}
              className={`absolute cursor-pointer rounded-full transition-transform duration-150 active:scale-95 ${
                selected ? "scale-[1.084] shadow-[0_0_0_1.75px_#FFFAF3,0_0_0_3.5px_#3A2A20]" : "border border-[#3A2A20]/12 hover:scale-105"
              }`}
              style={{
                left: cx - SWATCH_SIZE / 2,
                top: cy - SWATCH_SIZE / 2,
                width: SWATCH_SIZE,
                height: SWATCH_SIZE,
                backgroundColor: swatch.color,
              }}
            />
          );
        })}
      </div>

      <ToolButton left={388} label="지우개" pressed={tool === "eraser"} onClick={onSelectEraser}>
        <svg viewBox="562 746 19 17" aria-hidden className="h-[17px] w-[19px]" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinejoin="round">
          <path d="M573.834 747.668L579.334 753.168L571.084 761.418H566.5L563.75 758.668L573.834 747.668Z" />
          <path d="M569.25 752.25L574.75 757.75" />
        </svg>
      </ToolButton>

      <ToolButton left={462} label="되돌리기" disabled={!canUndo} onClick={onUndo}>
        <svg viewBox="636 746 19 17" aria-hidden className="h-[17px] w-[19px]" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <path d="M642.334 748.582L638.667 752.249L642.334 755.916" />
          <path d="M638.667 752.25H647.834C649.05 752.25 650.215 752.733 651.075 753.592C651.935 754.452 652.417 755.618 652.417 756.834C652.417 758.049 651.935 759.215 651.075 760.075C650.215 760.934 649.05 761.417 647.834 761.417H645.084" />
        </svg>
      </ToolButton>

      <span aria-hidden className="absolute top-[675px] left-[540px] h-[40px] w-px bg-[#EADFCF]" />

      <button
        type="button"
        onClick={onClear}
        disabled={!canClear}
        className="absolute top-[670px] left-[561px] flex h-[50px] w-[60px] cursor-pointer flex-col items-center rounded-[12px] pt-[6px] text-[#A0907F] transition hover:bg-[#F4ECDF] disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent"
      >
        <svg viewBox="736 749 14 16" aria-hidden className="h-[16px] w-[14px]" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinejoin="round">
          <path d="M737.75 753.25H748.25M740.75 753.25V751H745.25V753.25M739.25 753.25L740 763H746L746.75 753.25" />
        </svg>
        <span className="mt-[8px] text-[11px] leading-[13px] font-medium whitespace-nowrap">전체 지우기</span>
      </button>
    </>
  );
}

function ToolButton({
  left,
  label,
  pressed,
  disabled = false,
  onClick,
  children,
}: {
  left: number;
  label: string;
  pressed?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={`absolute flex h-[68px] w-[64px] cursor-pointer flex-col items-center rounded-[16px] border pt-[12px] transition active:scale-95 disabled:cursor-default disabled:text-[#C9BCAD] disabled:active:scale-100 ${
        pressed ? "border-[#D9621C] bg-[#FFF4E8] text-[#D9621C]" : "border-[#E6D8C4] bg-white text-[#5A4334] hover:bg-[#FBF4EC] disabled:hover:bg-white"
      }`}
      style={{ left, top: TOOL_BUTTON_TOP }}
    >
      {children}
      <span className="mt-[12px] text-[12px] leading-[14px] font-bold whitespace-nowrap">{label}</span>
    </button>
  );
}
