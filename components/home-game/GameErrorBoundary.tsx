"use client";

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export default class GameErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error("[HomeGame] 3D 홈 화면 로딩 중 오류가 발생했습니다:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-amber-50 px-6 text-center text-sm text-amber-700">
          3D 홈 화면을 불러오지 못했습니다. 브라우저 콘솔 로그를 확인해주세요.
        </div>
      );
    }
    return this.props.children;
  }
}
