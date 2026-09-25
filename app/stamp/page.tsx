import type { Metadata } from "next";
import StampScreen from "@/components/stamp/StampScreen";

export const metadata: Metadata = {
  title: "나의 스탬프 | 여울",
};

export default function StampPage() {
  return <StampScreen />;
}
