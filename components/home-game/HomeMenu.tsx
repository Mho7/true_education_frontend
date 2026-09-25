"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ComponentType } from "react";
import { LibraryIcon, PencilIcon, SettingsIcon, StampIcon } from "@/components/icons/menuIcons";
import SettingsModal from "@/components/settings/SettingsModal";

type MenuItem = {
  href: string;
  label: string;
  description: string;
  Icon: ComponentType<{ className?: string }>;
};

const MENU_ITEMS: MenuItem[] = [
  { href: "/study", label: "학습", description: "오늘의 학습 하러 가기", Icon: PencilIcon },
  { href: "/library", label: "책장", description: "읽은 책 모아보기", Icon: LibraryIcon },
  { href: "/stamp", label: "스탬프", description: "모은 스탬프 확인하기", Icon: StampIcon },
];

const itemClassName = "flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left transition hover:bg-[#FBF4EC]";
const iconBadgeClassName = "flex size-10 shrink-0 items-center justify-center rounded-full bg-[#F3DFC9] text-[#8B6650]";

export default function HomeMenu() {
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    // 메뉴 안에서 누른 키(Space/방향키)가 여울이 이동·상호작용으로 새지 않도록 막는다.
    <div
      ref={containerRef}
      onKeyDown={(event) => event.stopPropagation()}
      className="absolute top-6 right-6 z-40 flex flex-col items-end font-kr"
    >
      <button
        type="button"
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((prev) => !prev)}
        className="flex size-[52px] cursor-pointer items-center justify-center rounded-full border border-white/90 bg-white/85 text-[#8B6650] shadow-[0_6px_16px_rgba(107,74,54,0.18)] backdrop-blur-[12px] transition hover:bg-white active:scale-95"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          aria-hidden
          className="size-6"
        >
          {open ? (
            <>
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </>
          ) : (
            <>
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </>
          )}
        </svg>
      </button>

      <nav
        id={menuId}
        aria-label="홈 메뉴"
        hidden={!open}
        className="mt-3 w-[240px] rounded-[20px] border border-white/90 bg-white/[0.9] p-2 shadow-[0_20px_50px_rgba(140,106,79,0.18)] backdrop-blur-[12px]"
      >
        <ul className="flex flex-col gap-1">
          {MENU_ITEMS.map(({ href, label, description, Icon }) => (
            <li key={href}>
              <Link href={href} onClick={() => setOpen(false)} className={itemClassName}>
                <span className={iconBadgeClassName}>
                  <Icon className="size-5" />
                </span>
                <span className="flex flex-col">
                  <span className="text-[15px] font-bold text-[#5A4032]">{label}</span>
                  <span className="text-[12px] text-[#8A7F76]">{description}</span>
                </span>
              </Link>
            </li>
          ))}
          <li>
            {/* 로그아웃은 설정 팝업 안에서 한다. */}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setSettingsOpen(true);
              }}
              className={`${itemClassName} cursor-pointer`}
            >
              <span className={iconBadgeClassName}>
                <SettingsIcon className="size-5" />
              </span>
              <span className="flex flex-col">
                <span className="text-[15px] font-bold text-[#5A4032]">설정</span>
                <span className="text-[12px] text-[#8A7F76]">학생 정보 · 로그아웃</span>
              </span>
            </button>
          </li>
        </ul>
      </nav>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
