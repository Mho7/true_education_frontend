"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";
import { HomeIcon, LibraryIcon, PencilIcon, SettingsIcon, StampIcon } from "@/components/icons/menuIcons";
import SettingsModal from "@/components/settings/SettingsModal";
import { useViewportScale } from "@/hooks/useViewportScale";

type NavItem = {
  label: string;
  Icon: ComponentType<{ className?: string }>;
  /** 없으면 페이지 이동 대신 설정 팝업을 연다 */
  href?: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "홈", Icon: HomeIcon, href: "/home" },
  { label: "학습", Icon: PencilIcon, href: "/study" },
  { label: "책장", Icon: LibraryIcon, href: "/library" },
  { label: "스탬프", Icon: StampIcon, href: "/stamp" },
  { label: "설정", Icon: SettingsIcon },
];

// 사이드바는 시안 높이(900) 기준으로 그리고, 창 높이에 맞춰 콘텐츠와 같은 비율로 통째로 확대/축소한다.
const NAV_DESIGN_HEIGHT = 900;
const COLLAPSED_WIDTH = 96;
const EXPANDED_WIDTH = 208;

/** 현재 창 높이에서의 (접힌) 사이드바 실제 너비(px). 콘텐츠 영역의 left로 쓴다. */
export function useSideNavWidth() {
  return COLLAPSED_WIDTH * useViewportScale(NAV_DESIGN_HEIGHT);
}

export default function SideNav() {
  const pathname = usePathname();
  const scale = useViewportScale(NAV_DESIGN_HEIGHT);
  const [expanded, setExpanded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const designWidth = expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH;

  useEffect(() => {
    if (!expanded) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expanded]);

  return (
    <aside
      aria-label="주 메뉴"
      className={`absolute inset-y-0 left-0 z-30 overflow-hidden bg-[#F7F2E8] font-kr transition-[width,box-shadow] duration-200 ease-out ${
        expanded ? "shadow-[8px_0_30px_rgba(107,74,54,0.18)]" : ""
      }`}
      style={{ width: designWidth * scale }}
    >
      <div
        className="flex origin-top-left flex-col"
        style={{
          width: EXPANDED_WIDTH,
          height: NAV_DESIGN_HEIGHT,
          transform: `scale(${scale})`,
        }}
      >
        {/* 맨 위 캐릭터 이미지는 장식용이라 링크가 없다. */}
        <Image
          src="/auth/yeoul-cat.png"
          alt=""
          width={46}
          height={46}
          className="mt-[28px] ml-[26px] shrink-0"
        />

        {/* 시안(ABC.svg) 기준 첫 아이콘 중심이 y≈191, 이후 약 88px 간격 */}
        <nav className="mt-[85px] flex flex-1 flex-col gap-[24px]">
          {NAV_ITEMS.map(({ label, Icon, href }) => {
            // 페이지 메뉴는 현재 경로일 때, 설정은 팝업이 열려 있을 때 칠해진다.
            const active = href !== undefined ? pathname.startsWith(href) : settingsOpen;
            // 현재 페이지 메뉴는 아이콘 자리에 주황색 칸을 칠해 준다. 펼친 상태에서는 글자까지 이어진다.
            const rowClassName = `ml-[17px] flex h-[64px] shrink-0 items-center rounded-[18px] text-[#644129] transition-[width,background-color] duration-200 ${
              expanded ? "w-[174px]" : "w-[64px]"
            } ${active ? "bg-[#E19F5F]" : "hover:bg-[#EFE3D0]"}`;
            const content = (
              <>
                {/* 홈 ☰ 메뉴와 같은 선 아이콘을 48px 칸 가운데에 둔다 */}
                <span className="flex size-[48px] shrink-0 translate-x-[8px] items-center justify-center">
                  <Icon className="size-[28px]" />
                </span>
                <span
                  className={`ml-[14px] text-[17px] font-bold whitespace-nowrap transition-opacity duration-150 ${
                    expanded ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {label}
                </span>
              </>
            );

            return href ? (
              <Link
                key={label}
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                title={expanded ? undefined : label}
                className={rowClassName}
              >
                {content}
              </Link>
            ) : (
              <button
                key={label}
                type="button"
                aria-label={label}
                aria-haspopup="dialog"
                title={expanded ? undefined : label}
                onClick={() => setSettingsOpen(true)}
                className={`${rowClassName} cursor-pointer`}
              >
                {content}
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          aria-label={expanded ? "메뉴 접기" : "메뉴 펼치기"}
          aria-expanded={expanded}
          onClick={() => setExpanded((prev) => !prev)}
          className="mb-[37px] ml-[10px] shrink-0 cursor-pointer self-start transition active:scale-95"
        >
          <Image
            src="/library/nav-toggle.png"
            alt=""
            width={76}
            height={78}
            className={`transition-transform duration-200 ${expanded ? "" : "rotate-180"}`}
          />
        </button>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </aside>
  );
}
