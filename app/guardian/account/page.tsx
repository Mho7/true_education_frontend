import type { Metadata } from "next";
import GuardianAccount from "@/components/guardian/GuardianAccount";

export const metadata: Metadata = {
  title: "계정 관리 | 여울",
};

export default function GuardianAccountPage() {
  return <GuardianAccount />;
}
