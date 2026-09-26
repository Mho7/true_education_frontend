"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import DesignStage from "@/components/DesignStage";
import { ChevronLeftIcon, GraduationCapIcon, UsersIcon } from "@/components/auth/icons";
import { registerMember, type Member, type MemberRole } from "@/lib/session";
import { CheckboxField, TextField } from "@/components/auth/SignupFields";
import SignupStepper from "@/components/auth/SignupStepper";
import ConsentDetailModal from "@/components/auth/ConsentDetailModal";
import { CONSENT_SCREENS, type ConsentDetail } from "@/lib/signupConsents";

type Step = "type" | "consent" | "info" | "done";

const ROLE_OPTIONS: { value: MemberRole; title: string; description: string; Icon: typeof UsersIcon }[] = [
  { value: "student", title: "학생으로 가입", description: "책을 읽고 여울이와 함께 자라요", Icon: GraduationCapIcon },
  { value: "guardian", title: "보호자로 가입", description: "우리 아이의 독서 여정을 함께 지켜봐요", Icon: UsersIcon },
];

const INFO_HEADINGS: Record<MemberRole, { title: string; subtitle: string }> = {
  student: { title: "학생 회원가입", subtitle: "여울이와 함께할 정보를 알려주세요" },
  guardian: { title: "보호자 회원가입", subtitle: "아이의 독서 여정을 함께 지켜봐요" },
};

const primaryButtonClassName =
  "flex h-[56px] w-full cursor-pointer items-center justify-center rounded-full bg-[#E87B3D] text-[17px] font-medium text-white shadow-[0_6px_14px_rgba(90,62,46,0.18)] transition hover:brightness-105 active:scale-[0.99]";

export default function SignupFlow() {
  const [step, setStep] = useState<Step>("type");
  const [role, setRole] = useState<MemberRole>("student");
  const [member, setMember] = useState<Member | null>(null);
  // 정보 입력에서 뒤로 와도 체크한 항목이 남도록 여기서 들고 있는다. 가입 유형을 바꾸면 항목이 달라지므로 비운다.
  const [agreedIds, setAgreedIds] = useState<string[]>([]);

  return (
    <main className="relative min-h-screen flex-1 overflow-hidden bg-[#F7EEE3] bg-[linear-gradient(90deg,#F6E6D2_0%,#FBF6F0_100%)] lg:h-screen">
      <DesignStage
        fit="contain"
        fallbackClassName="relative flex min-h-screen items-center justify-center px-4 pt-28 pb-10"
      >
        <Link href="/" aria-label="여울 로그인으로" className="absolute top-4 left-4 flex items-start lg:top-[32px] lg:left-[92px]">
          <Image src="/auth/yeoul-wordmark.svg" alt="Yeoul" width={71} height={25} className="mt-[20px]" />
          <Image src="/auth/yeoul-cat.png" alt="" width={54} height={54} className="ml-px" />
        </Link>

        <div className="lg:absolute lg:inset-0 lg:flex lg:items-center lg:justify-center">
          <div className="w-[537px] max-w-full rounded-[24px] border border-white/90 bg-white/[0.88] px-[51px] py-[37px] shadow-[0_20px_50px_rgba(140,106,79,0.12)] backdrop-blur-[12px] max-sm:px-6">
            {step === "type" && (
              <TypeStep
                role={role}
                onRoleChange={(next) => {
                  if (next !== role) setAgreedIds([]);
                  setRole(next);
                }}
                onNext={() => setStep("consent")}
              />
            )}
            {step === "consent" && (
              <ConsentStep
                role={role}
                agreedIds={agreedIds}
                onAgreedChange={setAgreedIds}
                onBack={() => setStep("type")}
                onNext={() => setStep("info")}
              />
            )}
            {step === "info" && (
              <InfoStep
                role={role}
                onBack={() => setStep("consent")}
                onComplete={(registered) => {
                  setMember(registered);
                  setStep("done");
                }}
              />
            )}
            {step === "done" && member && <DoneStep member={member} />}
          </div>
        </div>
      </DesignStage>
    </main>
  );
}

type StepHeaderProps = {
  back?: ReactNode;
  title: string;
  subtitle: string;
  current: number;
};

function StepHeader({ back, title, subtitle, current }: StepHeaderProps) {
  return (
    <header className="flex flex-col items-center">
      <div className="h-5 self-start">{back}</div>
      <h1 className="mt-[10px] font-display text-[34px] leading-[38px] text-[#8B6650]">{title}</h1>
      <p className="mt-[12px] text-center font-pen text-[25px] leading-[32px] break-keep text-[#6B5446]">{subtitle}</p>
      <div className="mt-[18px]">
        <SignupStepper current={current} />
      </div>
    </header>
  );
}

const backClassName = "flex items-center gap-[12px] text-[14px] font-medium text-[#7A5A45] hover:text-[#5A4032]";

function TypeStep({
  role,
  onRoleChange,
  onNext,
}: {
  role: MemberRole;
  onRoleChange: (role: MemberRole) => void;
  onNext: () => void;
}) {
  return (
    <>
      <StepHeader
        back={
          <Link href="/" className={backClassName}>
            <ChevronLeftIcon className="size-[14px] text-[#8B6650]" />
            로그인으로 돌아가기
          </Link>
        }
        title="회원가입"
        subtitle="어떤 분으로 가입하시나요?"
        current={0}
      />

      <div role="radiogroup" aria-label="가입 유형" className="mt-[26px] flex flex-col gap-[16px]">
        {ROLE_OPTIONS.map(({ value, title, description, Icon }) => {
          const selected = role === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onRoleChange(value)}
              className={`flex h-[94px] cursor-pointer items-center rounded-[15px] px-[20px] text-left transition ${
                selected ? "border-2 border-[#8B6650] bg-[#FBF4EC]" : "border border-[#EAE4DD] bg-[#F5F2EE] hover:border-[#C9BFB4]"
              }`}
            >
              <span
                className={`flex size-[52px] shrink-0 items-center justify-center rounded-full ${
                  selected ? "bg-[#F3DFC9] text-[#8B6650]" : "bg-[#E9E4DE] text-[#7A5A45]"
                }`}
              >
                <Icon className="size-[22px]" />
              </span>
              <span className="ml-[16px] flex min-w-0 flex-1 flex-col gap-[3px]">
                <span className="text-[17px] font-bold text-[#5A4032]">{title}</span>
                <span className="text-[13px] text-[#8A7F76]">{description}</span>
              </span>
              <span
                aria-hidden
                className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
                  selected ? "bg-[#8B6650]" : "border-[1.5px] border-[#C9BFB4] bg-white"
                }`}
              >
                {selected && <span className="size-[9px] rounded-full bg-white" />}
              </span>
            </button>
          );
        })}
      </div>

      <button type="button" onClick={onNext} className={`mt-[26px] ${primaryButtonClassName}`}>
        다음
      </button>

      <p className="mt-[25px] flex justify-center gap-[6px] text-[13px] leading-[20px] text-[#8A7F76]">
        이미 계정이 있나요?
        <Link href="/" className="font-bold text-[#8B6650] hover:underline">
          로그인
        </Link>
      </p>
    </>
  );
}

function ConsentStep({
  role,
  agreedIds,
  onAgreedChange,
  onBack,
  onNext,
}: {
  role: MemberRole;
  agreedIds: string[];
  onAgreedChange: (ids: string[]) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const { title, subtitle, allLabel, submitLabel, errorText, items } = CONSENT_SCREENS[role];
  const [openDetail, setOpenDetail] = useState<ConsentDetail | null>(null);
  const [showError, setShowError] = useState(false);
  const allAgreed = items.every((item) => agreedIds.includes(item.id));

  function toggle(id: string, checked: boolean) {
    onAgreedChange(checked ? [...agreedIds, id] : agreedIds.filter((agreedId) => agreedId !== id));
    setShowError(false);
  }

  function handleSubmit() {
    // 모든 항목이 필수라서 전부 체크해야 넘어간다.
    if (!allAgreed) {
      setShowError(true);
      return;
    }
    onNext();
  }

  return (
    <>
      <StepHeader
        back={
          <button type="button" onClick={onBack} className={`cursor-pointer ${backClassName}`}>
            <ChevronLeftIcon className="size-[14px] text-[#8B6650]" />
            가입 유형 다시 선택
          </button>
        }
        title={title}
        subtitle={subtitle}
        current={1}
      />

      <div className="mt-[24px] flex flex-col">
        {allLabel && (
          <CheckboxField
            checked={allAgreed}
            onChange={(checked) => {
              onAgreedChange(checked ? items.map((item) => item.id) : []);
              setShowError(false);
            }}
            className="mb-[14px] rounded-[12px] bg-[#FBF4EC] px-[16px] py-[14px] text-[15px] font-bold text-[#5A4032]"
          >
            {allLabel}
          </CheckboxField>
        )}
        <ul className="flex flex-col gap-[14px]">
          {items.map((item) => (
            <li key={item.id} className="flex flex-col">
              <CheckboxField checked={agreedIds.includes(item.id)} onChange={(checked) => toggle(item.id, checked)} className="px-[16px]">
                <span className="flex flex-col gap-[2px]">
                  <span className="font-bold break-keep text-[#5A4032]">{item.label}</span>
                  <span className="text-[12px] leading-[18px] break-keep text-[#8A7F76]">{item.description}</span>
                </span>
              </CheckboxField>
              <button
                type="button"
                onClick={() => setOpenDetail(item.detail)}
                className="mt-[2px] ml-[46px] cursor-pointer self-start text-[12px] font-medium text-[#8B6650] hover:underline"
              >
                자세히 보기 &gt;
              </button>
            </li>
          ))}
        </ul>
        {showError && (
          <p role="alert" className="mt-[12px] text-center text-[12px] text-[#D0582A]">
            {errorText}
          </p>
        )}
      </div>

      <button type="button" onClick={handleSubmit} className={`mt-[22px] ${primaryButtonClassName}`}>
        {submitLabel}
      </button>

      <ConsentDetailModal detail={openDetail} onClose={() => setOpenDetail(null)} />
    </>
  );
}

const MIN_AGE = 3;
const MAX_AGE = 19;

type InfoErrors = Partial<Record<"name" | "age" | "loginId" | "password" | "passwordConfirm" | "studentCode", string>>;

function InfoStep({
  role,
  onBack,
  onComplete,
}: {
  role: MemberRole;
  onBack: () => void;
  onComplete: (member: Member) => void;
}) {
  const isGuardian = role === "guardian";
  const [form, setForm] = useState({ name: "", age: "", loginId: "", password: "", passwordConfirm: "", studentCode: "" });
  const [checkedLoginId, setCheckedLoginId] = useState<string | null>(null);
  const [errors, setErrors] = useState<InfoErrors>({});

  const update = (key: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const loginIdVerified = checkedLoginId !== null && checkedLoginId === form.loginId.trim();

  function handleCheckLoginId() {
    const loginId = form.loginId.trim();
    if (!loginId) {
      setErrors((prev) => ({ ...prev, loginId: "아이디를 입력해 주세요" }));
      return;
    }
    // TODO: 중복확인 API 연동. 지금은 입력값을 사용 가능한 아이디로 간주한다.
    setCheckedLoginId(loginId);
    setErrors((prev) => ({ ...prev, loginId: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: InfoErrors = {};
    if (!form.name.trim()) next.name = "이름을 입력해 주세요";
    const age = Number(form.age);
    if (!isGuardian && (!form.age || !Number.isInteger(age) || age < MIN_AGE || age > MAX_AGE)) {
      next.age = `${MIN_AGE}~${MAX_AGE}살로 입력`;
    }
    if (!form.loginId.trim()) next.loginId = "아이디를 입력해 주세요";
    else if (!loginIdVerified) next.loginId = "아이디 중복확인을 해 주세요";
    if (form.password.length < 8) next.password = "비밀번호는 8자 이상이어야 해요";
    if (form.passwordConfirm !== form.password || !form.passwordConfirm) next.passwordConfirm = "비밀번호가 일치하지 않아요";
    if (isGuardian && !form.studentCode.trim()) next.studentCode = "학생 연결 코드를 입력해 주세요";

    setErrors(next);
    if (Object.keys(next).length > 0) return;
    // TODO: 회원가입 API 연동 (role, form, 동의 단계에서 체크한 항목과 동의 시각)
    onComplete(
      registerMember({
        loginId: form.loginId.trim(),
        name: form.name.trim(),
        role,
        age: isGuardian ? undefined : age,
        studentCode: isGuardian ? form.studentCode.trim().toUpperCase() : undefined,
      })
    );
  }

  const error = (key: keyof InfoErrors) => (errors[key] ? { text: errors[key], tone: "error" as const } : null);
  const loginIdMessage =
    error("loginId") ?? (loginIdVerified ? { text: "사용할 수 있는 아이디예요", tone: "success" as const } : null);
  const { title, subtitle } = INFO_HEADINGS[role];

  return (
    <>
      <StepHeader
        back={
          <button type="button" onClick={onBack} className={`cursor-pointer ${backClassName}`}>
            <ChevronLeftIcon className="size-[14px] text-[#8B6650]" />
            동의 화면으로 돌아가기
          </button>
        }
        title={title}
        subtitle={subtitle}
        current={2}
      />

      <form onSubmit={handleSubmit} noValidate className="mt-[26px] flex flex-col">
        {/* 학생은 이름 옆에 나이를 함께 받는다 (카드 높이를 늘리지 않도록 한 줄에 배치) */}
        <div className="flex gap-[10px]">
          <TextField
            className="min-w-0 flex-1"
            label="이름"
            name="name"
            autoComplete="name"
            placeholder="이름을 입력해 주세요"
            value={form.name}
            onChange={update("name")}
            message={error("name")}
          />
          {!isGuardian && (
            <TextField
              className="w-[120px] shrink-0"
              label="나이"
              name="age"
              type="number"
              inputMode="numeric"
              min={MIN_AGE}
              max={MAX_AGE}
              placeholder="예: 9"
              value={form.age}
              onChange={(event) => setForm((prev) => ({ ...prev, age: event.target.value.replace(/D/g, "").slice(0, 2) }))}
              message={error("age")}
            />
          )}
        </div>
        <TextField
          className="mt-[10px]"
          label="아이디"
          name="loginId"
          autoComplete="username"
          placeholder="아이디를 입력해 주세요"
          value={form.loginId}
          onChange={update("loginId")}
          message={loginIdMessage}
          trailing={
            <button
              type="button"
              onClick={handleCheckLoginId}
              className="h-[50px] w-[90px] shrink-0 cursor-pointer rounded-[12px] border-[1.2px] border-[#D9CFC4] text-[14px] font-medium text-[#7A5A45] transition hover:bg-[#FBF4EC]"
            >
              중복확인
            </button>
          }
        />
        <TextField
          className="mt-[10px]"
          label="비밀번호"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="8자 이상 입력해 주세요"
          value={form.password}
          onChange={update("password")}
          message={error("password")}
        />
        <TextField
          className="mt-[10px]"
          label="비밀번호 확인"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          placeholder="비밀번호를 한 번 더 입력해 주세요"
          value={form.passwordConfirm}
          onChange={update("passwordConfirm")}
          message={error("passwordConfirm")}
        />

        {isGuardian && (
          <TextField
            className="mt-[24px]"
            label="학생 연결 코드"
            name="studentCode"
            placeholder="학생 코드를 입력해 주세요"
            value={form.studentCode}
            onChange={update("studentCode")}
            message={error("studentCode")}
          />
        )}

        <button type="submit" className={`mt-[26px] ${primaryButtonClassName}`}>
          가입하기
        </button>
      </form>
    </>
  );
}

function DoneStep({ member }: { member: Member }) {
  return (
    <>
      <StepHeader title="가입 완료" subtitle="여울이가 기다리고 있어요" current={3} />
      <div className="mt-[26px] flex flex-col items-center gap-[10px] text-center">
        <Image src="/auth/yeoul-cat.png" alt="" width={96} height={96} />
        <p className="text-[17px] font-bold text-[#5A4032]">{member.name}님, 여울에 오신 걸 환영해요!</p>
        <p className="text-[13px] text-[#8A7F76]">이제 로그인하고 여울이와 함께 책을 읽어 볼까요?</p>
        {member.role === "student" && member.studentCode && (
          <p className="mt-[6px] rounded-[12px] bg-[#FBF4EC] px-[18px] py-[10px] text-[13px] text-[#6B5446]">
            내 학생 코드 <strong className="ml-1 text-[17px] tracking-[0.2em] text-[#5A4032]">{member.studentCode}</strong>
            <span className="mt-[2px] block text-[12px] text-[#8A7F76]">보호자가 가입할 때 입력하면 연결돼요 (설정에서 다시 볼 수 있어요)</span>
          </p>
        )}
      </div>
      <Link href="/" className={`mt-[26px] ${primaryButtonClassName}`}>
        로그인하러 가기
      </Link>
    </>
  );
}
