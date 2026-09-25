import type { Metadata } from "next";
import DrawingSession from "@/components/study/drawing/DrawingSession";

export const metadata: Metadata = {
  title: "그림 그리기 | 여울",
};

// 책 표지 그림 그리기. /study 아래에 있어서 사이드바의 "학습"이 칠해진다.
export default function DrawingPage() {
  return <DrawingSession />;
}
