import type { Metadata } from "next";
import LibraryScreen from "@/components/library/LibraryScreen";

export const metadata: Metadata = {
  title: "내 책장 | 여울",
};

export default function LibraryPage() {
  return <LibraryScreen />;
}
