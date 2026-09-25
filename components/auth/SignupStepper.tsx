import { Fragment } from "react";
import { CheckIcon } from "@/components/auth/icons";

const STEPS = ["유형 선택", "정보 입력", "가입 완료"];

type SignupStepperProps = {
  /** 0부터 시작하는 현재 단계 */
  current: number;
};

export default function SignupStepper({ current }: SignupStepperProps) {
  return (
    <ol className="flex items-center justify-center gap-[10px]" aria-label="회원가입 단계">
      {STEPS.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <Fragment key={label}>
            {index > 0 && (
              <li aria-hidden className={`h-[1.5px] w-[26px] ${index <= current ? "bg-[#B89A84]" : "bg-[#DCD4CB]"}`} />
            )}
            <li
              aria-current={active ? "step" : undefined}
              className="flex w-[79px] items-center gap-[6px] text-[13px] whitespace-nowrap"
            >
              <span
                className={`flex size-[22px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  done || active ? "bg-[#8B6650] text-white" : "bg-[#E6E0D9] text-[#9A918A]"
                }`}
              >
                {done ? <CheckIcon className="size-5" /> : index + 1}
              </span>
              <span className={active ? "font-bold text-[#5A4032]" : "text-[#9A918A]"}>{label}</span>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
