"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

type MenuItem = {
  href: string;
  label: string;
  description: string;
  icon: ReactNode;
};

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

const MENU_ITEMS: MenuItem[] = [
  {
    href: "/study",
    label: "학습",
    description: "오늘의 학습 하러 가기",
    icon: (
      <svg {...iconProps} className="size-5">
        <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
        <path d="m15 5 4 4" />
      </svg>
    ),
  },
  {
    href: "/library",
    label: "책장",
    description: "읽은 책 모아보기",
    icon: (
      <svg {...iconProps} className="size-5">
        <path d="m16 6 4 14" />
        <path d="M12 6v14" />
        <path d="M8 8v12" />
        <path d="M4 4v16" />
      </svg>
    ),
  },
  {
    href: "/stamp",
    label: "스탬프",
    description: "모은 스탬프 확인하기",
    icon: (
      <svg {...iconProps} className="size-5">
        <path d="M14 13V8.5C14 7 15 7 15 5a3 3 0 0 0-6 0c0 2 1 2 1 3.5V13" />
        <path d="M20 15.5a2.5 2.5 0 0 0-2.5-2.5h-11A2.5 2.5 0 0 0 4 15.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1z" />
        <path d="M5 22h14" />
      </svg>
    ),
  },
];

export default function HomeMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
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

  function handleLogout() {
    // TODO: 인증 API가 붙으면 세션/토큰을 정리한 뒤 이동한다.
    setOpen(false);
    router.push("/");
  }

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
        <svg {...iconProps} strokeWidth={2} className="size-6">
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
          {MENU_ITEMS.map(({ href, label, description, icon }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-[14px] px-3 py-2.5 transition hover:bg-[#FBF4EC]"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#F3DFC9] text-[#8B6650]">
                  {icon}
                </span>
                <span className="flex flex-col">
                  <span className="text-[15px] font-bold text-[#5A4032]">{label}</span>
                  <span className="text-[12px] text-[#8A7F76]">{description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mx-3 my-2 h-px bg-[#EAE4DD]" />

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full cursor-pointer items-center gap-3 rounded-[14px] px-3 py-2.5 text-left transition hover:bg-[#F5F2EE]"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#EFEBE6] text-[#7B7570]">
            <svg {...iconProps} className="size-5">
              <path d="m16 17 5-5-5-5" />
              <path d="M21 12H9" />
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            </svg>
          </span>
          <span className="text-[15px] font-medium text-[#6B5446]">로그아웃</span>
        </button>
      </nav>
    </div>
  );
}
