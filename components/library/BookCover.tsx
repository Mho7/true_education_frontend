import Image from "next/image";
import type { ReactNode } from "react";
import { COVER_ART_ASPECT } from "@/lib/coverArt";
import type { BookTheme } from "@/lib/bookshelf";

// 책 표지 한 권 (public/library/book-<theme>.png, 537×613 그림을 절반 크기로 그린 좌표).
// 책장과 그림 그리기 화면의 표지 미리보기가 함께 쓴다.
export const BOOK_WIDTH = 269.814;
export const BOOK_HEIGHT = 308;

// 표지 이미지마다 안쪽 그림 칸의 위치가 조금씩 다르다 (분홍만 조금 아래에 있다).
const COVER_PANEL_TOP: Record<BookTheme, number> = { blue: 52.8, green: 52.8, pink: 57.9, purple: 52.8, yellow: 52.8 };
const COVER_PANEL = { left: 37.6, width: 210.7, height: 206.6 };
// 그림 칸 안쪽(테두리·여백 제외) 크기. 세로는 그림 캔버스와 같은 비율(COVER_ART_ASPECT)로 맞춘다.
const COVER_ART_BOX_WIDTH = 205.7;
const COVER_ART_BOX_HEIGHT = COVER_ART_BOX_WIDTH / COVER_ART_ASPECT;

function formatCoverDate(iso: string) {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(date.getFullYear() % 100)} / ${pad(date.getMonth() + 1)} / ${pad(date.getDate())}`;
}

type BookCoverProps = {
  theme: BookTheme;
  title: string;
  /** 표지 아래에 적는 날짜 (ISO 문자열) */
  date: string;
  /** 그림 칸 바탕색 (그림이 없을 때 보이는 색) */
  artBackground?: string;
  /** 표지 그림(book-<theme>.png)의 next/image sizes. 표지를 크게 그리는 화면에서만 키운다. */
  sizes?: string;
  /** 그림 칸에 채울 내용 (표지 그림 이미지, 실시간 미리보기 캔버스 등). 칸 크기는 COVER_ART 비율이다. */
  children?: ReactNode;
};

export default function BookCover({ theme, title, date, artBackground = "#F1EDE4", sizes = "270px", children }: BookCoverProps) {
  return (
    <div className="relative drop-shadow-[9px_2px_2.3px_rgba(0,0,0,0.29)]" style={{ width: BOOK_WIDTH, height: BOOK_HEIGHT }}>
      <Image src={`/library/book-${theme}.png`} alt="" fill sizes={sizes} />

      <p className="absolute top-[22px] left-[41px] flex h-[36px] w-[204px] items-center justify-center px-2 text-[16px] font-bold text-[#5B4F3E]">
        <span className="truncate">{title}</span>
      </p>

      <div
        className="absolute flex items-center justify-center rounded-[10px] border border-dashed border-[#E4D3B8] bg-[#FDF9F3]"
        style={{ left: COVER_PANEL.left, top: COVER_PANEL_TOP[theme], width: COVER_PANEL.width, height: COVER_PANEL.height }}
      >
        <div
          className="relative overflow-hidden rounded-[6.5px]"
          style={{ width: COVER_ART_BOX_WIDTH, height: COVER_ART_BOX_HEIGHT, backgroundColor: artBackground }}
        >
          {children}
        </div>
      </div>

      <p className="absolute top-[262px] left-[143px] -translate-x-1/2 font-display text-[18px] whitespace-nowrap text-[#C4561A]">
        <time dateTime={date}>{formatCoverDate(date)}</time>
      </p>
    </div>
  );
}
