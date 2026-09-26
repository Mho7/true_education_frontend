"use client";

import { useState, type KeyboardEvent, type PointerEvent } from "react";
import { useElementSize } from "@/components/stage/Anchor";
import type { DashboardResponse } from "@/lib/api/types";

// 한 가지 값(음절/분)만 그리므로 범례 없이 제목이 무엇을 그렸는지 알려 준다.
// 색은 대시보드 공통 주황(검증한 3단계 중 가운데 단계)을 쓴다.
const LINE = "#D2651F";
const HEIGHT = 220;
const PAD = { top: 18, right: 64, bottom: 30, left: 44 };

type Point = DashboardResponse["readingSpeed"][number];

const formatDate = (date: string) => {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
};
const formatSpeed = (value: number) => `${Math.round(value)}`;

/** 0부터 시작하는 깔끔한 눈금 */
function niceTicks(max: number) {
  const rough = Math.max(max, 1) / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? rough;
  const top = Math.ceil(Math.max(max, 1) / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
}

export default function ReadingSpeedChart({ points }: { points: Point[] }) {
  const [ref, size] = useElementSize<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const width = size?.width ?? 0;

  const ticks = niceTicks(Math.max(...points.map((p) => p.syllablesPerMinute)));
  const yMax = ticks[ticks.length - 1];
  const plotW = Math.max(width - PAD.left - PAD.right, 1);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const y = (v: number) => PAD.top + plotH - (v / yMax) * plotH;
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.syllablesPerMinute)}`).join(" ");
  const area = `${line} L${x(points.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  // 날짜 눈금은 겹치지 않게 몇 개만
  const labelEvery = Math.max(1, Math.ceil(points.length / Math.max(Math.floor(plotW / 64), 1)));
  const last = points.length - 1;

  function handlePointer(event: PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - rect.left;
    let nearest = 0;
    for (let i = 1; i < points.length; i++) if (Math.abs(x(i) - px) < Math.abs(x(nearest) - px)) nearest = i;
    setActive(nearest);
  }

  function handleKey(event: KeyboardEvent<SVGSVGElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const step = event.key === "ArrowLeft" ? -1 : 1;
    setActive((prev) => Math.min(Math.max((prev ?? last) + step, 0), last));
  }

  const activePoint = active === null ? null : points[active];

  return (
    <div>
      <div ref={ref} className="relative" style={{ height: HEIGHT }}>
        {width > 0 && (
          <svg
            width={width}
            height={HEIGHT}
            role="img"
            aria-label={`날짜별 읽기 속도. 가장 최근 ${formatDate(points[last].date)} 분당 ${formatSpeed(points[last].syllablesPerMinute)}음절`}
            tabIndex={0}
            onPointerMove={handlePointer}
            onPointerLeave={() => setActive(null)}
            onFocus={() => setActive(last)}
            onBlur={() => setActive(null)}
            onKeyDown={handleKey}
            className="rounded-[8px] outline-none focus-visible:ring-2 focus-visible:ring-[#D2651F]/40"
          >
            {ticks.map((tick) => (
              <g key={tick}>
                <line x1={PAD.left} x2={PAD.left + plotW} y1={y(tick)} y2={y(tick)} stroke="#EFE8DE" strokeWidth={1} />
                <text x={PAD.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" className="fill-[#857B72] text-[11px] tabular-nums">
                  {tick}
                </text>
              </g>
            ))}
            {points.map((p, i) =>
              i % labelEvery === 0 || i === last ? (
                <text key={p.date} x={x(i)} y={HEIGHT - 8} textAnchor="middle" className="fill-[#857B72] text-[11px] tabular-nums">
                  {formatDate(p.date)}
                </text>
              ) : null,
            )}

            {points.length > 1 && <path d={area} fill={LINE} opacity={0.1} />}
            {points.length > 1 && <path d={line} fill="none" stroke={LINE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}

            {activePoint && active !== null && (
              <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={PAD.top + plotH} stroke="#CFC4B6" strokeWidth={1} />
            )}
            {/* 마지막 점과 가리킨 점에만 표시(점마다 숫자를 달지 않는다) */}
            {[last, ...(active !== null && active !== last ? [active] : [])].map((i) => (
              <circle key={i} cx={x(i)} cy={y(points[i].syllablesPerMinute)} r={4.5} fill={LINE} stroke="#FFFFFF" strokeWidth={2} />
            ))}
            <text x={x(last) + 10} y={y(points[last].syllablesPerMinute)} dy="0.32em" className="fill-[#2B2420] text-[12px] font-bold">
              {formatSpeed(points[last].syllablesPerMinute)}
            </text>
          </svg>
        )}

        {activePoint && active !== null && (
          <div
            role="status"
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-[10px] border border-[#EFE6DA] bg-white px-[12px] py-[8px] text-[12px] whitespace-nowrap shadow-[0_6px_16px_rgba(90,62,46,0.12)]"
            style={{ left: Math.min(Math.max(x(active), 70), width - 70) }}
          >
            <p className="text-[15px] font-bold text-[#2B2420]">분당 {formatSpeed(activePoint.syllablesPerMinute)}음절</p>
            <p className="mt-[2px] flex items-center gap-[6px] text-[#857B72]">
              <span aria-hidden className="h-[2px] w-[12px] rounded-full" style={{ background: LINE }} />
              {formatDate(activePoint.date)} · {activePoint.syllables}음절 / {Math.round(activePoint.durationMs / 1000)}초
            </p>
          </div>
        )}
      </div>

      <details className="mt-[8px] text-[13px] text-[#5C5149]">
        <summary className="cursor-pointer text-[#857B72] hover:text-[#5C5149]">표로 보기</summary>
        <table className="mt-[8px] w-full text-left tabular-nums">
          <thead className="text-[#857B72]">
            <tr>
              <th className="py-[4px] font-medium">날짜</th>
              <th className="py-[4px] font-medium">분당 음절</th>
              <th className="py-[4px] font-medium">읽은 음절</th>
              <th className="py-[4px] font-medium">읽은 시간</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.date} className="border-t border-[#F2ECE3]">
                <td className="py-[4px]">{p.date}</td>
                <td className="py-[4px]">{formatSpeed(p.syllablesPerMinute)}</td>
                <td className="py-[4px]">{p.syllables}</td>
                <td className="py-[4px]">{Math.round(p.durationMs / 1000)}초</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
