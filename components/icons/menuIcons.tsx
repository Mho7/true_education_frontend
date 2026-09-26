// 홈 ☰ 메뉴와 사이드바가 함께 쓰는 메뉴 아이콘. 24×24 선 아이콘이고 색은 currentColor를 따른다.

type IconProps = { className?: string; strokeWidth?: number };

function MenuIcon({ className, strokeWidth = 1.8, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <MenuIcon {...props}>
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </MenuIcon>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <MenuIcon {...props}>
      <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
      <path d="m15 5 4 4" />
    </MenuIcon>
  );
}

export function LibraryIcon(props: IconProps) {
  return (
    <MenuIcon {...props}>
      {/* 펼친 책 */}
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </MenuIcon>
  );
}

export function StampIcon(props: IconProps) {
  return (
    <MenuIcon {...props}>
      {/* 속이 빈 발자국: 둥글둥글한 발바닥 + 동그란 발가락 4개 */}
      <path d="M12 12.8c3.2 0 6.2 2.9 6.2 5.3 0 1.9-1.5 2.9-3.1 2.9-1.2 0-2-.5-3.1-.5s-1.9.5-3.1.5c-1.6 0-3.1-1-3.1-2.9 0-2.4 3-5.3 6.2-5.3Z" />
      <circle cx="4.6" cy="10.4" r="1.7" />
      <circle cx="8.8" cy="6.2" r="1.9" />
      <circle cx="15.2" cy="6.2" r="1.9" />
      <circle cx="19.4" cy="10.4" r="1.7" />
    </MenuIcon>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <MenuIcon {...props}>
      <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
      <circle cx="12" cy="12" r="3" />
    </MenuIcon>
  );
}
