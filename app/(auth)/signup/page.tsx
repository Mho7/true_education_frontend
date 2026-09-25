import type { Metadata } from "next";
import SignupFlow from "@/components/auth/SignupFlow";

export const metadata: Metadata = {
  title: "회원가입 | 여울",
};

export default function SignupPage() {
  return <SignupFlow />;
}
