"use client";

import { getDashboard } from "@/lib/api/parents";
import type { DashboardResponse } from "@/lib/api/types";
import { coverColorFor, LEARNING_STAGE_LABELS, localDate } from "@/lib/guardianHome";
import { Cover, StatusChip, StoryCard } from "./GuardianHome";
import { GuardianPage, useGuardian } from "./GuardianShell";
import { ActionButton, cardClassName, Empty, Panel, StatusCard } from "./guardianUi";
import ReadingSpeedChart from "./ReadingSpeedChart";
import StageResults from "./StageResults";
import { useLoad } from "./useLoad";

/** 학습 기록: 요약 숫자 · 읽기 속도 추이 · 판정과 코멘트 · 질문 유형별 결과 · 책별 기록. 판정·문구는 서버 값 그대로 보여 준다. */
export default function GuardianRecords() {
  const { child } = useGuardian();
  const [load, reload] = useLoad(() => getDashboard(child.studentId), `records-${child.studentId}`);

  return (
    <GuardianPage title="학습 기록" description="읽기 속도와 질문 유형별 결과, 책마다 남긴 이야기를 모아 보여 드려요.">
      {load.status === "loading" ? (
        <StatusCard>기록을 불러오는 중…</StatusCard>
      ) : load.status === "error" ? (
        <StatusCard action={<ActionButton onClick={reload}>다시 불러오기</ActionButton>}>{load.message}</StatusCard>
      ) : (
        <RecordsContent data={load.data} />
      )}
    </GuardianPage>
  );
}

const percent = (rate: number) => `${Math.round(rate * 100)}%`;

function RecordsContent({ data }: { data: DashboardResponse }) {
  const labelOf = (stage: string) => data.byStage.find((row) => row.stage === stage)?.label ?? stage;
  const lastSpeed = data.readingSpeed.at(-1);
  // 스스로 맞힌 비율(유형별 비율을 푼 문제 수로 가중 평균)
  const solved = data.byStage.filter((row) => row.firstTryRate !== null && row.total > 0);
  const totalSolved = solved.reduce((sum, row) => sum + row.total, 0);
  const firstTry = totalSolved ? solved.reduce((sum, row) => sum + (row.firstTryRate ?? 0) * row.total, 0) / totalSolved : null;

  const stats = [
    { label: "다 읽은 책", value: `${data.summary.completedBooks}권` },
    { label: "모은 도장", value: `${data.summary.stampTotal}개` },
    { label: "최근 읽기 속도", value: lastSpeed ? `분당 ${Math.round(lastSpeed.syllablesPerMinute)}음절` : "기록 없음" },
    { label: "스스로 맞힌 비율", value: firstTry === null ? "기록 없음" : percent(firstTry) },
  ];

  const good = data.comments.filter((c) => c.status !== "NEEDS_HELP");
  const help = data.comments.filter((c) => c.status === "NEEDS_HELP");
  const { inProgress } = data.summary;

  return (
    <div className="flex flex-col gap-[20px]">
      {data.collecting && (
        <p role="status" className="rounded-[16px] bg-[#FFF4EE] px-[20px] py-[16px] text-[15px] break-keep text-[#8A3E12]">
          <strong className="font-bold">{data.collectingMessage ?? "데이터를 모으고 있어요"}</strong> · 책을 세 권 이상 다 읽으면 유형별 판정을 보여 드려요.
        </p>
      )}

      <section aria-label="요약" className={`${cardClassName} grid grid-cols-2 @[760px]:grid-cols-4`}>
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`px-[24px] py-[18px] ${index % 2 === 1 ? "border-l border-[#EEF0F3]" : ""} ${index >= 2 ? "border-t border-[#EEF0F3] @[760px]:border-t-0" : ""} ${
              index === 2 ? "@[760px]:border-l" : ""
            }`}
          >
            <p className="text-[14px] font-medium text-[#6B7280]">{stat.label}</p>
            <p className="mt-[4px] text-[24px] leading-[32px] font-bold tracking-[-0.01em] break-keep">{stat.value}</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-[20px] @[900px]:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Panel title="읽기 속도" description="분당 읽은 음절 수 (아이 차례에 소리 내어 읽은 줄 기준)">
          {data.readingSpeed.length === 0 ? <Empty>아직 읽기 기록이 없어요.</Empty> : <ReadingSpeedChart points={data.readingSpeed} />}
        </Panel>
        <Panel title="여울이의 판정" description="최근 다 읽은 책 기준">
          {data.collecting ? (
            <Empty>데이터를 모으는 중이에요.</Empty>
          ) : (
            <div className="flex flex-col gap-[14px]">
              <ChipRow title="도움이 필요한 부분" items={data.needsHelp.map(labelOf)} tone="help" empty="지금은 없어요" />
              <ChipRow title="잘하는 부분" items={data.comfortable.map(labelOf)} tone="good" empty="아직 없어요" />
              {good.length > 0 && <StoryCard tone="good" title="잘하고 있어요" text={good.map((c) => c.text).join(" ")} />}
              {help.length > 0 && <StoryCard tone="help" title="함께 봐주세요" text={help.map((c) => c.text).join(" ")} />}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="질문 유형별 결과" description="다 읽은 책에서 푼 문제 기준">
        {data.byStage.length === 0 ? <Empty>아직 푼 문제가 없어요.</Empty> : <StageResults rows={data.byStage} collecting={data.collecting} />}
      </Panel>

      <Panel title="책별 기록" description="읽는 중인 책과 최근 다 읽은 책, 아이가 말로 설명한 내용이에요">
        {!inProgress && data.reflections.length === 0 ? (
          <Empty>아직 읽은 책이 없어요.</Empty>
        ) : (
          <ul className="flex flex-col gap-[12px]">
            {inProgress && (
              <li className="flex items-center gap-[16px] rounded-[16px] border border-[#EEF0F3] px-[16px] py-[14px]">
                <Cover record={{ coverColor: coverColorFor(inProgress.assignmentId) }} size="sm" />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[#8A909C]">지금 읽는 책</p>
                  <p className="truncate text-[17px] font-bold">{inProgress.title}</p>
                  <StatusChip record={{ status: "IN_PROGRESS", stageLabel: LEARNING_STAGE_LABELS[inProgress.stage] ?? inProgress.stage }} />
                </div>
              </li>
            )}
            {data.reflections.map((reflection) => (
              <li key={reflection.assignmentId} className="flex items-start gap-[16px] rounded-[16px] border border-[#EEF0F3] px-[16px] py-[14px]">
                <Cover record={{ coverColor: coverColorFor(reflection.assignmentId) }} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-baseline gap-x-[10px]">
                    <span className="text-[17px] font-bold">{reflection.title}</span>
                    <span className="text-[13px] text-[#8A909C]">
                      {formatDate(localDate(reflection.completedAt))} 완료 · 설명 {formatDuration(reflection.durationMs)}
                    </span>
                  </p>
                  <p className="mt-[6px] text-[15px] leading-[24px] break-keep text-[#3A404B]">“{reflection.transcript}”</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function ChipRow({ title, items, tone, empty }: { title: string; items: string[]; tone: "help" | "good"; empty: string }) {
  return (
    <div>
      <p className="text-[14px] font-semibold text-[#4B5260]">{title}</p>
      <div className="mt-[6px] flex flex-wrap gap-[6px]">
        {items.length === 0 ? (
          <span className="text-[14px] text-[#A3A8B2]">{empty}</span>
        ) : (
          items.map((item) => (
            <span
              key={item}
              className={`rounded-full px-[12px] py-[4px] text-[13px] font-semibold ${tone === "help" ? "bg-[#FFF3E6] text-[#B4560F]" : "bg-[#E9F6EF] text-[#1B7A45]"}`}
            >
              {item}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

function formatDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return `${year}.${month}.${day}`;
}

function formatDuration(ms: number) {
  const seconds = Math.round(ms / 1000);
  return seconds >= 60 ? `${Math.floor(seconds / 60)}분 ${seconds % 60}초` : `${seconds}초`;
}
