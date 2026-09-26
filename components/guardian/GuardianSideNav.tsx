"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/session";
import { GearIcon, GiftIcon, HomeIcon, OpenBookIcon, RecordIcon } from "./guardianIcons";

// 보호자 화면 왼쪽 메뉴(시안 abcc.png). 지금은 "홈"만 있고 나머지 메뉴는 화면이 생기면 연결한다.
const ITEMS = [
  { key: "home", label: "홈", Icon: HomeIcon, ready: true },
  { key: "records", label: "학습 기록", Icon: RecordIcon, ready: false },
  { key: "rewards", label: "리워드 설정", Icon: GiftIcon, ready: false },
  { key: "account", label: "계정 관리", Icon: GearIcon, ready: false },
] as const;

export default function GuardianSideNav() {
  const router = useRouter();

  function handleLogout() {
    signOut();
    router.push("/");
  }

  return (
    <nav
      aria-label="보호자 메뉴"
      className="relative flex shrink-0 flex-col border-[#EFEAE3] bg-[#FAF8F5] max-lg:border-b lg:min-h-screen lg:w-[240px] lg:border-r"
    >
      <p className="flex items-center gap-[14px] px-[36px] pt-[40px] pb-[36px] text-[18px] leading-[26px] text-[#4A4038] max-lg:px-[20px] max-lg:py-[16px]">
        <OpenBookIcon className="size-[36px] shrink-0 text-[#6B5A4C]" />
        <span className="break-keep">
          우리 아이
          <br className="max-lg:hidden" /> 독서 기록
        </span>
      </p>

      <ul className="flex gap-[6px] px-[20px] max-lg:overflow-x-auto max-lg:pb-[12px] lg:flex-col lg:gap-[8px]">
        {ITEMS.map(({ key, label, Icon, ready }) => {
          const active = key === "home";
          return (
            <li key={key} className="shrink-0">
              <button
                type="button"
                aria-current={active ? "page" : undefined}
                aria-disabled={!ready}
                title={ready ? undefined : "준비 중이에요"}
                className={`flex h-[56px] w-full items-center gap-[18px] rounded-[14px] px-[20px] text-[19px] whitespace-nowrap transition max-lg:h-[44px] max-lg:gap-[10px] max-lg:px-[14px] max-lg:text-[16px] ${
                  active ? "bg-[#F1EBE3] font-bold text-[#3A302A]" : "text-[#4A4038]"
                } ${ready ? "cursor-pointer" : "cursor-default"}`}
              >
                <Icon className={`size-[26px] shrink-0 max-lg:size-[20px] ${active ? "text-[#4A3C31]" : "text-[#6B5A4C]"}`} />
                {label}
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-auto mb-[28px] ml-[40px] w-fit cursor-pointer text-[14px] text-[#9A8F85] underline-offset-4 hover:text-[#5C5149] hover:underline max-lg:absolute max-lg:top-[20px] max-lg:right-[20px] max-lg:m-0"
      >
        로그아웃
      </button>
    </nav>
  );
}
