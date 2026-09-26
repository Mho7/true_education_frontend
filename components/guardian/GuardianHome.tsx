"use client";

import Image from "next/image";
import { useState, useSyncExternalStore, type ComponentType, type ReactNode } from "react";
import {
  getSampleGuardianHome,
  OUTCOME_LABELS,
  SKILL_LABELS,
  weekStartOf,
  type GuardianHomeData,
  type LearningRecord,
  type SkillKind,
  type SolveOutcome,
} from "@/lib/guardianHome";
import GuardianSideNav from "./GuardianSideNav";
import {
  BookStackIcon,
  ChatBubbleIcon,
  CheckIcon,
  ChevronIcon,
  ClockIcon,
  GiftIcon,
  HeartIcon,
  OpenBookIcon,
  RecordIcon,
  RingIcon,
  SproutIcon,
} from "./guardianIcons";

// TODO: 로그인한 보호자와 연결된 아이 이름은 feat/api-ready-ui의 GET /parents/me/students로 받는다.
const SAMPLE_CHILD_NAME = "다은이";

const noSubscribe = () => () => {};
/** 오늘 날짜(YYYY-M-D). 페이지는 빌드 때 미리 그려지므로 날짜는 브라우저에서만 읽는다(서버에서는 null). */
const readToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
};

/** 보호자 홈(시안 abcc.png). 주를 넘기면 그 주의 요약과 이야기가 바뀐다. */
export default function GuardianHome() {
  const today = useSyncExternalStore(noSubscribe, readToday, () => null);
  /** 0이면 이번 주, -1이면 지난주 */
  const [weekOffset, setWeekOffset] = useState(0);

  return (
    <div className="flex min-h-screen w-full bg-[#FDFCFA] font-kr text-[#2F2823] max-lg:flex-col">
      <GuardianSideNav />
      <main className="min-w-0 flex-1 px-[44px] pt-[56px] pb-[48px] max-lg:px-[16px] max-lg:pt-[24px]">
        {today && <WeekView today={today} weekOffset={weekOffset} onMove={(delta) => setWeekOffset((n) => Math.min(n + delta, 0))} />}
      </main>
    </div>
  );
}

function WeekView({ today, weekOffset, onMove }: { today: string; weekOffset: number; onMove: (delta: number) => void }) {
  const [year, month, day] = today.split("-").map(Number);
  const now = new Date(year, month - 1, day);
  const weekStart = weekStartOf(now);
  weekStart.setDate(weekStart.getDate() + weekOffset * 7);
  const data = getSampleGuardianHome(SAMPLE_CHILD_NAME, weekStart, now);

  return (
        <div className="mx-auto max-w-[1380px]">
          <header>
            <h1 className="text-[44px] leading-[56px] font-bold tracking-[-0.01em] break-keep max-sm:text-[32px] max-sm:leading-[42px]">
              {data.childName}의 독서 기록
            </h1>
            <div className="mt-[10px] flex items-center gap-[18px] text-[19px] text-[#5E554E]">
              <span className="tabular-nums">{formatWeek(weekStart)}</span>
              <span className="flex gap-[6px]">
                <WeekButton label="이전 주" onClick={() => onMove(-1)}>
                  <ChevronIcon direction="left" className="size-[20px]" />
                </WeekButton>
                <WeekButton label="다음 주" onClick={() => onMove(1)} disabled={weekOffset === 0}>
                  <ChevronIcon className="size-[20px]" />
                </WeekButton>
              </span>
            </div>
          </header>

          <SummaryCard summary={data.summary} />

          <div className="mt-[22px] grid grid-cols-1 gap-[18px] xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <RecentRecords records={data.records} />
            <div className="@container flex flex-col gap-[22px]">
              <RewardCard reward={data.reward} />
              <WeeklyStory story={data.story} />
            </div>
          </div>
        </div>
  );
}

function formatWeek(start: Date) {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const format = (date: Date) => `${date.getMonth() + 1}월 ${date.getDate()}일`;
  return `${format(start)} - ${format(end)}`;
}

function WeekButton({ label, onClick, disabled = false, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex size-[36px] cursor-pointer items-center justify-center rounded-full text-[#6B5A4C] transition hover:bg-[#F1EBE3] disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

const cardClassName = "rounded-[22px] border border-[#EEE9E2] bg-white";

function SummaryCard({ summary }: { summary: GuardianHomeData["summary"] }) {
  const items: { label: string; value: string; Icon: ComponentType<{ className?: string }>; circle: string; icon: string }[] = [
    { label: "이번 주 학습", value: `${summary.sessions}회`, Icon: OpenBookIcon, circle: "bg-[#F8EEE4]", icon: "text-[#B98A62]" },
    { label: "읽은 책", value: `${summary.books}권`, Icon: BookStackIcon, circle: "bg-[#F4EEE8]", icon: "text-[#B58B66]" },
    { label: "완료 활동", value: `${summary.activities}개`, Icon: CheckIcon, circle: "bg-[#EEF2EB]", icon: "text-[#4E7A56]" },
  ];
  return (
    <section aria-label="이번 주 요약" className={`${cardClassName} mt-[26px] grid grid-cols-1 sm:grid-cols-3`}>
      {items.map(({ label, value, Icon, circle, icon }, index) => (
        <div
          key={label}
          className={`flex items-center gap-[30px] px-[40px] py-[26px] max-xl:gap-[18px] max-xl:px-[22px] ${
            index > 0 ? "border-[#EEE9E2] max-sm:border-t sm:border-l" : ""
          }`}
        >
          <span className={`flex size-[108px] shrink-0 items-center justify-center rounded-full max-xl:size-[76px] ${circle}`}>
            <Icon className={`size-[46px] max-xl:size-[34px] ${icon}`} />
          </span>
          <span className="flex flex-col gap-[6px]">
            <span className="text-[17px] text-[#5E554E]">{label}</span>
            <span className="text-[38px] leading-[44px] font-bold max-xl:text-[30px]">{value}</span>
          </span>
        </div>
      ))}
    </section>
  );
}

function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <div className="flex items-center justify-between gap-[12px]">
      <h2 className="text-[25px] font-bold">{title}</h2>
      {action && (
        // TODO: 학습 기록·리워드 설정 화면이 생기면 링크로 바꾼다.
        <span className="flex items-center gap-[4px] text-[17px] text-[#3F3731]">
          {action}
          <ChevronIcon className="size-[18px]" />
        </span>
      )}
    </div>
  );
}

function RecentRecords({ records }: { records: LearningRecord[] }) {
  return (
    <section className={`${cardClassName} @container px-[22px] pt-[22px] pb-[22px] max-sm:px-[16px]`}>
      <SectionHeader title="최근 학습 기록" action="전체 기록 보기" />
      {records.length === 0 ? (
        <p className="mt-[18px] rounded-[16px] bg-[#FAF8F5] px-[20px] py-[28px] text-center text-[16px] text-[#8A8078]">아직 학습 기록이 없어요.</p>
      ) : (
        <ul className="mt-[16px] flex flex-col gap-[12px]">
          {records.map((record) => (
            <RecordRow key={record.id} record={record} />
          ))}
        </ul>
      )}
    </section>
  );
}

const SKILL_ICONS: Record<SkillKind, { Icon: ComponentType<{ className?: string }>; color: string }> = {
  CAUSE: { Icon: RingIcon, color: "text-[#E0A33C]" },
  EMOTION: { Icon: HeartIcon, color: "text-[#E0605A]" },
  CHARACTER_EVENT: { Icon: ClockIcon, color: "text-[#4F86C6]" },
  SUMMARY_TITLE: { Icon: RecordIcon, color: "text-[#6B5A4C]" },
};

const OUTCOME_STYLES: Record<SolveOutcome, string> = {
  SELF: "bg-[#EAF3E6] text-[#3D7446]",
  HINT: "bg-[#E7F0FB] text-[#3B6CB0]",
  REREAD: "bg-[#FBF0E3] text-[#9A6337]",
};

function RecordRow({ record }: { record: LearningRecord }) {
  const [, month, day] = record.date.split("-").map(Number);
  return (
    <li className="flex flex-wrap items-center gap-[14px] rounded-[16px] border border-[#EEE9E2] px-[18px] py-[12px] @[640px]:flex-nowrap @[640px]:gap-[24px]">
      <div className="flex min-w-0 flex-1 basis-full items-center gap-[16px] @[640px]:basis-auto @[640px]:gap-[24px]">
        <Cover record={record} />
        <div className="flex min-w-0 flex-col items-start">
          <time dateTime={record.date} className="text-[16px] text-[#6E655E]">
            {month}월 {day}일
          </time>
          <p className="mt-[2px] truncate text-[24px] leading-[32px] font-bold">{record.title}</p>
          {record.completed && (
            <span className="mt-[8px] rounded-[10px] bg-[#EAF3E6] px-[14px] py-[5px] text-[15px] font-medium text-[#3D7446]">독서 활동 완료</span>
          )}
        </div>
      </div>
      <ul className="flex shrink-0 flex-col gap-[10px] border-[#EEE9E2] @[640px]:w-[300px] @[640px]:border-l @[640px]:pl-[32px]" aria-label="활동 결과">
        {record.results.map(({ skill, outcome }) => {
          const { Icon, color } = SKILL_ICONS[skill];
          return (
            <li key={skill} className="flex items-center gap-[14px]">
              <Icon className={`size-[24px] shrink-0 ${color}`} />
              <span className="w-[92px] text-[17px] text-[#3F3731]">{SKILL_LABELS[skill]}</span>
              <span className={`rounded-[10px] px-[14px] py-[5px] text-[15px] font-medium whitespace-nowrap ${OUTCOME_STYLES[outcome]}`}>
                {OUTCOME_LABELS[outcome]}
              </span>
            </li>
          );
        })}
      </ul>
      {/* TODO: 책별 상세 기록 화면이 생기면 이 줄을 링크로 바꾼다. */}
      <ChevronIcon className="hidden size-[22px] shrink-0 text-[#6E655E] @[640px]:block" />
    </li>
  );
}

function Cover({ record }: { record: LearningRecord }) {
  return (
    <span
      className="relative flex size-[72px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] @[640px]:size-[104px]"
      style={{ background: `linear-gradient(160deg, ${record.coverColor}, color-mix(in srgb, ${record.coverColor} 70%, #3A2E26))` }}
    >
      {record.coverUrl ? (
        <Image src={record.coverUrl} alt="" fill sizes="104px" className="object-cover" unoptimized />
      ) : (
        <OpenBookIcon className="size-[40px] text-white/85" />
      )}
    </span>
  );
}

function RewardCard({ reward }: { reward: GuardianHomeData["reward"] }) {
  const left = Math.max(reward.goal - reward.current, 0);
  return (
    <section className={`${cardClassName} px-[22px] pt-[22px] pb-[22px]`}>
      <SectionHeader title="독서 리워드" action="리워드 설정하기" />
      <div className="mt-[16px] flex items-center justify-between gap-[16px] rounded-[16px] border border-[#EEE9E2] px-[30px] py-[24px] max-sm:px-[18px]">
        <div>
          <p className="text-[18px] text-[#3F3731]">다음 리워드까지</p>
          <ol className="mt-[14px] flex gap-[12px]" aria-label={`${reward.goal}번 중 ${reward.current}번 완료`}>
            {Array.from({ length: reward.goal }, (_, i) => (
              <li key={i} className={`size-[28px] rounded-full ${i < reward.current ? "bg-[#B8895C]" : "bg-[#E9E4DD]"}`} />
            ))}
          </ol>
          <p className="mt-[12px] text-[26px] font-bold tabular-nums">
            {reward.current} / {reward.goal}
          </p>
          <p className="mt-[2px] text-[16px] break-keep text-[#5E554E]">
            {left > 0 ? `다음 리워드까지 ${left}번 남았어요.` : "리워드를 받을 수 있어요!"}
          </p>
        </div>
        <span className="relative mr-[8px] flex size-[118px] shrink-0 items-center justify-center rounded-full bg-[#FAF1E6] max-sm:size-[84px]">
          <GiftIcon className="size-[54px] text-[#B8895C] max-sm:size-[40px]" />
          <span aria-hidden className="absolute -top-[2px] right-[2px] h-[12px] w-[3px] rotate-[35deg] rounded-full bg-[#D9A06A]" />
          <span aria-hidden className="absolute top-[18px] -right-[6px] h-[3px] w-[11px] -rotate-[15deg] rounded-full bg-[#D9A06A]" />
        </span>
      </div>
    </section>
  );
}

function WeeklyStory({ story }: { story: GuardianHomeData["story"] }) {
  return (
    <section>
      <h2 className="px-[22px] text-[25px] font-bold max-sm:px-0">이번 주 이야기</h2>
      {story ? (
        <div className="mt-[14px] grid grid-cols-1 gap-[16px] @[560px]:grid-cols-2">
          <StoryCard tone="good" title="잘하고 있어요" text={story.good} />
          <StoryCard tone="help" title="함께 봐주세요" text={story.help} />
        </div>
      ) : (
        <p className="mt-[14px] rounded-[16px] bg-[#FAF8F5] px-[20px] py-[28px] text-center text-[16px] text-[#8A8078]">이 주에는 전할 이야기가 없어요.</p>
      )}
    </section>
  );
}

function StoryCard({ tone, title, text }: { tone: "good" | "help"; title: string; text: string }) {
  const good = tone === "good";
  return (
    <div className={`rounded-[16px] px-[22px] py-[22px] ${good ? "bg-[#F3F6EF]" : "bg-[#FCF0EC]"}`}>
      <p className="flex items-center gap-[12px] text-[19px] font-bold break-keep">
        {good ? <SproutIcon className="size-[30px] text-[#6FA046]" /> : <ChatBubbleIcon className="size-[30px] text-[#EE7B50]" />}
        {title}
      </p>
      <p className="mt-[12px] text-[16px] leading-[28px] break-keep text-[#4A4038]">{text}</p>
    </div>
  );
}
