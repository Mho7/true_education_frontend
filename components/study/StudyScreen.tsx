"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SideNav, { useSideNavWidth } from "@/components/nav/SideNav";
import { useElementSize } from "@/components/stage/Anchor";
import { lessonHref } from "@/lib/studyLessons";
import { useClearedLessons } from "@/lib/studyProgress";
import { Fox, NextArrow, SpeechBubble } from "./StudyParts";
import TreasureScene from "./TreasureScene";
import {
  LEGS,
  LESSON_COUNT,
  MAP_CHEST,
  MAP_HEIGHT,
  MAP_WIDTH,
  STAGE_PADS,
  STATIONS,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  foxHeight,
  type FoxPose,
  type Point,
} from "./studyMap";

/**
 * ready    — 발판에 서서 다음 단계 버튼을 기다린다
 * running  — 다음 발판으로 달려가는 중
 * arrived  — 발판에 도착해 한마디 한다
 * leaving  — 그 단계의 학습 페이지(/study/lesson/N)로 넘어가는 중
 * treasure — 4단계를 모두 끝내고 보물상자에 도착했다
 *
 * 다음 단계 발판을 누르면 진행한다. 1단계는 여울이가 처음 서 있는 발판이라 바로 학습 페이지로 넘어가고,
 * 2~4단계는 그 발판까지 달려가 한마디 한 뒤 넘어간다. 학습을 끝내고 돌아오면 끝낸 단계 수(저장됨)에 맞춰
 * 그 발판에서 기뻐하고 있다. 4단계를 끝내면 지도 끝 보물상자를 눌러 간다.
 */
type Mode = "ready" | "running" | "arrived" | "leaving" | "treasure";

const GREETING = "어서와!\n오늘도 힘차게 시작해보자!";
// 2~4단계 발판에 도착했을 때 대사와 포즈 (인덱스는 STATIONS와 같다)
const ARRIVE_LINES = ["", "우리 같이 동화를 읽으러 가볼까?", "화이팅! 거의 다왔어", "마지막이야!\n조금만 더 힘내보자!"];
const ARRIVE_POSES: FoxPose[] = ["idle", "think", "wink", "cheer"];
// N단계를 끝냈을 때 대사 (인덱스 = 끝낸 단계 수 - 1)
const CLEAR_LINES = ["좋았어! 이대로 쭉 가보자", "잘했어! 다음으로 가보자", "최고야! 끝까지 해보자", "대단해! 고생했어!"];
const TREASURE_HINT = "앞에 무언가 보여\n어서가보자!";

/** 달리기 속도 (지도 px/초) */
const RUN_SPEED = 520;
/** 한 걸음(깡총) 길이 (지도 px) */
const STEP_LENGTH = 150;
/** 도착해서 대사를 보여 준 뒤 학습 페이지로 넘어가기까지 */
const LESSON_OPEN_DELAY = 1600;
/** 마지막 단계를 끝내고 "고생했어" 다음에 보물 힌트로 넘어가기까지 */
const HINT_DELAY = 1800;

const easeInOut = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function pathLength(points: Point[]) {
  let length = 0;
  for (let i = 1; i < points.length; i++) length += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  return length;
}

/** 꺾은선 위에서 전체 길이의 t 비율 지점 */
function pointOnPath(points: Point[], t: number): Point {
  let remaining = pathLength(points) * t;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const segment = Math.hypot(b.x - a.x, b.y - a.y);
    if (remaining <= segment || i === points.length - 1) {
      const k = segment === 0 ? 1 : Math.min(remaining / segment, 1);
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
    }
    remaining -= segment;
  }
  return points[points.length - 1];
}

/** 다음 발판이 화면 오른쪽 끝에서 이만큼은 떨어져 보이게 한다 (지도 px) */
const NEXT_PAD_MARGIN = 60;
/** 카메라를 밀어도 여울이 발끝은 화면 왼쪽 끝에서 이만큼 안쪽에 둔다 (지도 px) */
const FOX_MIN_LEFT = 130;

/** 시안 카메라(1340px 화면 기준)를 지금 화면 폭에 맞춘 화면 왼쪽 끝 지도 x. 화면 가운데가 같은 곳을 본다. */
function fitCamera(designCamera: number, viewWidth: number) {
  return clamp(designCamera + VIEW_WIDTH / 2 - viewWidth / 2, 0, Math.max(MAP_WIDTH - viewWidth, 0));
}

/** i번 정거장에 서 있을 때 화면 왼쪽 끝 지도 x */
function stationCameraX(i: number, viewWidth: number) {
  const x = fitCamera(STATIONS[i].camera, viewWidth);
  // 다음 발판이 오른쪽에 잘리면 여울이가 화면 밖으로 밀리지 않는 만큼 옆으로 옮겨 다 보이게 한다.
  const nextPad = STAGE_PADS[i + 1];
  if (!nextPad) return x;
  const needed = nextPad.x + nextPad.width + NEXT_PAD_MARGIN - viewWidth;
  const limit = STATIONS[i].feet.x - FOX_MIN_LEFT;
  return clamp(Math.max(x, Math.min(needed, limit)), 0, Math.max(MAP_WIDTH - viewWidth, 0));
}

/** leg번 발판에서 다음 발판(또는 보물상자)까지의 길 */
function legPath(leg: number): Point[] {
  return [STATIONS[leg].feet, LEGS[leg].via, STATIONS[leg + 1].feet];
}

export default function StudyScreen() {
  const router = useRouter();
  const sideNavWidth = useSideNavWidth();
  const [stageRef, stageSize] = useElementSize<HTMLDivElement>();
  /** 끝낸 단계 수 (0~4). 다음에 할 단계의 발판 번호이기도 하다. */
  const cleared = useClearedLessons();
  const [mode, setMode] = useState<Mode>("ready");
  /** 달리기 진행도 0~1 */
  const [runProgress, setRunProgress] = useState(0);
  const [showTreasureHint, setShowTreasureHint] = useState(false);

  // 달리기: 길이에 비례한 시간 동안 다음 정거장까지 이동한다.
  useEffect(() => {
    if (mode !== "running") return;
    // 방금 끝낸 단계의 발판(cleared - 1)에서 다음 발판(cleared)으로 간다.
    const duration = Math.max(1400, (pathLength(legPath(cleared - 1)) / RUN_SPEED) * 1000);
    let start: number | null = null;
    let frame = requestAnimationFrame(function tick(now) {
      start ??= now;
      const t = Math.min((now - start) / duration, 1);
      setRunProgress(t);
      if (t < 1) frame = requestAnimationFrame(tick);
      else setMode(cleared === LESSON_COUNT ? "treasure" : "arrived");
    });
    return () => cancelAnimationFrame(frame);
  }, [mode, cleared]);

  useEffect(() => {
    if (mode !== "arrived") return;
    const timer = window.setTimeout(() => setMode("leaving"), LESSON_OPEN_DELAY);
    return () => window.clearTimeout(timer);
  }, [mode]);

  useEffect(() => {
    if (mode === "leaving") router.push(lessonHref(cleared + 1));
  }, [mode, cleared, router]);

  useEffect(() => {
    if (mode !== "ready" || cleared !== LESSON_COUNT) return;
    const timer = window.setTimeout(() => setShowTreasureHint(true), HINT_DELAY);
    return () => window.clearTimeout(timer);
  }, [mode, cleared]);

  function goNext() {
    // 1단계는 지금 서 있는 발판이라 달릴 필요 없이 바로 학습 페이지로 넘어간다.
    if (cleared === 0) {
      setMode("leaving");
      return;
    }
    setRunProgress(0);
    setMode("running");
  }

  // 화면 배율: 세로를 시안 높이에 맞추고, 아주 넓은 화면이면 지도 폭에 맞춘다.
  const scale = stageSize ? Math.max(stageSize.height / VIEW_HEIGHT, stageSize.width / MAP_WIDTH) : 1;
  const viewWidth = stageSize ? stageSize.width / scale : VIEW_WIDTH;

  // 여울이 위치·포즈와 카메라
  let feet: Point;
  let pose: FoxPose;
  let cameraX: number;
  let hop = 0;
  let line: string | null = null;
  if (mode === "running") {
    const t = easeInOut(runProgress);
    const leg = cleared - 1;
    const path = legPath(leg);
    feet = pointOnPath(path, t);
    pose = LEGS[leg].pose;
    const fromX = stationCameraX(leg, viewWidth);
    cameraX = fromX + (stationCameraX(leg + 1, viewWidth) - fromX) * t;
    hop = Math.abs(Math.sin(((t * pathLength(path)) / STEP_LENGTH) * Math.PI)) * 18;
  } else {
    // ready면 방금 끝낸 단계의 발판, 도착·학습 중이면 지금 할 단계의 발판에 서 있다.
    const station = mode === "ready" ? Math.max(cleared - 1, 0) : cleared;
    feet = STATIONS[station].feet;
    cameraX = stationCameraX(station, viewWidth);
    if (mode === "ready") {
      const hinting = cleared === LESSON_COUNT && showTreasureHint;
      // 보물 힌트를 말할 때는 화면을 밀어 지도 끝 보물상자가 보이게 한다.
      if (hinting) cameraX = fitCamera(STATIONS[LESSON_COUNT].camera, viewWidth);
      pose = cleared === 0 ? "idle" : hinting ? "think" : "jump";
      line = cleared === 0 ? GREETING : hinting ? TREASURE_HINT : CLEAR_LINES[cleared - 1];
    } else {
      pose = ARRIVE_POSES[station] ?? "idle";
      line = ARRIVE_LINES[station] ?? null;
    }
  }
  const height = foxHeight(feet.y);
  const foxTop = feet.y - height;
  // 여울이가 화면 오른쪽 절반에 있으면 말풍선을 왼쪽으로 띄운다.
  const bubbleFlipped = feet.x - cameraX > viewWidth / 2;

  const activePad = mode === "arrived" || mode === "leaving" ? cleared : null;
  // 지금 눌러서 갈 수 있는 곳: 다음 단계 발판 번호, 또는 보물상자
  const nextPad = mode === "ready" && cleared < LESSON_COUNT ? cleared : null;
  const chestReady = mode === "ready" && cleared === LESSON_COUNT && showTreasureHint;

  return (
    <main className="relative h-screen w-full overflow-hidden bg-[#CFE9F5] font-kr">
      <SideNav />

      <div ref={stageRef} className="absolute inset-y-0 right-0 overflow-hidden" style={{ left: sideNavWidth }}>
        <h1 className="sr-only">오늘의 학습</h1>

        {/* 지도(월드). 여울이를 따라 가로로 움직인다. */}
        <div
          className="absolute top-0 left-0"
          style={{
            width: MAP_WIDTH,
            height: MAP_HEIGHT,
            transform: `scale(${scale}) translateX(${-cameraX}px)`,
            transformOrigin: "0 0",
            // 달릴 때는 매 프레임 직접 옮기고, 서 있을 때만 카메라 이동을 부드럽게 한다.
            transition: mode === "ready" ? "transform 1.2s ease-in-out" : "none",
          }}
        >
          <Image
            src="/study/map.png"
            alt=""
            width={MAP_WIDTH}
            height={MAP_HEIGHT}
            preload
            className="absolute inset-0 size-full max-w-none select-none"
            draggable={false}
          />

          {STAGE_PADS.map((pad, i) => {
            const stage = i + 1;
            const state = cleared > i ? "done" : activePad === i ? "active" : "locked";
            const isNext = nextPad === i;
            return (
              <div
                key={stage}
                className="absolute"
                style={{ left: pad.x, top: pad.y, width: pad.width, height: pad.height }}
                aria-label={`${stage}단계 ${state === "done" ? "완료" : state === "active" ? "학습 중" : "아직 안 함"}`}
              >
                {(["locked", "active", "done"] as const).map((name) => (
                  <Image
                    key={name}
                    src={`/study/pad-${name}.png`}
                    alt=""
                    fill
                    sizes="320px"
                    preload
                    className={`select-none ${
                      // 다음에 누를 발판은 빛나는 그림을 깜빡여 눌러 보라고 알려 준다.
                      name === state ? "" : isNext && name === "active" ? "animate-pad-pulse" : "invisible"
                    }`}
                    draggable={false}
                  />
                ))}
                {/* 1단계 발판 위에는 여울이가 서 있어 화살표를 띄우지 않는다. */}
                {isNext && i > 0 && <NextArrow />}
              </div>
            );
          })}

          {chestReady && (
            <div
              className="absolute"
              style={{ left: MAP_CHEST.x, top: MAP_CHEST.y, width: MAP_CHEST.width, height: MAP_CHEST.height }}
            >
              <div className="absolute -inset-[40px] animate-pad-pulse rounded-full bg-[radial-gradient(closest-side,rgba(255,226,120,0.9),rgba(255,226,120,0))]" />
              <NextArrow />
            </div>
          )}

          <Fox x={feet.x} y={feet.y - hop} height={height} pose={pose} className="pointer-events-none" />

          {line && (
            <SpeechBubble
              key={line}
              x={bubbleFlipped ? feet.x - 80 : feet.x + 80}
              y={foxTop + (bubbleFlipped ? 60 : 25)}
              flipped={bubbleFlipped}
            >
              {line}
            </SpeechBubble>
          )}

          {/* 누르는 자리는 여울이·말풍선보다 위에 둔다. 1단계는 발판 위 여울이를 눌러도 된다. */}
          {nextPad !== null && (
            <button
              type="button"
              aria-label={nextPad === 0 ? "1단계 학습 시작하기" : `${nextPad + 1}단계 발판으로 가기`}
              onClick={goNext}
              className="absolute cursor-pointer rounded-full"
              style={{
                left: STAGE_PADS[nextPad].x,
                top: nextPad === 0 ? foxTop : STAGE_PADS[nextPad].y,
                width: STAGE_PADS[nextPad].width,
                height: STAGE_PADS[nextPad].y + STAGE_PADS[nextPad].height - (nextPad === 0 ? foxTop : STAGE_PADS[nextPad].y),
              }}
            />
          )}
          {chestReady && (
            <button
              type="button"
              aria-label="보물상자로 가기"
              onClick={goNext}
              className="absolute cursor-pointer rounded-full"
              style={{ left: MAP_CHEST.x, top: MAP_CHEST.y, width: MAP_CHEST.width, height: MAP_CHEST.height }}
            />
          )}
        </div>


        {mode === "treasure" && (
          <TreasureScene scale={scale} viewWidth={viewWidth} />
        )}
      </div>
    </main>
  );
}
