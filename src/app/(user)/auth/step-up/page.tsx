"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OneButtonModal from "../../../../components/common/OneButtonModal";
import { resendStepUp, verifyStepUp } from "@/features/auth/actions";
import type { LoginResponseData } from "@/features/auth/types";

const toUserMessage = (err: unknown, fallback: string): string => {
  const msg = err instanceof Error ? err.message : "";
  const technical = /JDBC|Hikari|Connection|Exception|SQL|timeout|timed out/i;
  if (msg && !msg.includes("\n") && msg.length <= 60 && !technical.test(msg)) {
    return msg;
  }
  return fallback;
};

// 미신뢰 기기 로그인 시 이메일 OTP 추가 인증 (step-up)
export default function StepUpPage() {
  const router = useRouter();

  const [maskedEmail, setMaskedEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeErr, setCodeErr] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(300); // 5분
  const [doneOpen, setDoneOpen] = useState(false);
  const [doneRedirect, setDoneRedirect] = useState("/");

  // 로그인 단계에서 저장한 마스킹 이메일 표시용. 없으면 비정상 진입 → 로그인으로
  useEffect(() => {
    const saved = sessionStorage.getItem("stepUpEmail");
    if (saved) {
      setMaskedEmail(saved);
    } else {
      router.replace("/auth/login");
    }
  }, [router]);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setTimeout(() => setTimer((t) => (t <= 1 ? 0 : t - 1)), 1000);
    return () => clearTimeout(id);
  }, [timer]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  // OTP 검증 → 성공 시 로그인 완료 (BE 가 AT/RT 쿠키 + nickname/role 응답)
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setCodeErr("인증번호를 입력하세요.");
      return;
    }
    if (loading) return;
    setLoading(true);
    setCodeErr("");
    try {
      const res = await verifyStepUp(code.trim(), trustDevice);
      const data = (res?.data ?? {}) as Partial<LoginResponseData>;
      const role = data.role;
      const nickname = data.nickname;

      if (!role || !nickname) {
        setCodeErr("인증 응답 형식이 올바르지 않습니다. 다시 시도해 주세요.");
        return;
      }

      localStorage.setItem("userNickname", nickname);
      localStorage.setItem("userRole", role);
      sessionStorage.removeItem("stepUpEmail");
      window.dispatchEvent(new Event("loginSuccess"));

      setDoneRedirect(
        role === "MASTER" || role === "ADMIN"
          ? "/admin/security"
          : role === "OPERATOR"
            ? "/admin/courses"
            : "/",
      );
      setDoneOpen(true);
    } catch (err: unknown) {
      setCodeErr(
        toUserMessage(err, "인증번호가 일치하지 않거나 만료되었습니다."),
      );
    } finally {
      setLoading(false);
    }
  };

  // OTP 재발송
  const handleResend = async () => {
    if (loading || timer > 0) return;
    setLoading(true);
    setCodeErr("");
    try {
      await resendStepUp();
      setTimer(300);
    } catch (err: unknown) {
      setCodeErr(toUserMessage(err, "인증번호 재발송에 실패했습니다."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-start bg-white px-4 pb-16">
      <div className="w-100 p-[30px_40px] bg-white border border-border-light rounded-base text-center box-border shadow-sm">
        <h1 className="text-2xl font-bold text-text-primary mb-2">추가 인증</h1>
        <p className="text-sm text-text-secondary mb-6 break-all">
          새로운 기기에서 로그인했습니다. 보안을 위해 인증번호를 입력해주세요.
          <br />
          <span className="font-medium text-text-primary">
            {maskedEmail} 로 발송됨
          </span>
        </p>

        <form onSubmit={handleVerify} className="space-y-4" noValidate>
          <div className="text-left">
            <label htmlFor="stepup-code" className="auth-label">
              인증번호
            </label>
            <div className="flex gap-2">
              <input
                id="stepup-code"
                type="text"
                inputMode="numeric"
                aria-invalid={!!codeErr}
                aria-describedby={codeErr ? "stepup-error" : undefined}
                className={`flex-1 auth-input ${codeErr ? "border-text-red" : ""}`}
                placeholder="인증번호 입력"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (codeErr) setCodeErr("");
                }}
              />
              <button
                type="button"
                onClick={handleResend}
                disabled={loading || timer > 0}
                className="shrink-0 h-11 px-3 text-sm bg-bg-gray-box text-text-primary rounded-lg cursor-pointer whitespace-nowrap hover:bg-bg-gray-box-hover transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                {timer > 0 ? formatTimer(timer) : "재발송"}
              </button>
            </div>
            {codeErr && (
              <p
                id="stepup-error"
                role="alert"
                aria-live="polite"
                className="mt-1.5 text-sm text-text-red"
              >
                {codeErr}
              </p>
            )}
          </div>

          <label className="flex items-start gap-2 text-left cursor-pointer select-none">
            <input
              type="checkbox"
              checked={trustDevice}
              onChange={(e) => setTrustDevice(e.target.checked)}
              className="mt-0.5 w-4 h-4 shrink-0 cursor-pointer accent-button-blue-bg"
            />
            <span className="text-sm text-text-secondary leading-snug">
              이 기기를 신뢰합니다
              <br />
              <span className="text-xs text-text-placeholder">
                다음 로그인부터 추가 인증을 생략해요
              </span>
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full h-11 text-base border-none rounded-base bg-button-blue-bg text-white font-semibold flex items-center justify-center cursor-pointer hover:bg-button-blue-hover-bg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "확인 중..." : "인증 확인"}
          </button>
        </form>
      </div>

      <OneButtonModal
        isOpen={doneOpen}
        onClose={() => {
          setDoneOpen(false);
          window.location.href = doneRedirect;
        }}
        modalTitle="로그인 완료"
        modalContent="인증이 완료되었습니다. 환영합니다!"
      />
    </div>
  );
}
