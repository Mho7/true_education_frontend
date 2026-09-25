import type { Metadata } from "next";
import Image from "next/image";
import DesignStage from "@/components/DesignStage";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "로그인 | 여울",
};

export default function LoginPage() {
  return (
    <main className="relative isolate min-h-screen flex-1 overflow-hidden lg:h-screen">
      {/* 배경 원본이 시안 프레임(1536×967)과 같은 비율이라 cover 스테이지와 정확히 겹친다. */}
      <Image src="/auth/login-bg.png" alt="" fill preload sizes="100vw" className="-z-10 object-cover" />

      {/* 카드(959~1496, 100~776)가 어떤 화면비에서도 잘리지 않도록 여백 포함 영역을 지정한다. */}
      <DesignStage
        fit="cover"
        safeArea={{ width: 1504, height: 815 }}
        fallbackClassName="flex min-h-screen items-center justify-center px-4 py-10"
      >
        <Image
          src="/auth/login-hero.svg"
          alt="책과 한 걸음 - 여울이와 함께 읽고, 생각하고, 자라는 시간"
          width={369}
          height={186}
          className="absolute top-[182px] left-[199px] hidden lg:block"
        />
        <div className="w-[537px] max-w-full lg:absolute lg:top-[100px] lg:left-[959px]">
          <LoginForm />
        </div>
      </DesignStage>
    </main>
  );
}
