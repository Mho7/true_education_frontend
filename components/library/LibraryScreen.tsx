"use client";

import Image from "next/image";
import { useState } from "react";
import BookCover, { BOOK_HEIGHT, BOOK_WIDTH } from "@/components/library/BookCover";
import BookshelfDevPanel from "@/components/library/BookshelfDevPanel";
import { Anchor, useElementSize, type Scale } from "@/components/stage/Anchor";
import SideNav, { useSideNavWidth } from "@/components/nav/SideNav";
import { useCompletedBooks, type CompletedBook } from "@/lib/bookshelf";

// 좌표는 책장 배경 그림(ABCD.png, 1671×941) 기준이다. 그림 전체가 사이드바 오른쪽 영역에 꽉 맞는다.
const STAGE_WIDTH = 1671;
const STAGE_HEIGHT = 941;

// 윗줄 네모 칸 6개에 한 권씩 꽂는다. 칸 안쪽은 y≈376~594, 가로 약 180~190px이다.
// 책은 칸 바닥 턱(y≈594)에 세우고, 칸 가운데에 맞춘다.
const CUBBY_CENTER_X = [380, 576, 771, 970, 1167, 1366];
const CUBBY_FLOOR_Y = 594;
const BOOK_SCALE = 0.636; // 270×308 → 172×196
const SHELF_BOOK_WIDTH = BOOK_WIDTH * BOOK_SCALE;
const SHELF_BOOK_HEIGHT = BOOK_HEIGHT * BOOK_SCALE;
const SLOT_TOP = CUBBY_FLOOR_Y - SHELF_BOOK_HEIGHT;
const BOOKS_PER_SHELF = CUBBY_CENTER_X.length;
const slotLeft = (index: number) => CUBBY_CENTER_X[index] - SHELF_BOOK_WIDTH / 2;

export default function LibraryScreen() {
  const books = useCompletedBooks();
  const sideNavWidth = useSideNavWidth();
  const [stageRef, stageSize] = useElementSize<HTMLDivElement>();
  const totalShelves = Math.max(1, Math.ceil(books.length / BOOKS_PER_SHELF));
  // null이면 가장 최근 책이 있는 마지막 칸을 보여준다.
  const [selectedShelf, setSelectedShelf] = useState<number | null>(null);
  const shelf = Math.min(selectedShelf ?? totalShelves - 1, totalShelves - 1);

  const shelfBooks = books.slice(shelf * BOOKS_PER_SHELF, (shelf + 1) * BOOKS_PER_SHELF);
  const scale: Scale | null = stageSize
    ? { x: stageSize.width / STAGE_WIDTH, y: stageSize.height / STAGE_HEIGHT }
    : null;

  return (
    <main className="relative h-screen w-full overflow-hidden bg-[#FBF4E9] font-kr">
      <SideNav />

      <div
        ref={stageRef}
        className="absolute inset-y-0 right-0 overflow-hidden bg-[#E2B57E]"
        style={{ left: sideNavWidth }}
      >
        {/* 배경은 잘라내지 않고 콘텐츠 영역에 꽉 맞춘다. 화면비가 시안과 다르면 살짝 늘어난다. */}
        <Image
          src="/library/shelf-cubby-bg.png"
          alt=""
          width={STAGE_WIDTH}
          height={STAGE_HEIGHT}
          preload
          className="absolute top-0 left-0 w-full max-w-none"
          style={{ height: "100%" }}
        />

        {scale && (
          <>

            <ul aria-label={`책장 ${shelf + 1}칸`}>
              {shelfBooks.map((book, index) => (
                <li key={book.id}>
                  <Anchor x={slotLeft(index)} y={SLOT_TOP} scale={scale} size={BOOK_SCALE}>
                    {/* 한 권씩 위에서 꽂혀 들어오는 느낌으로 순서대로 나타난다 */}
                    <div className="animate-shelve" style={{ animationDelay: `${index * 70}ms` }}>
                      <BookOnShelf book={book} />
                    </div>
                  </Anchor>
                </li>
              ))}
            </ul>

            {/* 책장 아래 바닥 가운데 */}
            <Anchor x={870} y={842} scale={scale} centerX>
              <nav aria-label="책장 넘기기" className="flex items-center gap-[19px]">
                <ShelfPageButton direction="prev" disabled={shelf === 0} onClick={() => setSelectedShelf(shelf - 1)} />
                <p className="min-w-[56px] text-center font-display text-[22px] text-black/70" aria-live="polite">
                  {shelf + 1} / {totalShelves}
                </p>
                <ShelfPageButton
                  direction="next"
                  disabled={shelf === totalShelves - 1}
                  onClick={() => setSelectedShelf(shelf + 1)}
                />
              </nav>
            </Anchor>
          </>
        )}
        <BookshelfDevPanel />
      </div>
    </main>
  );
}

// 시안(내 책장_5): 넘길 수 있는 쪽은 주황색, 끝이라 못 넘기는 쪽은 흰색 테두리 버튼
function ShelfPageButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const label = direction === "prev" ? "이전 책장" : "다음 책장";
  const size = direction === "prev" ? { width: 108, height: 23 } : { width: 103, height: 25 };
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-[46px] w-[147px] items-center justify-center rounded-full border-2 transition ${
        disabled
          ? "cursor-default border-[#9A7C5C] bg-white"
          : "cursor-pointer border-[#D9621C] bg-[#DE691B] hover:brightness-105 active:scale-[0.98]"
      }`}
    >
      <Image src={`/library/${direction}-label-${disabled ? "disabled" : "active"}.svg`} alt="" {...size} />
    </button>
  );
}

function BookOnShelf({ book }: { book: CompletedBook }) {
  return (
    // 책 자체가 "다시 읽어보기" 버튼이다. 올리면 살짝 꺼내지는 느낌으로 들린다.
    // TODO: 책 읽기(뷰어) 화면이 생기면 해당 책으로 이동시킨다.
    <button
      type="button"
      aria-label={`${book.title} 다시 읽어보기`}
      title="다시 읽어보기"
      className="group relative block cursor-pointer text-left"
      style={{ width: BOOK_WIDTH, height: BOOK_HEIGHT }}
    >
      <div className="absolute inset-0 transition-transform duration-200 group-hover:-translate-y-[14px] group-focus-visible:-translate-y-[14px]">
        <BookCover theme={book.theme} title={book.title} date={book.completedAt}>
          {book.coverImage && <Image src={book.coverImage} alt="" fill sizes="206px" className="object-contain" />}
        </BookCover>
      </div>
    </button>
  );
}

