"use client";

import { useState } from "react";
import type { DashboardResponse, DashboardStageStatus } from "@/lib/api/types";

type StageRow = DashboardResponse["byStage"][number];

// 스스로 맞힘 → 힌트 보고 맞힘 → 정답 공개. 좋은 쪽이 진하도록 주황 한 가지 색의 세 단계
// (dataviz 검증: 밝기 단조·단계 간격·흰 바탕 대비 모두 통과).
const PARTS = [
  { key: "firstTryRate", label: "스스로 맞힘", color: "#8F3C12", ink: "#FFFFFF" },
  { key: "afterRetryRate", label: "힌트 보고 맞힘", color: "#D2651F", ink: "#FFFFFF" },
  { key: "revealedRate", label: "정답 공개", color: "#EDA16A", ink: "#2B2420" },
] as const;

type PartKey = (typeof PARTS)[number]["key"];

/** 판정 이름(서버 status 값 → 화면 글). 판정 자체와 코멘트 문구는 서버 값을 그대로 쓴다. */
const STATUS: Record<DashboardStageStatus, { label: string; className: string; icon: string }> = {
  NEEDS_HELP: { label: "도움이 필요해요", className: "bg-[#FDECE8] text-[#A8402B]", icon: "!" },
  COMFORTABLE: { label: "잘하고 있어요", className: "bg-[#E9F4E3] text-[#2E6B3A]", icon: "✓" },
  NORMAL: { label: "차근차근 익히는 중", className: "bg-[#F4EFE8] text-[#5C5149]", icon: "·" },
  COLLECTING: { label: "모으는 중", className: "bg-[#F4EFE8] text-[#857B72]", icon: "…" },
};

const percent = (rate: number | null) => `${Math.round((rate ?? 0) * 100)}%`;
/** 이 비율보다 좁은 칸에는 숫자를 넣지 않는다(툴팁·표에서 볼 수 있다) */
const INLINE_LABEL_MIN = 0.14;

export default function StageResults({ rows, collecting }: { rows: StageRow[]; collecting: boolean }) {
  const [active, setActive] = useState<{ stage: string; key: PartKey } | null>(null);

  return (
    <div>
      <ul className="flex flex-wrap gap-x-[16px] gap-y-[4px] text-[13px] text-[#5C5149]" aria-label="범례">
        {PARTS.map((part) => (
          <li key={part.key} className="flex items-center gap-[6px]">
            <span aria-hidden className="size-[10px] rounded-[3px]" style={{ background: part.color }} />
            {part.label}
          </li>
        ))}
      </ul>

      <ul className="mt-[14px] flex flex-col gap-[14px]">
        {rows.map((row) => {
          // 전체가 모으는 중이면(완료 3권 미만) 비율을 그리지 않는다.
          const pending = collecting || row.status === "COLLECTING" || row.total === 0;
          const status = STATUS[pending ? "COLLECTING" : row.status];
          return (
            <li key={row.stage} className="grid grid-cols-[88px_1fr_auto] items-center gap-[12px] max-sm:grid-cols-[72px_1fr]">
              <span className="text-[15px] font-bold break-keep text-[#2B2420]">{row.label}</span>
              {pending ? (
                <span className="flex h-[24px] items-center rounded-[6px] border border-dashed border-[#DCD2C4] px-[10px] text-[12px] text-[#857B72]">
                  데이터를 모으는 중
                </span>
              ) : (
                <div className="relative">
                  <div className="flex h-[24px] gap-[2px] overflow-visible" role="img" aria-label={`${row.label}: ${PARTS.map((p) => `${p.label} ${percent(row[p.key])}`).join(", ")}`}>
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
                          className={`relative flex items-center justify-center text-[12px] font-bold outline-none transition-[filter] focus-visible:ring-2 focus-visible:ring-[#2B2420]/30 ${
                            first ? "rounded-l-[4px]" : ""
                          } ${lastPart ? "rounded-r-[4px]" : ""} ${isActive ? "brightness-110" : ""}`}
                          style={{ flexGrow: rate, flexBasis: 0, background: part.color, color: part.ink }}
                        >
                          {rate >= INLINE_LABEL_MIN ? percent(rate) : ""}
                          {isActive && (
                            <span
                              role="status"
                              className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-10 -translate-x-1/2 rounded-[10px] border border-[#EFE6DA] bg-white px-[10px] py-[6px] text-left whitespace-nowrap shadow-[0_6px_16px_rgba(90,62,46,0.12)]"
                            >
                              <span className="block text-[14px] font-bold text-[#2B2420]">{percent(rate)}</span>
                              <span className="block text-[12px] font-normal text-[#857B72]">
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
              <span className={`flex items-center gap-[4px] justify-self-start rounded-full px-[10px] py-[3px] text-[12px] font-bold max-sm:col-start-2 ${status.className}`}>
                <span aria-hidden>{status.icon}</span>
                {status.label}
              </span>
            </li>
          );
        })}
      </ul>

      {!collecting && (
        <details className="mt-[12px] text-[13px] text-[#5C5149]">
          <summary className="cursor-pointer text-[#857B72] hover:text-[#5C5149]">표로 보기</summary>
          <table className="mt-[8px] w-full text-left tabular-nums">
            <thead className="text-[#857B72]">
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
                <tr key={row.stage} className="border-t border-[#F2ECE3]">
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
