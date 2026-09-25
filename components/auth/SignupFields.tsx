import type { InputHTMLAttributes, ReactNode } from "react";
import { CheckIcon } from "@/components/auth/icons";

export const inputClassName =
  "h-[50px] w-full min-w-0 rounded-[12px] bg-[#EFEBE6] px-[18px] text-[15px] text-[#5A4032] outline-none placeholder:text-[#8F8983] focus:ring-2 focus:ring-[#8B6650]/40";

type FieldMessage = { text: string; tone: "error" | "success" };

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  message?: FieldMessage | null;
  /** 입력칸 오른쪽에 붙는 버튼 (예: 중복확인) */
  trailing?: ReactNode;
  className?: string;
};

export function TextField({ label, message, trailing, className = "", id, ...inputProps }: TextFieldProps) {
  const inputId = id ?? inputProps.name;
  return (
    <div className={className}>
      <label htmlFor={inputId} className="block text-[14px] leading-[20px] font-medium text-[#6B5446]">
        {label}
      </label>
      <div className="mt-[6px] flex gap-[10px]">
        <input id={inputId} aria-invalid={message?.tone === "error"} className={inputClassName} {...inputProps} />
        {trailing}
      </div>
      {message && (
        <p
          role={message.tone === "error" ? "alert" : "status"}
          className={`mt-[6px] text-[12px] ${message.tone === "error" ? "text-[#D0582A]" : "text-[#5E8A40]"}`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}

type CheckboxFieldProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
};

export function CheckboxField({ checked, onChange, children }: CheckboxFieldProps) {
  return (
    <label className="flex cursor-pointer items-center gap-[10px] text-[14px] text-[#6B5446]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={`flex size-5 shrink-0 items-center justify-center rounded-[6px] peer-focus-visible:ring-2 peer-focus-visible:ring-[#8B6650]/40 ${
          checked ? "bg-[#8B6650] text-white" : "border-[1.5px] border-[#C9BFB4] bg-white"
        }`}
      >
        {checked && <CheckIcon className="size-5" />}
      </span>
      {children}
    </label>
  );
}
