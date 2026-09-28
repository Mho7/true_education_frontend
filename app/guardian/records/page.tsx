import type { Metadata } from "next";
import GuardianRecords from "@/components/guardian/GuardianRecords";

export const metadata: Metadata = {
  title: "학습 기록 | 여울",
};

export default function GuardianRecordsPage() {
  return <GuardianRecords />;
}
