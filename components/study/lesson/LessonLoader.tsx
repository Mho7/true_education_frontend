"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { errorMessage, isApiError } from "@/lib/api/client";
import { getReading, getToday } from "@/lib/api/learning";
import type { ReadingResponse, TodayResponse } from "@/lib/api/types";
import { LESSON_COUNT } from "@/lib/studyLessons";
import LessonFrame from "./LessonFrame";
import ReadingLesson from "./ReadingLesson";

/*
 * TODO(#5 백엔드 패치): 학습 페이지의 서버 데이터 로딩으로 바뀌면 이 파일은 통째로 빠진다.
 * 그 전까지 브라우저에서 오늘의 배정(GET /sessions/today)과 단계 데이터를 불러 각 단계 화면에 넘긴다.
 * 단계 화면은 API 응답 객체만 props로 받으므로 로딩 방식이 바뀌어도 그대로 쓸 수 있다.
 */

export type LoadedStep = 1;

const TITLES: Record<LoadedStep, string> = { 1: "번갈아 읽기" };

type Loaded = { step: 1; assignmentId: number; bookTitle: string; reading: ReadingResponse };

type State =
  | { status: "loading" }
  | { status: "loaded"; data: Loaded }
  | { status: "blocked"; message: string; action: { href: string; label: string } }
  | { status: "error"; message: string };

async function load(step: LoadedStep): Promise<Exclude<State, { status: "loading" }>> {
  const today: TodayResponse = await getToday();
  if (today.type === "DONE") {
    return { status: "blocked", message: "오늘 읽을 책을 다 읽었어요. 내일 또 만나요!", action: { href: "/home", label: "여울이 방으로" } };
  }
  if (today.type === "NO_BOOK" || today.assignmentId === undefined || !today.book) {
    return { status: "blocked", message: "지금은 읽을 책이 없어요.", action: { href: "/home", label: "여울이 방으로" } };
  }
  const { assignmentId, book } = today;
  return { status: "loaded", data: { step, assignmentId, bookTitle: book.title, reading: await getReading(assignmentId) } };
}

export default function LessonLoader({ step }: { step: LoadedStep }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    load(step)
      .then((result) => {
        if (!cancelled) setState(result);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (isApiError(error, 401) || isApiError(error, 403)) {
          setState({ status: "blocked", message: "학생 계정으로 로그인해야 해요.", action: { href: "/", label: "로그인하러 가기" } });
        } else if (isApiError(error, 409)) {
          setState({ status: "blocked", message: "아직 이 단계를 할 차례가 아니에요.", action: { href: "/study", label: "학습 지도로" } });
        } else {
          setState({ status: "error", message: errorMessage(error) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [step, attempt]);

  if (state.status === "loaded") {
    const { data } = state;
    return <ReadingLesson assignmentId={data.assignmentId} bookTitle={data.bookTitle} reading={data.reading} />;
  }

  const retry = () => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  };

  return (
    <LessonFrame title={TITLES[step]} progress={{ current: step, total: LESSON_COUNT }}>
      <div className="absolute inset-x-0 top-[300px] flex flex-col items-center gap-[28px] text-center" aria-live="polite">
        {state.status === "loading" ? (
          <p className="text-[26px] font-bold text-[#857B72]">여울이가 책을 펼치고 있어요…</p>
        ) : (
          <>
            <p className="max-w-[760px] text-[28px] leading-[40px] font-bold break-keep text-[#2B2420]">{state.message}</p>
            {state.status === "blocked" ? (
              <LoaderAction href={state.action.href}>{state.action.label}</LoaderAction>
            ) : (
              <LoaderAction onClick={retry}>다시 불러오기</LoaderAction>
            )}
          </>
        )}
      </div>
    </LessonFrame>
  );
}

const actionClassName =
  "flex h-[76px] w-[280px] cursor-pointer items-center justify-center rounded-full bg-[#D9621C] text-[24px] font-bold text-white transition hover:brightness-105 active:scale-[0.98]";

function LoaderAction({ href, onClick, children }: { href?: string; onClick?: () => void; children: ReactNode }) {
  if (href) {
    return (
      <Link href={href} className={actionClassName}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={actionClassName}>
      {children}
    </button>
  );
}
