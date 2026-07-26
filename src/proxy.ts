import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 서버측 인증 가드 (Proxy — Next.js 16 미들웨어 규칙)
 *
 * 렌더 이전에 서버에서 실행되므로, 비로그인 사용자가 보호 경로에 접근하면
 * 페이지가 그려지기 전에 로그인 페이지로 리다이렉트한다 → 클라 hydration 후
 * 판정하던 기존 방식의 깜빡임(FOUC)이 사라진다.
 *
 * 판정 기준은 BE가 로그인 시 발급하는 httpOnly 쿠키의 "존재 여부"다.
 * (쿠키는 앱과 동일 오리진의 /api 로 붙으므로 프록시가 읽을 수 있다.)
 *
 * ⚠️ 역할(MASTER/ADMIN/OPERATOR) 기반 라우팅은 여기서 하지 않는다.
 *    role 은 쿠키에 없고 localStorage 에만 있어 프록시가 알 수 없다.
 *    → 역할 분기는 /me 서버 조회로 분리하는 후속 작업에서 처리(layout.tsx 유지).
 *
 * ℹ️ Next.js 16 부터 `middleware.ts` 규칙이 `proxy.ts` 로 대체되었다.
 *    (export 함수명도 middleware → proxy)
 */

// BE 가 로그인 시 발급하는 httpOnly 인증 쿠키 이름 (API.md §1: accessToken/refreshToken).
// ⚠️ 실제 Set-Cookie 이름과 일치해야 가드가 동작한다. 하나라도 있으면 로그인으로 간주.
const AUTH_COOKIE_NAMES = ["accessToken", "refreshToken"] as const;

// 비로그인 접근을 허용하는 공개 경로 (layout.tsx 의 isPublicPath 규칙과 동일하게 유지).
const isPublicPath = (pathname: string): boolean => {
  // 홈(랜딩) · 오류 페이지
  if (pathname === "/" || pathname === "/error-page") return true;
  // 인증/가입/소셜 콜백
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/oauth2")
  ) {
    return true;
  }
  // 강좌/강의 경로는 페이지 자체 모달 가드(로그인·수강 안내)가 처리 → 서버 리다이렉트 제외
  if (pathname.startsWith("/courses")) return true;
  return false;
};

const hasAuthCookie = (request: NextRequest): boolean =>
  AUTH_COOKIE_NAMES.some((name) => Boolean(request.cookies.get(name)?.value));

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 공개 경로거나 인증 쿠키가 있으면 통과.
  if (isPublicPath(pathname) || hasAuthCookie(request)) {
    return NextResponse.next();
  }

  // 미인증 사용자의 보호 경로 접근 → 렌더 전에 로그인 페이지로.
  // request.url 은 ALB/프록시 뒤에서 내부 오리진을 담을 수 있으므로, 사용자 오리진을
  // 보존하는 nextUrl.clone() 으로 리다이렉트 대상을 만든다.
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/auth/login";
  loginUrl.search = "";
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // API 프록시 · Next 내부 리소스 · 정적 파일(파비콘/assets 등)은 가드 대상에서 제외.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|assets|.*\\..*).*)"],
};
