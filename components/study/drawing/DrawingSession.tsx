"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import BookCover, { BOOK_WIDTH } from "@/components/library/BookCover";
import LessonFrame from "@/components/study/lesson/LessonFrame";
import { updateBookDraft, useBookDraft } from "@/lib/bookDraft";
import { COVER_ART_HEIGHT, COVER_ART_WIDTH } from "@/lib/coverArt";
import {
  createDrawingSnapshot,
  DEFAULT_PEN_COLOR,
  PAPER_COLOR,
  visibleStrokes,
  type DrawingAction,
  type DrawingTool,
  type Stroke,
} from "@/lib/drawing";
import DrawingCanvas from "./DrawingCanvas";
import DrawingToolbar from "./DrawingToolbar";
import ExplainDrawing from "./ExplainDrawing";
import FinishDrawingModal from "./FinishDrawingModal";

// 시안 "그림 그리기" 좌표 (1104×900 콘텐츠 캔버스, 사이드바 제외. 시안 전체 화면 x에서 96을 뺀 값)
const PANEL = { left: 56, top: 73, width: 652, height: 754 };
const PREVIEW_BOOK = { left: 778, top: 74, width: 238 };
const PREVIEW_SCALE = PREVIEW_BOOK.width / BOOK_WIDTH;
const SIDE_COLUMN = { left: 753, width: 300 };
// 시안 표지 미리보기의 그림 칸 바탕색
const PREVIEW_ART_BACKGROUND = "#FFFDF9";

const subscribeNothing = () => () => {};

/** drawing: 그리는 중 (확인 팝업 포함) / explain: 그림을 저장했고 그림을 말로 설명하는 단계 */
type Phase = "drawing" | "explain";

/**
 * 시안 drawing-session-empty / drawing-session-drawing / drawing-finish-popup.
 * - 왼쪽 큰 칸이 실제 그림 캔버스이고, 그린 그림이 오른쪽 책 표지 그림 칸에 같은 비율로 줄어 실시간으로 보인다.
 * - 첫 "다 했어요"는 확인 팝업만 연다. 팝업이 떠 있어도 캔버스는 그대로 남아 있다.
 * - 팝업의 "다 했어요"를 누르면 그림을 표지 이미지로 저장하고, 같은 주소에서 그림 설명하기(ExplainDrawing)로 넘어간다.
 * - 초안에 표지 그림이 이미 있으면(설명하기까지 왔다가 새로고침) 처음부터 설명하기로 시작한다.
 * - 초안은 제목 짓기(4단계)에서 만든다. 초안 없이 이 주소로 바로 들어오면 학습 지도로 돌려보낸다.
 */
export default function DrawingSession() {
  const router = useRouter();
  const draft = useBookDraft();
  // 서버 렌더·첫 화면에서는 초안을 아직 못 읽었으므로 false. 그 뒤에도 초안이 없을 때만 되돌려 보낸다.
  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const previewFrameRef = useRef(0);

  const [actions, setActions] = useState<DrawingAction[]>([]);
  const [tool, setTool] = useState<DrawingTool>("pen");
  const [color, setColor] = useState(DEFAULT_PEN_COLOR);
  const [strokeActive, setStrokeActive] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // 저장 공간이 모자라 초안에 표지 그림을 못 넣었을 때를 대비해 이번 화면에서 쓸 사본을 둔다.
  const [savedCoverImage, setSavedCoverImage] = useState<string | null>(null);
  const coverImage = draft?.coverImage ?? savedCoverImage;
  const phase: Phase = coverImage ? "explain" : "drawing";

  useEffect(() => {
    if (hydrated && !draft) router.replace("/study");
  }, [hydrated, draft, router]);

  /** 그림 캔버스를 표지 미리보기 캔버스로 같은 비율 그대로 줄여 옮긴다 (한 프레임에 한 번만). */
  const paintPreview = useCallback(() => {
    if (previewFrameRef.current) return;
    previewFrameRef.current = window.requestAnimationFrame(() => {
      previewFrameRef.current = 0;
      const source = canvasRef.current;
      const target = previewRef.current;
      const ctx = target?.getContext("2d");
      if (!source || !target || !ctx) return;
      ctx.clearRect(0, 0, target.width, target.height);
      ctx.drawImage(source, 0, 0, target.width, target.height);
    });
  }, []);

  useEffect(() => () => window.cancelAnimationFrame(previewFrameRef.current), []);

  const strokes = visibleStrokes(actions);
  const hasDrawing = strokes.some((stroke) => stroke.tool === "pen");
  const showPlaceholder = !hasDrawing && !strokeActive;

  const handleStrokeStart = useCallback(() => setStrokeActive(true), []);
  const handleStrokeEnd = useCallback((stroke: Stroke) => {
    setStrokeActive(false);
    setActions((prev) => [...prev, { type: "stroke", stroke }]);
  }, []);

  function selectColor(next: string) {
    setColor(next);
    setTool("pen");
  }

  function clearAll() {
    if (strokes.length === 0) return;
    setActions((prev) => [...prev, { type: "clear" }]);
  }

  const closeConfirm = useCallback(() => setConfirmOpen(false), []);

  const finishDrawing = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const image = createDrawingSnapshot(canvas);
    updateBookDraft({ coverImage: image });
    setSavedCoverImage(image);
    setConfirmOpen(false);
  }, []);

  return (
    <LessonFrame title={phase === "drawing" ? "그림 그리기" : "그림 설명하기"} hideTitle>
      {/* 초안(표지 색·제목)을 읽기 전에는 비워 둔다. 새로고침 때 그리기 화면이 잠깐 비쳤다 사라지지 않게 한다. */}
      {!draft ? null : phase === "drawing" ? (
        <>
          <section
            aria-label="그림 그리기 판"
            className="absolute overflow-hidden rounded-[28px] bg-[#FFFAF3]"
            style={{ left: PANEL.left, top: PANEL.top, width: PANEL.width, height: PANEL.height }}
          >
            {/* 그림 칸(0~636) 아래 시안 구분선(y=637)까지 흰 종이다 */}
            <div className="absolute inset-x-0 top-0 h-[638px] border-b border-[#EEE3D3]" style={{ backgroundColor: PAPER_COLOR }}>
              <DrawingCanvas
                canvasRef={canvasRef}
                actions={actions}
                tool={tool}
                color={color}
                onStrokeStart={handleStrokeStart}
                onStrokeEnd={handleStrokeEnd}
                onPaint={paintPreview}
              />
              {showPlaceholder && (
                <p
                  className="pointer-events-none absolute top-0 left-0 flex items-center justify-center text-[18px] text-[#BDAE9C] select-none"
                  style={{ width: COVER_ART_WIDTH, height: COVER_ART_HEIGHT }}
                >
                  여기에 자유롭게 그려보세요
                </p>
              )}
            </div>

            <DrawingToolbar
              tool={tool}
              color={color}
              canUndo={actions.length > 0}
              canClear={strokes.length > 0}
              onSelectColor={selectColor}
              onSelectEraser={() => setTool("eraser")}
              onUndo={() => setActions((prev) => prev.slice(0, -1))}
              onClear={clearAll}
            />

            {/* 판 테두리는 캔버스 위에 얹어 모서리까지 또렷하게 보이게 한다 */}
            <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[28px] border border-[#E6D8C4]" />
          </section>

          <div
            className="absolute origin-top-left"
            style={{ left: PREVIEW_BOOK.left, top: PREVIEW_BOOK.top, transform: `scale(${PREVIEW_SCALE})` }}
          >
            <BookCover theme={draft.theme} title={draft.title} date={draft.startedAt} artBackground={PREVIEW_ART_BACKGROUND}>
              <canvas
                ref={previewRef}
                width={COVER_ART_WIDTH}
                height={COVER_ART_HEIGHT}
                aria-label="책 표지 미리보기"
                className="absolute inset-0 block size-full"
              />
            </BookCover>
          </div>

          <p
            className="absolute flex h-[70px] flex-col items-center justify-center bg-[#FCF0E4] text-center text-[15px] leading-[22px] text-[#8A5A3E]"
            style={{ left: SIDE_COLUMN.left, top: 382, width: SIDE_COLUMN.width }}
          >
            <span>지금 그리고 있는 그림이</span>
            <span>책 표지에 들어가요!</span>
          </p>

          <button
            type="button"
            disabled={!hasDrawing}
            onClick={() => setConfirmOpen(true)}
            className="absolute h-[72px] cursor-pointer bg-[#D9621C] text-[21px] font-bold text-white transition hover:brightness-105 active:brightness-95 disabled:cursor-default disabled:bg-[#EFE7DC] disabled:text-[#B6A897] disabled:hover:brightness-100"
            style={{ left: SIDE_COLUMN.left, top: 466, width: SIDE_COLUMN.width }}
          >
            다 했어요 →
          </button>

          <Image
            src="/study/drawing/fox-drawing.png"
            alt=""
            width={366}
            height={257}
            className="pointer-events-none absolute top-[625px] left-[717px] h-[257px] w-[366px] select-none"
          />

          {confirmOpen && <FinishDrawingModal onContinue={closeConfirm} onFinish={finishDrawing} />}
        </>
      ) : (
        coverImage && <ExplainDrawing draft={draft} coverImage={coverImage} />
      )}
    </LessonFrame>
  );
}
