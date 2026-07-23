"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import Footer from "../components/layout/Footer";
import OneButtonModal from "../components/common/OneButtonModal";
import { mobileSidebarClasses } from "@/components/layout/mobileSidebarClasses";
import ActiveInquiryRepliesModal from "@/features/inquiries/components/ActiveInquiryRepliesModal";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "./globals.css";

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

export default function RootLayout({
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
  // 로그인 여부(localStorage 닉네임 기준) — 비로그인 사용자의 보호 경로 접근 리다이렉트에 사용.
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

  // 비로그인 접근 허용 경로 — 설명(홈 랜딩) + 인증/오류 페이지만 공개.
  // 그 외(강좌 목록·상세, 강의, 문제, 마이페이지 등)는 로그인 필요.
  const isPublicPath =
    isHome ||
    isAuthPath ||
    pathname.startsWith("/oauth2") ||
    pathname === "/error-page";

  // 강좌/강의 경로는 페이지 자체 모달 가드(로그인·수강 안내)가 처리하므로
  // 중앙 리다이렉트에서 제외한다 — 즉시 리다이렉트가 모달을 가로채지 않도록.
  const isCourseFlowPath = pathname.startsWith("/courses");

  // 비로그인 사용자는 공개 경로 외 접근 시 로그인 페이지로 유도.
  // (hydration 완료(isMount) 후 localStorage 기준으로 판정 → SSR 오판·깜빡임 방지)
  useEffect(() => {
    if (!isMount || isLoggedIn || isPublicPath || isCourseFlowPath) return;
    router.replace("/auth/login");
  }, [isMount, isLoggedIn, isPublicPath, isCourseFlowPath, router]);

  const canAccessCurrentAdmin =
    canAccessAdmin && (!isMasterAdminPath || userRole === "MASTER");
  const showAdminAuthModal = isMount && isAdminPath && !canAccessCurrentAdmin;

  const handleAccessDeniedClose = () => {
    router.replace("/");
  };

  /* 2. 로그인 / 회원가입 등 정중앙 배치 구역 */
  if (isAuthPath) {
    return (
      <html lang="ko">
        <body className="bg-white min-h-screen m-0 p-0 antialiased flex flex-col">
          <div className="flex flex-col min-h-screen w-full bg-white">
            <Header isSimple={true} />
            <div className="flex flex-1 justify-center items-center w-full max-w-300 mx-auto px-5 py-10 box-border">
              {children}
            </div>
          </div>
        </body>
      </html>
    );
  }

  /* 3. 통합 레이아웃 바디 및 분기 처리 구역 */
  const isFlexBodySection = isMypagePath || isAdminPath || isChatPath;

  return (
    <html className={isChatPath ? "scrollbar-invisible" : undefined} lang="ko">
      <body
        className={`bg-white min-h-screen m-0 p-0 antialiased flex flex-col ${
          isChatPath ? "scrollbar-invisible" : ""
        }`}
      >
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
      </body>
    </html>
  );
}
