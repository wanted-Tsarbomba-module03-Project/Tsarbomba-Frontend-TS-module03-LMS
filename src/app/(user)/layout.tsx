import type { ReactNode } from "react";

// 전역 metadata 는 루트 레이아웃(src/app/layout.tsx)으로 이전됨.
// 이 그룹 레이아웃은 라우트 그룹 경계만 형성한다.
export default function UserLayout({ children }: { children: ReactNode }) {
  return children;
}
