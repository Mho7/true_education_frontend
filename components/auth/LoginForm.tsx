"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { GraduationCapIcon, LockIcon, UserIcon, UsersIcon } from "@/components/auth/icons";
import { getMe, login } from "@/lib/api/auth";
import { ApiError, errorMessage } from "@/lib/api/client";
import { rememberSignedInMember, type MemberRole } from "@/lib/session";

const ROLE_TABS: { value: MemberRole; label: string; Icon: typeof UsersIcon }[] = [
  { value: "student", label: "학생", Icon: GraduationCapIcon },
  { value: "guardian", label: "보호자", Icon: UsersIcon },
];

export default function LoginForm() {
  const router = useRouter();
  const [role, setRole] = useState<MemberRole>("student");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loginId.trim() || !password) {
      setError("아이디와 비밀번호를 입력해 주세요");
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      // 서버가 세션 쿠키를 심는다. 화면에 쓸 이름·학생 코드는 /me로 받아 기억해 둔다.
      const { role: signedInRole } = await login({ role: role === "guardian" ? "PARENT" : "STUDENT", loginId: loginId.trim(), password });
      const me = await getMe();
      const memberRole: MemberRole = signedInRole === "PARENT" ? "guardian" : "student";
      rememberSignedInMember({
        loginId: loginId.trim(),
        name: me.name,
        role: memberRole,
        ...(me.studentCode ? { studentCode: me.studentCode } : {}),
      });
      // 학생은 메인(/home, 여울이 방), 보호자는 보호자 대시보드(/guardian)로 간다.
      router.push(memberRole === "guardian" ? "/guardian" : "/home");
    } catch (caught) {
      setError(caught instanceof ApiError && caught.status === 401 ? "아이디 또는 비밀번호가 올바르지 않아요" : errorMessage(caught));
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col items-center rounded-[24px] border border-white/90 bg-white/[0.86] px-[51px] pt-[44px] pb-[18px] shadow-[0_20px_50px_rgba(140,106,79,0.12)] backdrop-blur-[12px] max-sm:px-6"
    >
      <h1 className="sr-only">여울 로그인</h1>
      <Image src="/auth/login-brand.svg" alt="여울 - 여울이가 남긴 여운" width={144} height={163} preload />

      <div
        role="tablist"
        aria-label="회원 유형"
        className="mt-[35px] flex h-[58px] w-full rounded-full bg-[#EFEBE6] p-[5px]"
      >
        {ROLE_TABS.map(({ value, label, Icon }) => {
          const selected = role === value;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setRole(value)}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-[12px] rounded-full text-[15px] transition ${
                selected
                  ? "bg-white font-bold text-[#6B4A36] shadow-[0_2px_8px_rgba(107,74,54,0.1)]"
                  : "font-medium text-[#8A847D] hover:text-[#6B4A36]"
              }`}
            >
              <Icon className={`size-5 ${selected ? "text-[#7A5A45]" : "text-[#8A847D]"}`} />
              {label}
            </button>
          );
        })}
      </div>

      <label className="relative mt-[19px] block w-full">
        <span className="sr-only">아이디</span>
        <UserIcon className="pointer-events-none absolute top-1/2 left-[27px] size-[22px] -translate-y-1/2 text-[#7B7570]" />
        <input
          value={loginId}
          onChange={(event) => setLoginId(event.target.value)}
          autoComplete="username"
          placeholder="아이디"
          className="h-[65px] w-full rounded-[14px] bg-[#EFEBE6] pr-5 pl-[70px] text-[17px] text-[#5A4032] outline-none placeholder:text-[#6F6A65] focus:ring-2 focus:ring-[#8B6650]/40"
        />
      </label>

      <label className="relative mt-[17px] block w-full">
        <span className="sr-only">비밀번호</span>
        <LockIcon className="pointer-events-none absolute top-1/2 left-[27px] size-[22px] -translate-y-1/2 text-[#7B7570]" />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          placeholder="비밀번호"
          className="h-[65px] w-full rounded-[14px] bg-[#EFEBE6] pr-5 pl-[70px] text-[17px] text-[#5A4032] outline-none placeholder:text-[#6F6A65] focus:ring-2 focus:ring-[#8B6650]/40"
        />
      </label>

      <p role="alert" className="flex h-[34px] items-center text-[13px] text-[#D0582A]">
        {error}
      </p>

      <button
        type="submit"
        disabled={submitting}
        className="flex h-[70px] w-full cursor-pointer items-center justify-center rounded-full bg-[#8B6650] text-[18px] font-medium text-white shadow-[0_6px_16px_rgba(107,74,54,0.18)] transition hover:brightness-105 active:scale-[0.99]"
      >
        로그인
      </button>
      <Link
        href="/signup"
        className="mt-[18px] flex h-[70px] w-full items-center justify-center rounded-full bg-[#E87B3D] text-[18px] font-medium text-white shadow-[0_6px_16px_rgba(107,74,54,0.18)] transition hover:brightness-105 active:scale-[0.99]"
      >
        회원가입
      </Link>
    </form>
  );
}
