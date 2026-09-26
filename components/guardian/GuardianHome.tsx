"use client";

import Image from "next/image";
import { useState, useSyncExternalStore, type ComponentType, type ReactNode } from "react";
import DesignStage from "@/components/DesignStage";
import { getDashboard, getRewardBoard } from "@/lib/api/parents";
import { toGuardianHomeData, weekStartOf, type GuardianHomeData, type LearningRecord } from "@/lib/guardianHome";
import { ChildPicker, useGuardian } from "./GuardianShell";
import { BookStackIcon, ChatBubbleIcon, CheckIcon, ChevronIcon, GiftIcon, OpenBookIcon, SproutIcon } from "./guardianIcons";
import { ActionButton, cardClassName, SectionHeader, StatusCard } from "./guardianUi";
import { useLoad } from "./useLoad";

/**
 * 콘텐츠 캔버스(시안 1672×941에서 왼쪽 메뉴 240을 뺀 크기). 1024px 이상 창에서는 홈 화면을 통째로 창에 맞춰
 * 한 화면에 다 보이게 한다. 안쪽 배치는 창 너비가 아니라 캔버스 너비 기준(@container)이라 어느 노트북에서도 같다.
 */
const CANVAS = { width: 1432, height: 941 };

const noSubscribe = () => () => {};
/** 오늘 날짜(YYYY-M-D). 페이지는 빌드 때 미리 그려지므로 날짜는 브라우저에서만 읽는다(서버에서는 null). */
const readToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
};

/** 보호자 홈(시안 abcc.png). 보호자 대시보드·보상판 API로 그린다. 주를 넘기면 그 주의 학습 횟수가 바뀐다. */
export default function GuardianHome() {
  const today = useSyncExternalStore(noSubscribe, readToday, () => null);
  return (
    <DesignStage designWidth={CANVAS.width} designHeight={CANVAS.height} fit="contain" fallbackClassName="px-[16px] pt-[20px] pb-[32px]">
      <div className="@container size-full">
        <div className="flex h-full flex-col @[1100px]:px-[48px] @[1100px]:pt-[44px] @[1100px]:pb-[40px]">
          <ChildPicker />
          {today && <HomeContent today={today} />}
        </div>
      </div>
    </DesignStage>
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
      <header className="flex shrink-0 flex-wrap items-end justify-between gap-[16px]">
        <div>
          <p className="text-[15px] font-medium text-[#8A909C]">보호자 대시보드</p>
          <h1 className="mt-[4px] text-[38px] leading-[48px] font-bold tracking-[-0.02em] break-keep max-sm:text-[28px] max-sm:leading-[36px]">
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

      <SummaryCard summary={data.summary} />

      <div className="mt-[20px] grid min-h-0 flex-1 grid-cols-1 gap-[20px] @[1100px]:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <RecentRecords records={data.records} />
        <div className="@container flex min-h-0 flex-col gap-[20px]">
          <RewardCard reward={data.reward} />
          <RecentStory story={data.story} />
        </div>
      </div>
    </>
  );
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

function SummaryCard({ summary }: { summary: GuardianHomeData["summary"] }) {
  const items: { label: string; value: number; unit: string; Icon: IconComponent; tone: string }[] = [
    { label: "이번 주 학습", value: summary.sessions, unit: "회", Icon: OpenBookIcon, tone: "bg-[#FFF1E8] text-[#E8672A]" },
    { label: "읽은 책", value: summary.books, unit: "권", Icon: BookStackIcon, tone: "bg-[#EEF0FD] text-[#4F5BD5]" },
    { label: "완료 활동", value: summary.activities, unit: "개", Icon: CheckIcon, tone: "bg-[#E9F6EF] text-[#1E8A4F]" },
  ];
  return (
    <section aria-label="요약" className={`${cardClassName} mt-[24px] grid shrink-0 grid-cols-1 @[640px]:grid-cols-3`}>
      {items.map(({ label, value, unit, Icon, tone }, index) => (
        <div
          key={label}
          className={`flex items-center gap-[20px] px-[32px] py-[24px] max-sm:px-[20px] max-sm:py-[18px] ${
            index > 0 ? "border-t border-[#EEF0F3] @[640px]:border-t-0 @[640px]:border-l" : ""
          }`}
        >
          <span className={`flex size-[60px] shrink-0 items-center justify-center rounded-[16px] ${tone}`}>
            <Icon className="size-[28px]" />
          </span>
          <span className="flex flex-col">
            <span className="text-[15px] font-medium text-[#6B7280]">{label}</span>
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

function RecentRecords({ records }: { records: LearningRecord[] }) {
  return (
    <section className={`${cardClassName} @container flex min-h-0 flex-col p-[24px] max-sm:p-[16px]`}>
      <SectionHeader title="최근 학습 기록" action="전체 기록 보기" href="/guardian/records" />
      {records.length === 0 ? (
        <p className="mt-[16px] rounded-[14px] bg-[#F7F8FA] px-[20px] py-[28px] text-center text-[15px] text-[#8A909C]">아직 학습 기록이 없어요.</p>
      ) : (
        <ul className="mt-[16px] flex min-h-0 flex-1 flex-col gap-[12px]">
          {records.map((record) => (
            <RecordRow key={record.id} record={record} fill={records.length >= 3} />
          ))}
          {records.length < 3 && <li className="px-[4px] pt-[4px] text-[14px] text-[#A3A8B2]">책을 다 읽을 때마다 여기에 차곡차곡 쌓여요.</li>}
        </ul>
      )}
    </section>
  );
}

function formatMonthDay(date: string) {
  const [, month, day] = date.split("-").map(Number);
  return `${month}월 ${day}일`;
}

/** fill: 세 줄이 다 차면 카드 높이를 나눠 채운다(시안처럼). 적으면 내용 높이만큼만 */
function RecordRow({ record, fill }: { record: LearningRecord; fill: boolean }) {
  const inProgress = record.status === "IN_PROGRESS";
  return (
    <li
      className={`flex flex-wrap items-center gap-[14px] rounded-[16px] border border-[#EEF0F3] px-[16px] py-[12px] @[640px]:flex-nowrap @[640px]:gap-[24px] @[640px]:py-[16px] ${
        fill ? "@[640px]:flex-1" : ""
      }`}
    >
      <div className="flex min-w-0 flex-1 basis-full items-center gap-[16px] @[640px]:basis-auto @[640px]:gap-[20px]">
        <Cover record={record} />
        <div className="flex min-w-0 flex-col items-start">
          {record.date ? (
            <time dateTime={record.date} className="text-[14px] font-medium text-[#8A909C]">
              {formatMonthDay(record.date)}
            </time>
          ) : (
            <span className="text-[14px] font-medium text-[#8A909C]">지금 읽는 책</span>
          )}
          <p className="mt-[2px] max-w-full truncate text-[21px] leading-[30px] font-bold tracking-[-0.01em]">{record.title}</p>
          <StatusChip record={record} />
        </div>
      </div>
      <div className="min-w-0 shrink-0 border-[#EEF0F3] @[640px]:w-[300px] @[640px]:border-l @[640px]:pl-[28px]">
        {record.reflection ? (
          <figure>
            <figcaption className="text-[13px] font-semibold text-[#8A909C]">표지 그림 설명</figcaption>
            <blockquote className="mt-[4px] line-clamp-2 text-[15px] leading-[23px] break-keep text-[#2A2F37]">“{record.reflection}”</blockquote>
          </figure>
        ) : (
          <p className="text-[14px] leading-[22px] break-keep text-[#8A909C]">
            {inProgress ? "책을 다 읽고 표지를 그리면, 그림을 설명한 말이 여기에 보여요." : "아직 기록이 없어요."}
          </p>
        )}
      </div>
    </li>
  );
}

export function StatusChip({ record }: { record: Pick<LearningRecord, "status" | "stageLabel"> }) {
  return record.status === "IN_PROGRESS" ? (
    <span className="mt-[6px] flex items-center gap-[6px] rounded-full bg-[#FFF1E8] px-[10px] py-[3px] text-[13px] font-medium text-[#B4560F]">
      <span aria-hidden className="size-[6px] rounded-full bg-[#E8672A]" />
      {record.stageLabel} 하는 중
    </span>
  ) : (
    <span className="mt-[6px] flex items-center gap-[4px] rounded-full bg-[#F3F4F6] py-[3px] pr-[10px] pl-[7px] text-[13px] font-medium text-[#4B5260]">
      <CheckIcon className="size-[14px] text-[#1E8A4F]" />
      독서 활동 완료
    </span>
  );
}

export function Cover({ record, size = "md" }: { record: Pick<LearningRecord, "coverColor" | "coverUrl">; size?: "md" | "sm" }) {
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-[12px] ${size === "sm" ? "size-[56px]" : "size-[64px] @[640px]:size-[84px]"} ${
        record.coverUrl ? "border border-[#E6E8EC]" : ""
      }`}
      style={{
        background: record.coverUrl ? "#FFFFFF" : `linear-gradient(150deg, ${record.coverColor}, color-mix(in srgb, ${record.coverColor} 72%, #1F2937))`,
      }}
    >
      {record.coverUrl ? (
        <Image src={record.coverUrl} alt="아이가 그린 표지" fill sizes="84px" className="object-contain" unoptimized />
      ) : (
        <OpenBookIcon className={`${size === "sm" ? "size-[26px]" : "size-[32px]"} text-white/90`} />
      )}
    </span>
  );
}

function RewardCard({ reward }: { reward: GuardianHomeData["reward"] }) {
  const left = Math.max(reward.goal - reward.current, 0);
  return (
    <section className={`${cardClassName} shrink-0 p-[24px] max-sm:p-[16px]`}>
      <SectionHeader title="독서 리워드" action="리워드 설정하기" href="/guardian/rewards" />
      <div className="mt-[16px] flex items-center justify-between gap-[16px] rounded-[16px] bg-[#F7F8FA] px-[24px] py-[20px] max-sm:px-[16px]">
        <div className="min-w-0">
          <p className="text-[15px] font-medium text-[#6B7280]">다음 리워드까지</p>
          <p className="mt-[4px] text-[28px] leading-[36px] font-bold tabular-nums">
            {reward.current}
            <span className="text-[20px] font-semibold text-[#A3A8B2]"> / {reward.goal}</span>
          </p>
          <ol className="mt-[12px] flex gap-[8px]" aria-label={`${reward.goal}번 중 ${reward.current}번 완료`}>
            {Array.from({ length: reward.goal }, (_, i) => (
              <li key={i} className={`h-[8px] w-[36px] rounded-full max-sm:w-[24px] ${i < reward.current ? "bg-[#E8672A]" : "bg-[#E3E6EB]"}`} />
            ))}
          </ol>
          <p className="mt-[10px] text-[14px] break-keep text-[#4B5260]">
            {left > 0 ? `리워드까지 ${left}번 남았어요.` : "리워드를 받을 수 있어요!"}
            {reward.nextName ? (
              <span className="mt-[2px] block font-semibold text-[#111418]">🎁 {reward.nextName}</span>
            ) : (
              <span className="mt-[2px] block text-[#8A909C]">아직 정한 보상이 없어요.</span>
            )}
          </p>
        </div>
        <span className="flex size-[88px] shrink-0 items-center justify-center rounded-[24px] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06)] max-sm:size-[64px]">
          <GiftIcon className="size-[40px] text-[#E8672A] max-sm:size-[30px]" />
        </span>
      </div>
    </section>
  );
}

/** 서버 판정 코멘트(최근 다 읽은 책 기준). 판정 전이면 모으는 중 안내 */
function RecentStory({ story }: { story: GuardianHomeData["story"] }) {
  return (
    <section className={`${cardClassName} flex min-h-0 flex-1 flex-col p-[24px] max-sm:p-[16px]`}>
      <SectionHeader title="최근 이야기" action="자세히 보기" href="/guardian/records" />
      {story.kind === "collecting" ? (
        <div className="mt-[16px] flex items-start gap-[12px] rounded-[16px] bg-[#F7F8FA] px-[20px] py-[18px]">
          <span className="flex size-[32px] shrink-0 items-center justify-center rounded-[10px] bg-white text-[#E8672A]">
            <ChatBubbleIcon className="size-[20px]" />
          </span>
          <div>
            <p className="text-[16px] font-bold">{story.message}</p>
            <p className="mt-[6px] text-[14px] leading-[23px] break-keep text-[#4B5260]">책을 세 권 이상 다 읽으면 잘하는 부분과 함께 봐줄 부분을 알려 드려요.</p>
          </div>
        </div>
      ) : (
        <div className="mt-[16px] grid grid-cols-1 items-start gap-[12px] @[560px]:grid-cols-2">
          <StoryCard tone="good" title="잘하고 있어요" text={story.good ?? "아직 전할 이야기가 없어요."} />
          <StoryCard tone="help" title="함께 봐주세요" text={story.help ?? "지금은 특별히 도와줄 부분이 없어요."} />
        </div>
      )}
    </section>
  );
}

export function StoryCard({ tone, title, text }: { tone: "good" | "help"; title: string; text: string }) {
  const good = tone === "good";
  return (
    <div className={`rounded-[16px] px-[20px] py-[18px] ${good ? "bg-[#F0F8F3]" : "bg-[#FFF4EE]"}`}>
      <p className="flex items-center gap-[10px] text-[16px] font-bold break-keep">
        <span className={`flex size-[32px] items-center justify-center rounded-[10px] bg-white ${good ? "text-[#2E9E5B]" : "text-[#E8672A]"}`}>
          {good ? <SproutIcon className="size-[20px]" /> : <ChatBubbleIcon className="size-[20px]" />}
        </span>
        {title}
      </p>
      <p className="mt-[10px] line-clamp-5 text-[14px] leading-[23px] break-keep text-[#3A404B]">{text}</p>
    </div>
  );
}
