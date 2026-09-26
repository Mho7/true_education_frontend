"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/api/auth";
import { signOut } from "@/lib/session";
import { GearIcon, GiftIcon, HomeIcon, OpenBookIcon, RecordIcon } from "./guardianIcons";

// 보호자 화면 왼쪽 메뉴(시안 abcc.png). 메뉴마다 주소가 있어 새로고침·뒤로 가기가 된다.
const ITEMS = [
  { href: "/guardian", label: "홈", Icon: HomeIcon },
  { href: "/guardian/records", label: "학습 기록", Icon: RecordIcon },
  { href: "/guardian/rewards", label: "리워드 설정", Icon: GiftIcon },
  { href: "/guardian/account", label: "계정 관리", Icon: GearIcon },
] as const;

export default function GuardianSideNav() {
  const router = useRouter();
  const pathname = usePathname();

  function handleLogout() {
    // 서버 세션도 끝낸다. 실패해도(이미 만료 등) 화면에서는 로그아웃한다.
    logout().catch(() => {});
    signOut();
    router.push("/");
  }

  return (
    <nav
      aria-label="보호자 메뉴"
      className="relative flex shrink-0 flex-col border-[#E6E8EC] bg-white max-lg:border-b lg:h-screen lg:w-[240px] lg:border-r"
    >
      <Link href="/guardian" className="flex items-center gap-[12px] px-[28px] pt-[36px] pb-[32px] max-lg:px-[16px] max-lg:py-[14px]">
        <span className="flex size-[40px] shrink-0 items-center justify-center rounded-[12px] bg-[#E8672A] text-white">
          <OpenBookIcon className="size-[22px]" />
        </span>
        <span className="text-[15px] leading-[20px] font-bold tracking-[-0.01em] break-keep text-[#111418]">
          우리 아이
          <br className="max-lg:hidden" /> 독서 기록
        </span>
      </Link>

      <p className="px-[30px] pb-[8px] text-[12px] font-semibold tracking-[0.04em] text-[#A3A8B2] max-lg:hidden">메뉴</p>
      <ul className="flex gap-[4px] px-[16px] max-lg:overflow-x-auto max-lg:pb-[12px] lg:flex-col">
        {ITEMS.map(({ href, label, Icon }) => {
          const selected = pathname === href;
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={selected ? "page" : undefined}
                className={`flex h-[46px] w-full items-center gap-[12px] rounded-[12px] px-[14px] text-[16px] whitespace-nowrap transition max-lg:h-[40px] max-lg:text-[15px] ${
                  selected ? "bg-[#F3F4F6] font-semibold text-[#111418]" : "text-[#4B5260] hover:bg-[#F7F8FA]"
                }`}
              >
                <Icon className={`size-[20px] shrink-0 ${selected ? "text-[#E8672A]" : "text-[#8A909C]"}`} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={handleLogout}
        className="mx-[16px] mt-auto mb-[24px] flex h-[40px] cursor-pointer items-center rounded-[12px] px-[14px] text-[14px] text-[#8A909C] transition hover:bg-[#F7F8FA] hover:text-[#4B5260] max-lg:absolute max-lg:top-[14px] max-lg:right-0 max-lg:m-0 max-lg:mr-[8px]"
      >
        로그아웃
      </button>
    </nav>
  );
}
