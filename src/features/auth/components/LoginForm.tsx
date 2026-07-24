"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getGoogleAuthUrl, login } from "@/features/auth/actions";
import type { LoginResponseData } from "@/features/auth/types";
import OneButtonModal from "@/components/common/OneButtonModal";
import PasswordInput from "@/components/common/PasswordInput";

// 구글 콜백 실패 시 BE 가 /auth/login?error=CODE 로 리다이렉트
const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  "AUT-022":
    "이미 이메일로 가입된 계정이에요.\n이메일과 비밀번호로 로그인해 주세요.",
};

const getOauthErrorMessage = (code: string): string =>
  OAUTH_ERROR_MESSAGES[code] ??
  "구글 로그인 중 문제가 발생했어요.\n잠시 후 다시 시도해 주세요.";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  // 모달 닫을 때 이동할 경로 — role 에 따라 분기
  const [successRedirect, setSuccessRedirect] = useState("/");
  // 구글 콜백 에러(?error=) 안내 모달
  const [oauthErrorMsg, setOauthErrorMsg] = useState("");

  // 구글 로그인 실패로 ?error=CODE 가 붙어 돌아오면 모달로 안내하고 URL 에서 파라미터 제거.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("error");
    if (!code) return;
    setOauthErrorMsg(getOauthErrorMessage(code));
    params.delete("error");
    const qs = params.toString();
    window.history.replaceState({}, "", `/auth/login${qs ? `?${qs}` : ""}`);
  }, []);

  // 구글 로그인 — BE 가 준 동의 URL 로 이동 (BE 콜백이 신규/기존 분기 처리)
  const handleGoogleLogin = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    setErrorMsg("");
    try {
      const url = await getGoogleAuthUrl();
      // 기존 회원 재로그인은 BE 가 쿠키만 발급하고 홈으로 302 → localStorage 를 채울 타이밍이 없음.
      // 콜백 복귀 후 헤더가 프로필을 1회 조회하도록 플래그를 남긴다 (신규 가입은 완료 폼에서 직접 세팅).
      sessionStorage.setItem("oauthLoginPending", "1");
      window.location.href = url;
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "구글 로그인 시작 중 오류가 발생했습니다.",
      );
      setGoogleLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const normalizedEmail = email.trim();

    if (!normalizedEmail && !password) {
      setErrorMsg("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    if (!normalizedEmail) {
      setErrorMsg("이메일을 입력해주세요.");
      return;
    }
    if (!password) {
      setErrorMsg("비밀번호를 입력해주세요.");
      return;
    }

    try {
      const res = await login(normalizedEmail, password);

      if (res && res.data) {
        const resData = res.data as Partial<LoginResponseData>;

        if (resData.stepUpRequired) {
          if (resData.maskedEmail) {
            sessionStorage.setItem("stepUpEmail", resData.maskedEmail);
          }
          router.push("/auth/step-up");
          return;
        }

        const role = resData.role;
        const nickname = resData.nickname;

        if (!role || !nickname) {
          setErrorMsg(
            "로그인 응답 형식이 올바르지 않습니다. 다시 시도해 주세요.",
          );
          return;
        }

        localStorage.setItem("userNickname", nickname);
        localStorage.setItem("userRole", role);

        window.dispatchEvent(new Event("loginSuccess"));

        const redirectByRole =
          role === "MASTER" || role === "ADMIN"
            ? "/admin/security"
            : role === "OPERATOR"
              ? "/admin/courses"
              : "/";
        setSuccessRedirect(redirectByRole);
        setSuccessOpen(true);
      } else {
        setErrorMsg("로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      const isClean = !!msg && !msg.includes("\n") && msg.length <= 60;
      setErrorMsg(isClean ? msg : "아이디 또는 비밀번호가 일치하지 않습니다.");
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-start bg-white px-4 pb-8 sm:pb-16">
      <div className="w-full max-w-100 p-6 sm:p-[30px_40px] bg-white border border-border-light rounded-base text-center box-border shadow-sm">
        <h1 className="text-2xl font-bold text-text-primary mb-6 sm:mb-7.5">
          로그인
        </h1>

        <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
          <div className="text-left">
            <label htmlFor="login-email" className="auth-label">
              아이디
            </label>
            <input
              id="login-email"
              type="email"
              aria-invalid={!!errorMsg && !email}
              aria-describedby={errorMsg ? "login-error" : undefined}
              className={`w-full auth-input ${
                errorMsg && !email ? "border-text-red" : ""
              }`}
              placeholder="이메일을 입력하세요"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (e.target.value) setErrorMsg("");
              }}
            />
          </div>

          <div className="text-left">
            <label htmlFor="login-password" className="auth-label">
              비밀번호
            </label>
            <PasswordInput
              id="login-password"
              aria-invalid={!!errorMsg && !password}
              aria-describedby={errorMsg ? "login-error" : undefined}
              className={`w-full auth-input ${
                errorMsg && !password ? "border-text-red" : ""
              }`}
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (e.target.value) setErrorMsg("");
              }}
            />
          </div>

          {errorMsg && (
            <p
              id="login-error"
              role="alert"
              aria-live="polite"
              className="text-xs text-text-red mt-2 pl-1 text-left font-medium"
            >
              {errorMsg}
            </p>
          )}

          <div className="flex items-center justify-center gap-3 pt-1 text-sm text-text-blue select-none font-medium">
            <button
              type="button"
              className="cursor-pointer hover:underline transition-all bg-transparent border-none p-0 text-text-blue"
              onClick={() => router.push("/auth/find-id")}
            >
              아이디 찾기
            </button>
            <span className="text-text-placeholder">|</span>
            <button
              type="button"
              className="cursor-pointer hover:underline transition-all bg-transparent border-none p-0 text-text-blue"
              onClick={() => router.push("/auth/reset-pw")}
            >
              비밀번호 찾기
            </button>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 h-11 text-base border-none rounded-base bg-button-blue-bg text-white font-semibold flex items-center justify-center cursor-pointer hover:bg-button-blue-hover-bg transition-colors"
              >
                로그인
              </button>

              <button
                type="button"
                className="flex-1 h-11 text-base border-none rounded-base bg-bg-gray-box text-text-primary font-semibold flex items-center justify-center cursor-pointer hover:bg-bg-gray-box-hover transition-colors"
                onClick={() => router.push("/auth/register")}
              >
                회원가입
              </button>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full h-11 text-base border-none rounded-base bg-bg-gray-box text-text-primary font-semibold flex items-center justify-center cursor-pointer hover:bg-bg-gray-box-hover transition-colors mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {googleLoading ? "이동 중..." : "GOOGLE로 로그인"}
            </button>
          </div>
        </form>
      </div>

      <OneButtonModal
        isOpen={successOpen}
        onClose={() => {
          setSuccessOpen(false);
          window.location.href = successRedirect;
        }}
        modalTitle="로그인 완료"
        modalContent="환영합니다!"
      />

      <OneButtonModal
        isOpen={!!oauthErrorMsg}
        onClose={() => setOauthErrorMsg("")}
        modalTitle="구글 로그인 안내"
        modalContent={oauthErrorMsg}
      />
    </div>
  );
}
