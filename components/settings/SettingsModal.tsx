"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { logout } from "@/lib/api/auth";
import { signOut, useCurrentMember } from "@/lib/session";

type SettingsModalProps = {
  open: boolean;
  onClose: () => void;
};

// 회원가입 카드(components/auth/SignupFlow)와 같은 톤의 팝업. 사이드바처럼 transform이 걸린 부모 안에서
// 열려도 화면 기준으로 뜨도록 body에 포털로 붙인다.
export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  if (!open) return null;
  return createPortal(<SettingsDialog onClose={onClose} />, document.body);
}

function SettingsDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const member = useCurrentMember();
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const isGuardian = member?.role === "guardian";
  const studentCode = member?.studentCode;

  async function handleCopy() {
    if (!studentCode) return;
    try {
      await navigator.clipboard.writeText(studentCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // 클립보드 권한이 없으면 조용히 무시한다 (코드는 화면에 그대로 보인다).
    }
  }

  function handleLogout() {
    // 서버 세션도 끝낸다. 실패해도(이미 만료 등) 화면에서는 로그아웃한다.
    logout().catch(() => {});
    signOut();
    onClose();
    router.push("/");
  }

  return (
    // 팝업 안에서 누른 키(Space/방향키)가 홈 화면의 여울이 조작으로 새지 않도록 막는다.
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#5A4032]/25 p-4 font-kr backdrop-blur-[3px]"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-[440px] max-w-full rounded-[24px] border border-white/90 bg-white/[0.92] px-[40px] pt-[34px] pb-[32px] shadow-[0_20px_50px_rgba(140,106,79,0.18)] backdrop-blur-[12px]"
      >
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="설정 닫기"
          onClick={onClose}
          className="absolute top-[18px] right-[18px] flex size-9 cursor-pointer items-center justify-center rounded-full text-[#8B6650] transition hover:bg-[#FBF4EC]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden className="size-5">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        <header className="flex flex-col items-center text-center">
          <Image src="/auth/yeoul-cat.png" alt="" width={56} height={56} />
          <h2 id={titleId} className="mt-[6px] font-display text-[30px] leading-[36px] text-[#8B6650]">
            설정
          </h2>
          <p className="mt-[4px] font-pen text-[22px] leading-[28px] text-[#6B5446]">여울이와 함께하는 나의 정보예요</p>
        </header>

        <dl className="mt-[24px] flex flex-col gap-[14px]">
          <div>
            <dt className="text-[14px] leading-[20px] font-medium text-[#6B5446]">{isGuardian ? "이름" : "학생 이름"}</dt>
            <dd className="mt-[6px] flex h-[50px] items-center rounded-[12px] bg-[#EFEBE6] px-[18px] text-[15px] text-[#5A4032]">
              {member?.name || <span className="text-[#8F8983]">회원가입 정보가 없어요</span>}
            </dd>
          </div>
          <div>
            <dt className="text-[14px] leading-[20px] font-medium text-[#6B5446]">
              {isGuardian ? "연결된 학생 코드" : "학생 코드"}
            </dt>
            <dd className="mt-[6px] flex gap-[10px]">
              <span className="flex h-[50px] min-w-0 flex-1 items-center rounded-[12px] bg-[#EFEBE6] px-[18px] text-[17px] font-bold tracking-[0.2em] text-[#5A4032]">
                {studentCode ?? <span className="text-[15px] font-normal tracking-normal text-[#8F8983]">아직 없어요</span>}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!studentCode}
                className="h-[50px] w-[90px] shrink-0 cursor-pointer rounded-[12px] border-[1.2px] border-[#D9CFC4] text-[14px] font-medium text-[#7A5A45] transition hover:bg-[#FBF4EC] disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent"
              >
                {copied ? "복사됨!" : "복사"}
              </button>
            </dd>
            {!isGuardian && (
              <p className="mt-[6px] text-[12px] text-[#8A7F76]">보호자가 가입할 때 이 코드를 입력하면 연결돼요</p>
            )}
          </div>
        </dl>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-[26px] flex h-[56px] w-full cursor-pointer items-center justify-center rounded-full bg-[#E87B3D] text-[17px] font-medium text-white shadow-[0_6px_14px_rgba(90,62,46,0.18)] transition hover:brightness-105 active:scale-[0.99]"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}
