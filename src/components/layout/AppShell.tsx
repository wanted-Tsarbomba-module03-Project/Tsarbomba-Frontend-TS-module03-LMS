"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import OneButtonModal from "../common/OneButtonModal";
import { mobileSidebarClasses } from "@/components/layout/mobileSidebarClasses";
import ActiveInquiryRepliesModal from "@/features/inquiries/components/ActiveInquiryRepliesModal";

const subscribeToUserRole = (callback: () => void) => {
  window.addEventListener("loginSuccess", callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener("loginSuccess", callback);
    window.removeEventListener("storage", callback);
  };
};

const getStoredUserRole = () => localStorage.getItem("userRole") || "";
const getServerUserRole = () => "";
const getStoredLogin = () =>
  localStorage.getItem("userNickname") ? "1" : "";
const getServerLogin = () => "";
const subscribeToHydration = () => () => {};
const getHydratedSnapshot = () => true;
const getServerHydratedSnapshot = () => false;

/**
 * 앱 클라이언트 셸 — 경로 기반 레이아웃 분기, 사이드바 토글, 역할 라우팅,
 * 접근 권한 모달 등 상호작용(클라이언트) 로직을 담당한다.
 *
 * 루트 레이아웃(`src/app/layout.tsx`)은 이 컴포넌트를 감싸는 서버 컴포넌트로,
 * `<html>`/`<body>`와 metadata/viewport export 만 책임진다. (App Router 정석)
 */
export default function AppShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const userRole = useSyncExternalStore(
    subscribeToUserRole,
    getStoredUserRole,
    getServerUserRole,
  );
  const isMount = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydratedSnapshot,
  );
  // 로그인 여부(localStorage 닉네임 기준) — 답변 알림 모달 노출 조건에 사용.
  const isLoggedIn = !!useSyncExternalStore(
    subscribeToUserRole,
    getStoredLogin,
    getServerLogin,
  );

  useEffect(() => {
    if (pathname !== "/") return;

    if (userRole === "MASTER" || userRole === "ADMIN") {
      router.replace("/admin/security");
    } else if (userRole === "OPERATOR") {
      router.replace("/admin/courses");
    }
  }, [pathname, router, userRole]);

  const canAccessAdmin =
    userRole === "MASTER" || userRole === "ADMIN" || userRole === "OPERATOR";

  /* 1. 현재 페이지 경로 체크 패턴 정의 */
  const isAuthPath =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/auth");
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const isMasterAdminPath =
    pathname === "/admin/master" || pathname.startsWith("/admin/master/");
  const isMypagePath = pathname.startsWith("/user/profile");
  const isProblemPath =
    pathname.startsWith("/problems") ||
    pathname.startsWith("/user/problems") ||
    pathname.startsWith("/user/problem") ||
    /^\/courses\/[^/]+\/problems\//.test(pathname);
  const isChatPath =
    pathname.startsWith("/chat") || pathname.startsWith("/user/chat");
  // 홈(강좌 목록): 카테고리바가 콘텐츠 상단에 붙으므로 main 위쪽 여백을 없앤다.
  const isHome = pathname === "/";

  // 챗 화면은 스크롤바를 숨긴다. 서버 레이아웃의 <html>/<body>는 정적이므로
  // 경로 의존 클래스는 이 클라이언트 셸에서 문서 루트에 토글한다. (기존 동작 보존)
  useEffect(() => {
    const cls = "scrollbar-invisible";
    const root = document.documentElement;
    const { body } = document;
    root.classList.toggle(cls, isChatPath);
    body.classList.toggle(cls, isChatPath);
    return () => {
      root.classList.remove(cls);
      body.classList.remove(cls);
    };
  }, [isChatPath]);

  const canAccessCurrentAdmin =
    canAccessAdmin && (!isMasterAdminPath || userRole === "MASTER");
  const showAdminAuthModal = isMount && isAdminPath && !canAccessCurrentAdmin;

  const handleAccessDeniedClose = () => {
    router.replace("/");
  };

  /* 2. 로그인 / 회원가입 등 정중앙 배치 구역 */
  if (isAuthPath) {
    return (
      <div className="flex flex-col min-h-screen w-full bg-white">
        <Header isSimple={true} />
        <div className="flex flex-1 justify-center items-center w-full max-w-300 mx-auto px-5 py-10 box-border">
          {children}
        </div>
      </div>
    );
  }

  /* 3. 통합 레이아웃 바디 및 분기 처리 구역 */
  const isFlexBodySection = isMypagePath || isAdminPath || isChatPath;

  return (
    <>
      <div className="flex flex-col min-h-screen w-full bg-white">
        <Header />

        {isFlexBodySection ? (
          <div className="flex flex-1 w-full max-w-300 mx-auto relative box-border gap-5 max-[1024px]:px-5">
            {(isMypagePath ||
              isChatPath ||
              (isAdminPath && canAccessCurrentAdmin)) && (
              <Sidebar isOpen={isOpen} />
            )}

            {(isMypagePath ||
              isChatPath ||
              (isAdminPath && canAccessCurrentAdmin)) && (
                <button
                  aria-label={isOpen ? "사이드바 닫기" : "사이드바 열기"}
                  aria-pressed={isOpen}
                  className={mobileSidebarClasses.toggleButton}
                  onClick={() => setIsOpen((prev) => !prev)}
                  type="button"
                >
                  <Image
                    alt=""
                    className={mobileSidebarClasses.toggleIcon}
                  height={56}
                  src="/assets/img/sidebar.svg"
                  width={56}
                />
              </button>
            )}

            {isOpen &&
              (isMypagePath ||
                isChatPath ||
                (isAdminPath && canAccessCurrentAdmin)) && (
                <button
                  aria-label="사이드바 닫기"
                  className={mobileSidebarClasses.backdrop}
                  onClick={() => setIsOpen(false)}
                  type="button"
                />
              )}

            <main className="flex-1 min-w-0 py-10">
              {isAdminPath
                ? canAccessCurrentAdmin
                  ? children
                  : null
                : children}
            </main>
          </div>
        ) : (
          <main
            className={`flex-1 w-full max-w-300 mx-auto box-border ${
              isProblemPath
                ? "py-0"
                : isHome
                  ? "px-5 pb-10"
                  : "px-5 py-10"
            }`}
          >
            {children}
          </main>
        )}

        <Footer />
      </div>

      <OneButtonModal
        isOpen={showAdminAuthModal}
        onClose={handleAccessDeniedClose}
        modalTitle="입력 확인"
        modalContent="접근 권한이 없습니다."
      />
      <ActiveInquiryRepliesModal
        enabled={isMount && isLoggedIn && !isAuthPath && !isAdminPath}
      />
    </>
  );
}
