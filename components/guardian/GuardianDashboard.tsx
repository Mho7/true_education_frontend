"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { logout } from "@/lib/api/auth";
import { errorMessage, isApiError } from "@/lib/api/client";
import { getDashboard, getLinkedStudents } from "@/lib/api/parents";
import type { DashboardResponse, DashboardStage, LearningStage, LinkedStudent } from "@/lib/api/types";
import { signOut } from "@/lib/session";
import ReadingSpeedChart from "./ReadingSpeedChart";
import RewardSettings from "./RewardSettings";
import StageResults from "./StageResults";

type Load<T> = { status: "loading" } | { status: "error"; message: string; needsLogin: boolean } | { status: "loaded"; data: T };

/** 요청 하나를 불러 로딩·오류·완료 상태로 돌려준다. reload로 다시 부른다. */
function useLoad<T>(load: () => Promise<T>, key: string): [Load<T>, () => void] {
  const [state, setState] = useState<Load<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [prevKey, setPrevKey] = useState(key);
  if (prevKey !== key) {
    setPrevKey(key);
    setState({ status: "loading" });
  }
  useEffect(() => {
    let cancelled = false;
    load()
      .then((data) => !cancelled && setState({ status: "loaded", data }))
      .catch(
        (error: unknown) =>
          !cancelled &&
          setState({ status: "error", message: errorMessage(error), needsLogin: isApiError(error, 401) || isApiError(error, 403) }),
      );
    return () => {
      cancelled = true;
    };
    // load는 key가 같으면 같은 요청이다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);
  const reload = () => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  };
  return [state, reload];
}

export default function GuardianDashboard() {
  const router = useRouter();
  const [students, reloadStudents] = useLoad(getLinkedStudents, "students");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const list = students.status === "loaded" ? students.data : [];
  const current = list.find((s) => s.studentId === selectedId) ?? list[0];

  function handleLogout() {
    logout().catch(() => {});
    signOut();
    router.push("/");
  }

  return (
    <div className="mx-auto w-full max-w-[1080px] px-[16px] py-[28px] sm:px-[32px]">
      <header className="flex flex-wrap items-center justify-between gap-[12px]">
        <div>
          <p className="text-[14px] font-medium text-[#857B72]">보호자 대시보드</p>
          <h1 className="mt-[2px] font-display text-[30px] leading-[38px] text-[#8B6650]">
            {current ? `${current.name}의 독서 기록` : "우리 아이 독서 기록"}
          </h1>
        </div>
        <button type="button" onClick={handleLogout} className="h-[36px] cursor-pointer rounded-full px-[14px] text-[14px] font-medium text-[#857B72] transition hover:bg-[#F4ECDF]">
          로그아웃
        </button>
      </header>

      {students.status === "loading" && <StatusCard>연결된 아이를 불러오는 중…</StatusCard>}
      {students.status === "error" && (
        <StatusCard
          action={
            students.needsLogin ? (
              <Link href="/" className={primaryActionClassName}>
                보호자로 로그인하기
              </Link>
            ) : (
              <button type="button" onClick={reloadStudents} className={primaryActionClassName}>
                다시 불러오기
              </button>
            )
          }
        >
          {students.needsLogin ? "보호자 계정으로 로그인해야 볼 수 있어요." : students.message}
        </StatusCard>
      )}
      {students.status === "loaded" && list.length === 0 && (
        <StatusCard>연결된 아이가 없어요. 아이가 가입하고 받은 학생 코드로 연결할 수 있어요.</StatusCard>
      )}

      {current && (
        <>
          {/* 아이가 여럿이면 고르는 탭, 한 명이면 바로 보여 준다 */}
          {list.length > 1 && (
            <div role="tablist" aria-label="아이 선택" className="mt-[20px] flex flex-wrap gap-[8px]">
              {list.map((student) => {
                const selected = student.studentId === current.studentId;
                return (
                  <button
                    key={student.studentId}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setSelectedId(student.studentId)}
                    className={`h-[40px] cursor-pointer rounded-full px-[18px] text-[15px] font-bold transition ${
                      selected ? "bg-[#8B6650] text-white" : "border border-[#E4DACD] bg-white text-[#5C5149] hover:bg-[#FBF4EC]"
                    }`}
                  >
                    {student.name}
                  </button>
                );
              })}
            </div>
          )}
          <StudentDashboard key={current.studentId} student={current} />
        </>
      )}
    </div>
  );
}

function StudentDashboard({ student }: { student: LinkedStudent }) {
  const [dashboard, reload] = useLoad(() => getDashboard(student.studentId), `dashboard-${student.studentId}`);

  if (dashboard.status === "loading") return <StatusCard>{student.name}의 기록을 불러오는 중…</StatusCard>;
  if (dashboard.status === "error") {
    return (
      <StatusCard
        action={
          <button type="button" onClick={reload} className={primaryActionClassName}>
            다시 불러오기
          </button>
        }
      >
        {dashboard.message}
      </StatusCard>
    );
  }
  return <DashboardView data={dashboard.data} />;
}

const STAGE_NAMES: Record<LearningStage, string> = {
  READING: "번갈아 읽기",
  QUESTION: "이해 질문",
  ORDERING: "순서 맞추기",
  TITLE: "제목 짓기",
  DRAWING: "그림 그리기",
  REFLECTION: "설명 말하기",
  COMPLETED: "다 읽음",
};

function DashboardView({ data }: { data: DashboardResponse }) {
  const { summary, collecting } = data;
  const labelOf = (stage: DashboardStage) => data.byStage.find((row) => row.stage === stage)?.label ?? stage;

  return (
    <div className="mt-[20px] flex flex-col gap-[16px]">
      {collecting && (
        <div role="status" className="flex items-start gap-[12px] rounded-[18px] bg-[#FFF4D9] px-[20px] py-[16px]">
          <span aria-hidden className="mt-[1px] flex size-[26px] shrink-0 items-center justify-center rounded-full bg-[#D9621C] text-[15px] font-bold text-white">
            i
          </span>
          <div>
            <p className="text-[17px] font-bold text-[#8A4A1E]">{data.collectingMessage ?? "데이터를 모으고 있어요"}</p>
            <p className="mt-[2px] text-[14px] text-[#8A5A2E]">책을 조금 더 읽으면 잘하는 부분과 도움이 필요한 부분을 알려 드려요.</p>
          </div>
        </div>
      )}

      <section aria-label="요약" className="grid grid-cols-1 gap-[12px] sm:grid-cols-3">
        <StatTile label="다 읽은 책" value={`${summary.completedBooks}권`} />
        <StatTile label="모은 도장" value={`${summary.stampTotal}개`} />
        <StatTile
          label="지금 읽는 책"
          value={summary.inProgress ? summary.inProgress.title : "없음"}
          detail={summary.inProgress ? `${STAGE_NAMES[summary.inProgress.stage] ?? summary.inProgress.stage} 하는 중` : "새 책을 기다리고 있어요"}
          small
        />
      </section>

      <Card title="읽기 속도" description="분당 읽은 음절 수 (아이 차례에 소리 내어 읽은 줄 기준)">
        {data.readingSpeed.length === 0 ? <Empty>아직 읽기 기록이 없어요.</Empty> : <ReadingSpeedChart points={data.readingSpeed} />}
      </Card>

      <Card title="질문 유형별 결과" description="다 읽은 책에서 푼 문제 기준">
        {data.byStage.length === 0 ? <Empty>아직 푼 문제가 없어요.</Empty> : <StageResults rows={data.byStage} collecting={collecting} />}
      </Card>

      <div className="grid grid-cols-1 gap-[16px] md:grid-cols-2">
        <Card title="도움이 필요한 부분">
          {collecting ? (
            <Empty>데이터를 모으는 중이에요.</Empty>
          ) : data.needsHelp.length === 0 ? (
            <Empty>지금은 없어요.</Empty>
          ) : (
            <Chips items={data.needsHelp.map(labelOf)} tone="help" />
          )}
        </Card>
        <Card title="잘하는 부분">
          {collecting ? (
            <Empty>데이터를 모으는 중이에요.</Empty>
          ) : data.comfortable.length === 0 ? (
            <Empty>아직 없어요.</Empty>
          ) : (
            <Chips items={data.comfortable.map(labelOf)} tone="good" />
          )}
        </Card>
      </div>

      <Card title="여울이의 한마디">
        {data.comments.length === 0 ? (
          <Empty>{collecting ? "데이터를 모으는 중이에요." : "아직 전할 이야기가 없어요."}</Empty>
        ) : (
          <ul className="flex flex-col gap-[10px]">
            {data.comments.map((comment) => (
              <li key={`${comment.stage}-${comment.status}`} className="rounded-[12px] bg-[#FBF8F2] px-[16px] py-[12px]">
                <p className="text-[13px] font-bold text-[#857B72]">{labelOf(comment.stage)}</p>
                <p className="mt-[2px] text-[15px] leading-[23px] break-keep text-[#2B2420]">{comment.text}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="설명 말하기 기록" description="책을 다 읽고 아이가 말로 설명한 내용이에요">
        {data.reflections.length === 0 ? (
          <Empty>아직 설명 말하기 기록이 없어요.</Empty>
        ) : (
          <ul className="flex flex-col gap-[10px]">
            {data.reflections.map((reflection) => (
              <li key={reflection.assignmentId} className="rounded-[12px] border border-[#F2ECE3] px-[16px] py-[12px]">
                <p className="flex flex-wrap items-baseline gap-x-[10px] gap-y-[2px]">
                  <span className="text-[15px] font-bold text-[#2B2420]">『{reflection.title}』</span>
                  <span className="text-[12px] text-[#857B72]">
                    {formatDate(reflection.completedAt)} · {formatDuration(reflection.durationMs)}
                  </span>
                </p>
                <p className="mt-[6px] text-[15px] leading-[23px] break-keep text-[#5C5149]">“{reflection.transcript}”</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="보상 정하기" description="아이가 도장을 모으면 받을 보상이에요">
        <RewardSettings studentId={data.student.studentId} />
      </Card>
    </div>
  );
}

const formatDate = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
};

const formatDuration = (ms: number) => {
  const seconds = Math.round(ms / 1000);
  return seconds >= 60 ? `${Math.floor(seconds / 60)}분 ${seconds % 60}초` : `${seconds}초`;
};

const primaryActionClassName =
  "flex h-[44px] cursor-pointer items-center justify-center rounded-full bg-[#D9621C] px-[22px] text-[15px] font-bold text-white transition hover:brightness-105";

function StatusCard({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div role="status" className="mt-[20px] flex flex-col items-center gap-[16px] rounded-[20px] border border-[#EFE6DA] bg-white px-[20px] py-[48px] text-center">
      <p className="text-[16px] break-keep text-[#5C5149]">{children}</p>
      {action}
    </div>
  );
}

function Card({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-[20px] border border-[#EFE6DA] bg-white px-[20px] py-[18px] sm:px-[24px]">
      <h2 className="text-[18px] font-bold text-[#2B2420]">{title}</h2>
      {description && <p className="mt-[2px] text-[13px] text-[#857B72]">{description}</p>}
      <div className="mt-[14px]">{children}</div>
    </section>
  );
}

function StatTile({ label, value, detail, small = false }: { label: string; value: string; detail?: string; small?: boolean }) {
  return (
    <div className="rounded-[20px] border border-[#EFE6DA] bg-white px-[20px] py-[16px]">
      <p className="text-[13px] font-medium text-[#857B72]">{label}</p>
      <p className={`mt-[4px] font-bold break-keep text-[#2B2420] ${small ? "text-[20px] leading-[28px]" : "text-[30px] leading-[36px]"}`}>{value}</p>
      {detail && <p className="mt-[2px] text-[13px] text-[#857B72]">{detail}</p>}
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-[12px] bg-[#FBF8F2] px-[16px] py-[14px] text-[14px] text-[#857B72]">{children}</p>;
}

function Chips({ items, tone }: { items: string[]; tone: "help" | "good" }) {
  return (
    <ul className="flex flex-wrap gap-[8px]">
      {items.map((item) => (
        <li
          key={item}
          className={`flex items-center gap-[6px] rounded-full px-[14px] py-[6px] text-[14px] font-bold ${
            tone === "help" ? "bg-[#FDECE8] text-[#A8402B]" : "bg-[#E9F4E3] text-[#2E6B3A]"
          }`}
        >
          <span aria-hidden>{tone === "help" ? "!" : "✓"}</span>
          {item}
        </li>
      ))}
    </ul>
  );
}
