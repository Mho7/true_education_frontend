import StudyEntryGuard from "@/components/study/StudyEntryGuard";

// 학습 지도·단계·그리기 화면을 모두 감싼다. 오늘 학습을 이미 끝냈으면 주소로 바로 들어와도 홈으로 돌려보낸다.
export default function StudyLayout({ children }: LayoutProps<"/study">) {
  return <StudyEntryGuard>{children}</StudyEntryGuard>;
}
