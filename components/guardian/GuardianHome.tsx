"use client";

import Link from "next/link";
import { useState, useSyncExternalStore, type ComponentType, type ReactNode } from "react";
import { getDashboard, getRewardBoard } from "@/lib/api/parents";
import type { DashboardResponse } from "@/lib/api/types";
import { localDate, toGuardianHomeData, weekStartOf, type GuardianHomeData, type LearningRecord } from "@/lib/guardianHome";
import { ChildPicker, useGuardian } from "./GuardianShell";
import BookDetailModal from "./BookDetailModal";
import { BookStackIcon, CheckIcon, ChevronIcon, GiftIcon, OpenBookIcon } from "./guardianIcons";
import { ActionButton, cardClassName, Cover, SectionHeader, StatusCard } from "./guardianUi";
import { displayStatus, STATUS } from "./StageResults";
import { useLoad } from "./useLoad";

const noSubscribe = () => () => {};
/** 오늘 날짜(YYYY-M-D). 페이지는 빌드 때 미리 그려지므로 날짜는 브라우저에서만 읽는다(서버에서는 null). */
const readToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
};

/**
 * 보호자 홈(시안 abcc.png). 보호자 대시보드·보상판 API로 그린다. 주를 넘기면 그 주의 학습 횟수가 바뀐다.
 * 다른 보호자 페이지처럼 실제 크기로 그리고, 창에 다 안 들어가면 세로로 스크롤한다(작은 노트북에서도 글자가 줄지 않게).
 */
export default function GuardianHome() {
  const today = useSyncExternalStore(noSubscribe, readToday, () => null);
  return (
    <div className="@container mx-auto w-full max-w-[1120px] px-[16px] pt-[20px] pb-[48px] lg:px-[48px] lg:pt-[44px]">
      <ChildPicker />
      {today && <HomeContent today={today} />}
    </div>
  );
}

function HomeContent({ today }: { today: string }) {
  const { child } = useGuardian();
  /** 0이면 이번 주, -1이면 지난주 */
  const [weekOffset, setWeekOffset] = useState(0);
  const [load, reload] = useLoad(
    () =>
      Promise.all([
        getDashboard(child.studentId),
        // 보상판을 못 받아도 홈은 보여 준다(도장 수로 진행을 셈한다).
        getRewardBoard(child.studentId).catch(() => null),
      ]),
    `home-${child.studentId}`,
  );

  if (load.status === "loading") return <StatusCard>{child.name}의 기록을 불러오는 중…</StatusCard>;
  if (load.status === "error") {
    return <StatusCard action={<ActionButton onClick={reload}>다시 불러오기</ActionButton>}>{load.message}</StatusCard>;
  }

  const [year, month, day] = today.split("-").map(Number);
  const weekStart = weekStartOf(new Date(year, month - 1, day));
  weekStart.setDate(weekStart.getDate() + weekOffset * 7);
  const [dashboard, rewards] = load.data;
  const data = toGuardianHomeData({ childName: child.name, dashboard, rewards, weekStart });

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-[16px]">
        <div>
          <p className="text-[15px] font-medium text-[#8A909C]">보호자 대시보드</p>
          <h1 className="mt-[4px] text-[34px] leading-[44px] font-bold tracking-[-0.02em] break-keep max-sm:text-[26px] max-sm:leading-[34px]">
            {data.childName}의 독서 기록
          </h1>
        </div>
        <div className="flex h-[48px] items-center rounded-full border border-[#E6E8EC] bg-white p-[4px] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <WeekButton label="이전 주" onClick={() => setWeekOffset((n) => n - 1)}>
            <ChevronIcon direction="left" className="size-[18px]" />
          </WeekButton>
          <span className="px-[14px] text-[16px] font-medium text-[#2A2F37] tabular-nums">{formatWeek(weekStart)}</span>
          <WeekButton label="다음 주" onClick={() => setWeekOffset((n) => Math.min(n + 1, 0))} disabled={weekOffset === 0}>
            <ChevronIcon className="size-[18px]" />
          </WeekButton>
        </div>
      </header>

      <SummaryCard summary={data.summary} weekLabel={weekLabel(weekOffset)} />

      {/*
        메인 콘텐츠: 흰 카드 하나를 얇은 선으로 나눈다. 위쪽은 [고른 주의 학습 활동 | 확인할 내용](좁으면 한 줄로), 아래쪽은 고른 주에 읽은 책.
        유형별 결과·퍼센트 같은 상세는 학습 기록에서 본다. 높이는 모두 내용만큼.
      */}
      <div className={`${cardClassName} mt-[20px] overflow-hidden`}>
        <div className="grid grid-cols-1 @[760px]:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <WeekActivity dashboard={dashboard} weekStart={weekStart} today={new Date(year, month - 1, day)} weekLabel={weekLabel(weekOffset)} sessions={data.summary.sessions} />
          <CheckList stages={data.stages} collecting={data.collecting} story={data.story} reward={data.reward} />
        </div>
        {/* 위 [학습 활동 | 확인할 내용]과 책 목록을 다른 구역으로 읽히게, 칸 사이 선(#EEF0F3)보다 두 단계 진한 선으로 가르고 위쪽을 조금 더 띄운다 */}
        <div className="border-t border-[#DCDFE5] pt-[4px]">
          <WeekBooks records={data.records} weekLabel={weekLabel(weekOffset)} />
        </div>
      </div>
    </>
  );
}

/** 고른 주를 부르는 말 (0이면 이번 주, -1이면 지난주) */
function weekLabel(offset: number) {
  if (offset === 0) return "이번 주";
  if (offset === -1) return "지난주";
  return `${-offset}주 전`;
}

function formatWeek(start: Date) {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const format = (date: Date) => `${date.getMonth() + 1}월 ${date.getDate()}일`;
  return `${format(start)} – ${format(end)}`;
}

function WeekButton({ label, onClick, disabled = false, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex size-[40px] cursor-pointer items-center justify-center rounded-full text-[#4B5260] transition hover:bg-[#F3F4F6] disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

type IconComponent = ComponentType<{ className?: string }>;

/** 메인 콘텐츠 한 칸. 선 색은 KPI 영역 구분선과 같다 */
const cellClassName = "min-w-0 border-[#EEF0F3] p-[24px] max-sm:p-[16px]";

/** KPI 칸 테두리: 1열 → 3칸 한 줄(640px~). 선은 칸의 테두리라 카드 가장자리까지 이어진다 */
const KPI_BORDERS = ["", "border-t @[640px]:border-t-0 @[640px]:border-l", "border-t @[640px]:border-t-0 @[640px]:border-l"];

/**
 * 첫 칸만 고른 주의 값이고, 둘째·셋째 칸은 주와 상관없는 누적 값이라 "누적" 표시를 단다.
 * 첫 칸 값은 그 주에 학습한 날 수(중복 없는 날짜)라 "일"로 센다.
 */
function SummaryCard({ summary, weekLabel }: { summary: GuardianHomeData["summary"]; weekLabel: string }) {
  const items: { label: string; value: number; unit: string; Icon: IconComponent; tone: string; total?: boolean }[] = [
    { label: `${weekLabel} 학습`, value: summary.sessions, unit: "일", Icon: OpenBookIcon, tone: "bg-[#FFF1E8] text-[#E8672A]" },
    { label: "다 읽은 책", value: summary.books, unit: "권", Icon: BookStackIcon, tone: "bg-[#EEF0FD] text-[#4F5BD5]", total: true },
    { label: "푼 문제", value: summary.activities, unit: "개", Icon: CheckIcon, tone: "bg-[#E9F6EF] text-[#1E8A4F]", total: true },
  ];
  return (
    <section aria-label="요약" className={`${cardClassName} mt-[24px] grid grid-cols-1 @[640px]:grid-cols-3`}>
      {items.map(({ label, value, unit, Icon, tone, total }, index) => (
        <div
          key={index}
          className={`flex items-center gap-[14px] border-[#EEF0F3] px-[20px] py-[20px] @[900px]:gap-[20px] @[900px]:px-[28px] @[900px]:py-[24px] ${KPI_BORDERS[index]}`}
        >
          <span className={`flex size-[48px] shrink-0 items-center justify-center rounded-[14px] @[900px]:size-[60px] @[900px]:rounded-[16px] ${tone}`}>
            <Icon className="size-[24px] @[900px]:size-[28px]" />
          </span>
          <span className="flex flex-col">
            <span className="flex items-center gap-[6px] text-[15px] font-medium text-[#6B7280]">
              {label}
              {total && <span className="rounded-full bg-[#F3F4F6] px-[7px] py-[1px] text-[12px] font-semibold text-[#8A909C]">누적</span>}
            </span>
            <span className="mt-[2px] text-[32px] leading-[40px] font-bold tracking-[-0.01em]">
              {value}
              <span className="ml-[3px] text-[20px] font-semibold text-[#4B5260]">{unit}</span>
            </span>
          </span>
        </div>
      ))}
    </section>
  );
}

/** 고른 주에 읽은 책. 누르면 표지와 표지 그림 설명을 팝업으로 보여 준다 */
function WeekBooks({ records, weekLabel }: { records: LearningRecord[]; weekLabel: string }) {
  const [opened, setOpened] = useState<LearningRecord | null>(null);
  return (
    <section className={cellClassName}>
      <SectionHeader title={`${weekLabel} 읽은 책`} />
      {records.length === 0 ? (
        <p className="mt-[14px] rounded-[14px] bg-[#F7F8FA] px-[20px] py-[20px] text-center text-[15px] text-[#8A909C]">
          {weekLabel === "이번 주" ? "이번 주에 다 읽은 책이 아직 없어요." : `${weekLabel}에는 다 읽은 책이 없어요.`}
        </p>
      ) : (
        <ul className={`mt-[14px] flex gap-[12px] overflow-x-auto pb-[2px] ${thinScrollbarClassName}`}>
          {records.map((record) => (
            <li key={record.id} className="w-[200px] shrink-0">
              <button
                type="button"
                onClick={() => setOpened(record)}
                className="flex w-full cursor-pointer items-center gap-[12px] rounded-[16px] border border-[#EEF0F3] p-[10px] text-left transition hover:border-[#DCDFE5] hover:bg-[#F7F8FA]"
              >
                <Cover record={record} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate text-[16px] font-bold">{record.title}</span>
                  <span className="block text-[13px] text-[#8A909C]">
                    {record.date ? formatMonthDay(record.date) : record.stageLabel ? `${record.stageLabel} 하는 중` : "읽는 중"}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <BookDetailModal record={opened} onClose={() => setOpened(null)} />
    </section>
  );
}

/**
 * 책 목록 가로 스크롤바만 얇고 옅게(모양만 바꾸고 스크롤 동작은 그대로).
 * Chromium·Safari는 ::-webkit-scrollbar로 그린다. Chromium은 scrollbar-width/color가 있으면 webkit 스타일을 무시하므로
 * 표준 속성은 webkit 스크롤바를 모르는 브라우저(Firefox)에만 준다.
 */
const thinScrollbarClassName =
  "[&::-webkit-scrollbar]:h-[6px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#DCDFE5] [&::-webkit-scrollbar-thumb:hover]:bg-[#A3A8B2] [&::-webkit-scrollbar-track]:bg-transparent supports-[not_selector(::-webkit-scrollbar)]:[scrollbar-color:#DCDFE5_transparent] supports-[not_selector(::-webkit-scrollbar)]:[scrollbar-width:thin]";

function formatMonthDay(date: string) {
  const [, month, day] = date.split("-").map(Number);
  return `${month}월 ${day}일`;
}

/** 요일 이름(Date.getDay() 순서). 칸 순서는 기존 주 시작(weekStartOf)에서 하루씩 더한 날짜를 따른다 */
const WEEKDAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * 고른 주의 학습 활동: 그 주 7일 중 언제 학습했는지만 점으로 보여 준다(성취도 아님).
 * 학습한 날은 KPI "N회"와 같은 원본·같은 변환이다(읽기 기록 날짜 + 책을 다 읽은 날의 localDate). 날짜 키도 기존 localDate로 만든다.
 * 오늘 이후는 아직 오지 않은 날이라 흐리게, 오늘은 글자로 구분하고 기록이 없어도 실패처럼 보이지 않게 한다.
 */
function WeekActivity({
  dashboard,
  weekStart,
  today,
  weekLabel,
  sessions,
}: {
  dashboard: DashboardResponse;
  weekStart: Date;
  today: Date;
  weekLabel: string;
  sessions: number;
}) {
  const studied = new Set([...dashboard.readingSpeed.map(({ date }) => date), ...dashboard.reflections.map(({ completedAt }) => localDate(completedAt))]);
  const todayKey = localDate(today.toISOString());
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    const key = localDate(date.toISOString());
    const state = studied.has(key) ? "studied" : key === todayKey ? "today" : key > todayKey ? "future" : "missed";
    return { key, date, state, isToday: key === todayKey };
  });

  return (
    <section className={`${cellClassName} @[760px]:pt-[32px] @[760px]:pb-[48px]`}>
      <SectionHeader title={`${weekLabel} 학습 활동`} />
      {/* 학습한 날 수와 요일 점을 한 묶음으로 읽히게 바로 붙인다. 값은 KPI 첫 칸과 같다(중복 없는 학습 날짜 수) */}
      <p className="mt-[28px] flex flex-col">
        <span className="text-[30px] leading-[38px] font-bold tracking-[-0.01em] text-[#111418] tabular-nums">{sessions}일</span>
        <span className="mt-[4px] text-[16px] font-medium text-[#4B5260]">학습했어요</span>
      </p>
      <ol className="mt-[40px] grid grid-cols-7 gap-[4px]" aria-label={`${weekLabel} 날짜별 학습`}>
        {days.map(({ key, date, state, isToday }) => (
          <li
            key={key}
            className="flex flex-col items-center gap-[10px]"
            aria-label={`${date.getMonth() + 1}월 ${date.getDate()}일 ${WEEKDAY_NAMES[date.getDay()]}요일${isToday ? "(오늘)" : ""}: ${
              state === "studied" ? "학습함" : state === "future" ? "아직 오지 않은 날" : state === "today" ? "아직 기록 없음" : "학습 기록 없음"
            }`}
          >
            <span className={`text-[14px] ${isToday ? "font-bold text-[#111418]" : state === "future" ? "text-[#A3A8B2]" : "font-medium text-[#6B7280]"}`}>
              {isToday ? "오늘" : WEEKDAY_NAMES[date.getDay()]}
            </span>
            <span aria-hidden className="flex size-[28px] items-center justify-center">
              {state === "studied" ? (
                <span className={`size-[14px] rounded-full bg-[#E8672A] ${isToday ? "ring-[4px] ring-[#FFF1E8]" : ""}`} />
              ) : state === "future" ? (
                <span className="size-[4px] rounded-full bg-[#E3E6EB]" />
              ) : state === "today" ? (
                <span className="size-[14px] rounded-full border-[2px] border-[#8A909C]" />
              ) : (
                <span className="size-[14px] rounded-full border-[2px] border-[#E3E6EB]" />
              )}
            </span>
            <span className={`text-[13px] tabular-nums ${state === "future" ? "text-[#C4C8CF]" : "text-[#8A909C]"}`}>{date.getDate()}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** 확인할 내용의 한 줄: 왼쪽에 문구와 링크, aside가 있으면 오른쪽에 둔다 */
function CheckItem({
  title,
  tone,
  children,
  href,
  action,
  aside,
}: {
  title: string;
  tone: string;
  children?: ReactNode;
  href?: string;
  action?: string;
  aside?: ReactNode;
}) {
  return (
    <li className="flex items-center justify-between gap-[16px] py-[28px] first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className={`text-[16px] leading-[24px] font-semibold break-keep ${tone}`}>{title}</p>
        {children}
        {href && action && (
          <Link href={href} className="mt-[16px] flex w-fit items-center gap-[2px] text-[14px] font-semibold text-[#2A2F37] transition hover:text-[#111418]">
            {action}
            <ChevronIcon className="size-[16px]" />
          </Link>
        )}
      </div>
      {aside}
    </li>
  );
}

/** 상태 제목 아래 보조 문구: 제목보다 옅고 링크보다 한 단계 옅은 본문 보조색 */
const noteClassName = "mt-[6px] text-[14px] leading-[22px] break-keep text-[#4B5260]";
const RECORDS_NOTE = "학습 기록에서 자세히 확인해 주세요.";

/**
 * 확인할 내용: 보호자가 지금 볼 일이 있는지만 알린다(유형 이름·이유·퍼센트는 학습 기록에서).
 * 학습 상태는 기존 판정(displayStatus)을 이 순서로 한 줄로 줄인다: 모으는 중 → 도움이 필요한 유형이 하나라도 있음 → 판정된 유형이 모두 잘함 → 그 밖(STATUS.NORMAL).
 * 리워드 줄은 늘 두고, 리워드를 정했는지는 기존처럼 reward.nextName으로 본다. 오른쪽에는 다음 리워드까지 모은 도장(기존 KPI 표시)을 둔다.
 */
function CheckList({
  stages,
  collecting,
  story,
  reward,
}: {
  stages: GuardianHomeData["stages"];
  collecting: boolean;
  story: GuardianHomeData["story"];
  reward: GuardianHomeData["reward"];
}) {
  const judged = stages.map((row) => displayStatus(row, collecting)).filter((status) => status !== "COLLECTING");
  const toRecords = { href: "/guardian/records", action: "학습 기록 보기" };

  let status: ReactNode;
  if (story.kind === "collecting" || judged.length === 0) {
    status = (
      <CheckItem title={story.kind === "collecting" ? story.message : "데이터를 모으고 있어요"} tone="text-[#4B5260]">
        <p className={noteClassName}>책을 세 권 이상 다 읽으면 잘하는 부분과 함께 봐줄 부분을 알려 드려요.</p>
      </CheckItem>
    );
  } else if (judged.includes("NEEDS_HELP")) {
    status = (
      <CheckItem title="도움이 필요한 항목이 있어요." tone="text-[#A8402B]" {...toRecords}>
        <p className={noteClassName}>{RECORDS_NOTE}</p>
      </CheckItem>
    );
  } else if (judged.every((value) => value === "COMFORTABLE")) {
    status = (
      <CheckItem title="잘하고 있어요!" tone="text-[#2E6B3A]" {...toRecords}>
        <p className={noteClassName}>{RECORDS_NOTE}</p>
      </CheckItem>
    );
  } else {
    status = (
      <CheckItem title={STATUS.NORMAL.label} tone="text-[#4B5260]" {...toRecords}>
        <p className={noteClassName}>{RECORDS_NOTE}</p>
      </CheckItem>
    );
  }

  const progress = <RewardProgress reward={reward} />;
  return (
    <section className={`${cellClassName} border-t @[760px]:border-t-0 @[760px]:border-l @[760px]:pt-[32px] @[760px]:pb-[48px]`}>
      <SectionHeader title="확인할 내용" />
      <ul className="mt-[28px] divide-y divide-[#EEF0F3]">
        {status}
        {reward.nextName ? (
          <CheckItem title={reward.nextName} tone="text-[#111418]" href="/guardian/rewards" action="리워드 설정하기" aside={progress}>
            <p className={noteClassName}>다음 리워드</p>
          </CheckItem>
        ) : (
          <CheckItem title="다음 리워드가 아직 정해지지 않았어요." tone="text-[#111418]" href="/guardian/rewards" action="리워드 정하기" aside={progress} />
        )}
      </ul>
    </section>
  );
}

/** 다음 리워드까지 모은 도장(기존 KPI에 있던 선물 아이콘 · current / goal · 진행 점). 값은 toGuardianHomeData 그대로 */
function RewardProgress({ reward }: { reward: GuardianHomeData["reward"] }) {
  return (
    <div className="flex shrink-0 items-center gap-[12px]">
      <span className="flex size-[44px] shrink-0 items-center justify-center rounded-[14px] bg-[#FFF1E8] text-[#E8672A]">
        <GiftIcon className="size-[22px]" />
      </span>
      <div className="flex flex-col">
        <span className="text-[22px] leading-[28px] font-bold tabular-nums">
          {reward.current}
          <span className="ml-[3px] text-[15px] font-semibold text-[#4B5260]">/ {reward.goal}개</span>
        </span>
        <ol className="mt-[4px] flex gap-[4px]" aria-label={`도장 ${reward.goal}개 중 ${reward.current}개 모음`}>
          {Array.from({ length: reward.goal }, (_, i) => (
            <li key={i} className={`h-[6px] w-[14px] rounded-full ${i < reward.current ? "bg-[#E8672A]" : "bg-[#E3E6EB]"}`} />
          ))}
        </ol>
      </div>
    </div>
  );
}
