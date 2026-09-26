import type { Metadata } from "next";
import GuardianRewards from "@/components/guardian/GuardianRewards";

export const metadata: Metadata = {
  title: "리워드 설정 | 여울",
};

export default function GuardianRewardsPage() {
  return <GuardianRewards />;
}
