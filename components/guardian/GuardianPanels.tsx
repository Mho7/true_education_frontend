"use client";

import type { ReactNode } from "react";
import { getDashboard } from "@/lib/api/parents";
import type { LinkedStudent } from "@/lib/api/types";
import { ActionButton, cardClassName, SectionHeader, StatusCard } from "./guardianUi";
import ReadingSpeedChart from "./ReadingSpeedChart";
import RewardSettings from "./RewardSettings";
import StageResults from "./StageResults";
import { useLoad } from "./useLoad";

// 보호자 메뉴의 "학습 기록"·"리워드 설정" 화면. 홈과 달리 길어질 수 있어 한 화면에 맞추지 않고 스크롤한다.

function PageHeader({ child, title, description }: { child: LinkedStudent; title: string; description: string }) {
  return (
    <header className="mb-[24px]">
      <p className="text-[15px] font-medium text-[#8A909C]">{child.name}</p>
      <h1 className="mt-[4px] text-[34px] leading-[44px] font-bold tracking-[-0.02em] max-sm:text-[26px] max-sm:leading-[34px]">{title}</h1>
      <p className="mt-[6px] text-[15px] text-[#6B7280]">{description}</p>
    </header>
  );
}

function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className={`${cardClassName} p-[24px] max-sm:p-[16px]`}>
      <SectionHeader title={title} />
      {description && <p className="mt-[2px] text-[14px] text-[#8A909C]">{description}</p>}
      <div className="mt-[16px]">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-[14px] bg-[#F7F8FA] px-[20px] py-[24px] text-center text-[15px] text-[#8A909C]">{children}</p>;
}

const formatDate = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : `${date.getMonth() + 1}월 ${date.getDate()}일`;
};

const formatDuration = (ms: number) => {
  const seconds = Math.round(ms / 1000);
  return seconds >= 60 ? `${Math.floor(seconds / 60)}분 ${seconds % 60}초` : `${seconds}초`;
};

/** 학습 기록: 읽기 속도 추이 · 질문 유형별 결과 · 설명 말하기 기록 (판정·문구는 서버 값 그대로) */
export function RecordsView({ child }: { child: LinkedStudent }) {
  const [load, reload] = useLoad(() => getDashboard(child.studentId), `records-${child.studentId}`);

  return (
    <>
      <PageHeader child={child} title="학습 기록" description="읽기 속도와 질문 유형별 결과를 모아 보여 드려요." />
      {load.status === "loading" ? (
        <StatusCard>기록을 불러오는 중…</StatusCard>
      ) : load.status === "error" ? (
        <StatusCard action={<ActionButton onClick={reload}>다시 불러오기</ActionButton>}>{load.message}</StatusCard>
      ) : (
        <div className="flex flex-col gap-[20px]">
          {load.data.collecting && (
            <p role="status" className="rounded-[16px] bg-[#FFF4EE] px-[20px] py-[16px] text-[15px] break-keep text-[#8A3E12]">
              <strong className="font-bold">{load.data.collectingMessage ?? "데이터를 모으고 있어요"}</strong> · 책을 세 권 이상 다 읽으면 유형별 판정을 보여 드려요.
            </p>
          )}
          <Panel title="읽기 속도" description="분당 읽은 음절 수 (아이 차례에 소리 내어 읽은 줄 기준)">
            {load.data.readingSpeed.length === 0 ? <Empty>아직 읽기 기록이 없어요.</Empty> : <ReadingSpeedChart points={load.data.readingSpeed} />}
          </Panel>
          <Panel title="질문 유형별 결과" description="다 읽은 책에서 푼 문제 기준">
            {load.data.byStage.length === 0 ? <Empty>아직 푼 문제가 없어요.</Empty> : <StageResults rows={load.data.byStage} collecting={load.data.collecting} />}
          </Panel>
          <Panel title="설명 말하기 기록" description="책을 다 읽고 아이가 말로 설명한 내용이에요">
            {load.data.reflections.length === 0 ? (
              <Empty>아직 설명 말하기 기록이 없어요.</Empty>
            ) : (
              <ul className="flex flex-col gap-[10px]">
                {load.data.reflections.map((reflection) => (
                  <li key={reflection.assignmentId} className="rounded-[14px] border border-[#EEF0F3] px-[18px] py-[14px]">
                    <p className="flex flex-wrap items-baseline gap-x-[10px] gap-y-[2px]">
                      <span className="text-[16px] font-bold">{reflection.title}</span>
                      <span className="text-[13px] text-[#8A909C]">
                        {formatDate(reflection.completedAt)} · {formatDuration(reflection.durationMs)}
                      </span>
                    </p>
                    <p className="mt-[6px] text-[15px] leading-[24px] break-keep text-[#3A404B]">“{reflection.transcript}”</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      )}
    </>
  );
}

/** 리워드 설정: 도장 5개마다 받을 보상 정하기 (GET·PUT·DELETE rewards) */
export function RewardsView({ child }: { child: LinkedStudent }) {
  return (
    <>
      <PageHeader child={child} title="리워드 설정" description="아이가 도장을 모으면 받을 보상을 정해 주세요. 아이의 도장 화면에 보여요." />
      <Panel title="보상 정하기">
        <RewardSettings studentId={child.studentId} />
      </Panel>
    </>
  );
}
