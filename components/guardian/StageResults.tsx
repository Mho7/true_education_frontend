"use client";

import { useState } from "react";
import type { DashboardResponse, DashboardStageStatus } from "@/lib/api/types";

type StageRow = DashboardResponse["byStage"][number];

// 스스로 맞힘(초록) → 힌트 보고 맞힘(노랑) → 정답 공개(빨강). 신호등처럼 바로 읽히게 하되,
// 색약에서도 구분되도록 밝기를 벌렸다(dataviz 검증: 모든 쌍 CVD ΔE ≥ 9, 일반 ΔE ≥ 16 통과. 노랑은 바탕 대비가 낮아 칸 안 숫자·범례·표로 보완).
const PARTS = [
  { key: "firstTryRate", label: "스스로 맞힘", color: "#176A42", ink: "#FFFFFF" },
  { key: "afterRetryRate", label: "힌트 보고 맞힘", color: "#DDA22A", ink: "#111418" },
  { key: "revealedRate", label: "정답 공개", color: "#EA6353", ink: "#111418" },
] as const;

type PartKey = (typeof PARTS)[number]["key"];

/**
 * 판정 이름(서버 status 값 → 화면 글). 판정 자체와 코멘트 문구는 서버 값을 그대로 쓴다.
 * 판정 요약은 위쪽 카드(잘하는 부분·도움이 필요한 부분)가 맡으므로, 여기서는 배경 없는 작은 글자로 막대 수치를 거드는 정도로만 보여 준다.
 */
export const STATUS: Record<DashboardStageStatus, { label: string; className: string; icon: string }> = {
  NEEDS_HELP: { label: "도움이 필요해요", className: "text-[#A8402B]", icon: "!" },
  COMFORTABLE: { label: "잘하고 있어요", className: "text-[#2E6B3A]", icon: "✓" },
  NORMAL: { label: "차근차근 익히는 중", className: "text-[#8A909C]", icon: "·" },
  COLLECTING: { label: "모으는 중", className: "text-[#A3A8B2]", icon: "…" },
};

/** 화면에 보일 판정: 전체가 모으는 중이거나(완료 3권 미만) 이 유형 문제가 없으면 "모으는 중", 아니면 서버 판정 그대로 */
export function displayStatus(row: StageRow, collecting: boolean): DashboardStageStatus {
  return collecting || row.status === "COLLECTING" || row.total === 0 ? "COLLECTING" : row.status;
}

const percent = (rate: number | null) => `${Math.round((rate ?? 0) * 100)}%`;

/** 막대 색 범례. 기본은 그래프 위에 두고, 보호자 홈처럼 카드 제목 옆에 따로 둘 때는 className으로 크기를 줄인다 */
export function StageLegend({ className = "text-[13px]" }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-x-[16px] gap-y-[4px] ${className} text-[#4B5260]`} aria-label="범례">
      {PARTS.map((part) => (
        <li key={part.key} className="flex items-center gap-[6px]">
          <span aria-hidden className="size-[10px] rounded-[3px]" style={{ background: part.color }} />
          {part.label}
        </li>
      ))}
    </ul>
  );
}

export default function StageResults({
  rows,
  collecting,
  showTable = true,
  showLegend = true,
}: {
  rows: StageRow[];
  collecting: boolean;
  showTable?: boolean;
  /** false면 범례를 그리지 않는다(부모가 StageLegend를 따로 둔다) */
  showLegend?: boolean;
}) {
  const [active, setActive] = useState<{ stage: string; key: PartKey } | null>(null);

  return (
    <div>
      {showLegend && <StageLegend />}

      <ul className={`${showLegend ? "mt-[16px]" : ""} flex flex-col gap-[18px]`}>
        {rows.map((row) => {
          // 전체가 모으는 중이면(완료 3권 미만) 비율을 그리지 않는다.
          const pending = displayStatus(row, collecting) === "COLLECTING";
          const status = STATUS[displayStatus(row, collecting)];
          // 좁은 화면: 1줄 [유형 이름 · 판정] / 2줄 막대 (긴 유형 이름이 막대 옆 좁은 칸에서 줄바꿈되지 않게)
          return (
            <li
              key={row.stage}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-[12px] gap-y-[8px] sm:grid-cols-[96px_minmax(0,1fr)_120px] sm:gap-x-[16px]"
            >
              <span className="text-[15px] font-bold break-keep text-[#111418]">{row.label}</span>
              {pending ? (
                <span className="flex h-[28px] items-center rounded-[6px] border border-dashed border-[#E6E8EC] px-[10px] text-[12px] text-[#8A909C] max-sm:col-span-2 max-sm:row-start-2">
                  데이터를 모으는 중
                </span>
              ) : (
                <div className="relative max-sm:col-span-2 max-sm:row-start-2">
                  <div className="flex h-[28px] gap-[2px] overflow-visible" role="img" aria-label={`${row.label}: ${PARTS.map((p) => `${p.label} ${percent(row[p.key])}`).join(", ")}`}>
                    {PARTS.map((part) => {
                      const rate = row[part.key] ?? 0;
                      if (rate <= 0) return null;
                      const isActive = active?.stage === row.stage && active.key === part.key;
                      const visibleParts = PARTS.filter((p) => (row[p.key] ?? 0) > 0);
                      const first = visibleParts[0]?.key === part.key;
                      const lastPart = visibleParts[visibleParts.length - 1]?.key === part.key;
                      return (
                        <span
                          key={part.key}
                          tabIndex={0}
                          onPointerEnter={() => setActive({ stage: row.stage, key: part.key })}
                          onPointerLeave={() => setActive(null)}
                          onFocus={() => setActive({ stage: row.stage, key: part.key })}
                          onBlur={() => setActive(null)}
                          className={`relative flex items-center justify-center text-[12px] font-semibold tabular-nums outline-none transition-[filter] focus-visible:ring-2 focus-visible:ring-[#2B2420]/30 ${
                            first ? "rounded-l-[4px]" : ""
                          } ${lastPart ? "rounded-r-[4px]" : ""} ${isActive ? "brightness-110" : ""}`}
                          style={{ flexGrow: rate, flexBasis: 0, background: part.color, color: part.ink }}
                        >
                          {/* 칸이 좁으면(40px 미만) 숫자를 넣지 않는다. 막대의 aria-label·툴팁·표로 볼 수 있다 */}
                          <span aria-hidden className="@container absolute inset-0 flex items-center justify-center overflow-hidden">
                            <span className="hidden @[40px]:inline">{percent(rate)}</span>
                          </span>
                          {isActive && (
                            <span
                              role="status"
                              className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-10 -translate-x-1/2 rounded-[10px] border border-[#E6E8EC] bg-white px-[10px] py-[6px] text-left whitespace-nowrap shadow-[0_6px_16px_rgba(90,62,46,0.12)]"
                            >
                              <span className="block text-[14px] font-bold text-[#111418]">{percent(rate)}</span>
                              <span className="block text-[12px] font-normal text-[#8A909C]">
                                {part.label} · {row.total}문제 중
                              </span>
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              <span
                className={`flex items-center gap-[4px] text-[12px] font-medium whitespace-nowrap max-sm:col-start-2 max-sm:row-start-1 max-sm:justify-self-end ${status.className}`}
              >
                <span aria-hidden>{status.icon}</span>
                {status.label}
              </span>
            </li>
          );
        })}
      </ul>

      {!collecting && showTable && (
        <details className="mt-[12px] text-[13px] text-[#4B5260]">
          <summary className="cursor-pointer text-[#8A909C] hover:text-[#4B5260]">표로 보기</summary>
          <table className="mt-[8px] w-full text-left tabular-nums">
            <thead className="text-[#8A909C]">
              <tr>
                <th className="py-[4px] font-medium">유형</th>
                <th className="py-[4px] font-medium">푼 문제</th>
                {PARTS.map((part) => (
                  <th key={part.key} className="py-[4px] font-medium">
                    {part.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.stage} className="border-t border-[#EEF0F3]">
                  <td className="py-[4px]">{row.label}</td>
                  <td className="py-[4px]">{row.total}</td>
                  {PARTS.map((part) => (
                    <td key={part.key} className="py-[4px]">
                      {row[part.key] === null ? "-" : percent(row[part.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </div>
  );
}
