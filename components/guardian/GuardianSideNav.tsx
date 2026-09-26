"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/lib/api/auth";
import { signOut } from "@/lib/session";
import { GearIcon, GiftIcon, HomeIcon, OpenBookIcon, RecordIcon } from "./guardianIcons";

export type GuardianView = "home" | "records" | "rewards";

// 보호자 화면 왼쪽 메뉴(시안 abcc.png). "계정 관리"는 화면이 생기면 연결한다.
const ITEMS: { key: GuardianView | "account"; label: string; Icon: typeof HomeIcon }[] = [
  { key: "home", label: "홈", Icon: HomeIcon },
  { key: "records", label: "학습 기록", Icon: RecordIcon },
  { key: "rewards", label: "리워드 설정", Icon: GiftIcon },
  { key: "account", label: "계정 관리", Icon: GearIcon },
];

export default function GuardianSideNav({ active, onSelect }: { active: GuardianView; onSelect: (view: GuardianView) => void }) {
  const router = useRouter();

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
      <p className="flex items-center gap-[12px] px-[28px] pt-[36px] pb-[32px] max-lg:px-[16px] max-lg:py-[14px]">
        <span className="flex size-[40px] shrink-0 items-center justify-center rounded-[12px] bg-[#E8672A] text-white">
          <OpenBookIcon className="size-[22px]" />
        </span>
        <span className="text-[15px] leading-[20px] font-bold tracking-[-0.01em] break-keep text-[#111418]">
          우리 아이
          <br className="max-lg:hidden" /> 독서 기록
        </span>
      </p>

      <p className="px-[30px] pb-[8px] text-[12px] font-semibold tracking-[0.04em] text-[#A3A8B2] max-lg:hidden">메뉴</p>
      <ul className="flex gap-[4px] px-[16px] max-lg:overflow-x-auto max-lg:pb-[12px] lg:flex-col">
        {ITEMS.map(({ key, label, Icon }) => {
          const selected = key === active;
          const ready = key !== "account";
          return (
            <li key={key} className="shrink-0">
              <button
                type="button"
                aria-current={selected ? "page" : undefined}
                aria-disabled={!ready}
                title={ready ? undefined : "준비 중이에요"}
                onClick={() => key !== "account" && onSelect(key)}
                className={`flex h-[46px] w-full items-center gap-[12px] rounded-[12px] px-[14px] text-[16px] whitespace-nowrap transition max-lg:h-[40px] max-lg:text-[15px] ${
                  selected ? "bg-[#F3F4F6] font-semibold text-[#111418]" : ready ? "text-[#4B5260] hover:bg-[#F7F8FA]" : "text-[#A3A8B2]"
                } ${ready ? "cursor-pointer" : "cursor-default"}`}
              >
                <Icon className={`size-[20px] shrink-0 ${selected ? "text-[#E8672A]" : ready ? "text-[#8A909C]" : "text-[#C7CBD2]"}`} />
                {label}
              </button>
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
