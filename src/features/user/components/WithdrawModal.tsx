"use client";

import { useState } from "react";
import Image from "next/image";
import { withdrawUser } from "../actions";
import { toUserMessage } from "../validation";
import { fieldBase } from "./styles";

// 소셜(구글) 계정 탈퇴 확인 문구 — 정확히 일치해야 탈퇴 가능
const WITHDRAW_CONFIRM_TEXT = "탈퇴하겠습니다";

// 회원 탈퇴 — LOCAL: 비밀번호 / GOOGLE: 확인 문구 입력으로 분기
export default function WithdrawModal({
  open,
  onClose,
  provider,
}: {
  open: boolean;
  onClose: () => void;
  provider: string;
}) {
  const isSocial = provider === "GOOGLE";
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = isSocial
    ? value.trim() === WITHDRAW_CONFIRM_TEXT
    : !!value.trim();

  const close = () => {
    if (loading) return;
    setValue("");
    setError("");
    onClose();
  };

  const handleConfirm = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError("");
    try {
      // 소셜은 확인 문구, LOCAL 은 비밀번호를 전송
      await withdrawUser(
        isSocial ? { confirmText: value.trim() } : { password: value },
      );

      // 세션 정리 후 홈으로 (탈퇴 성공 시 서버가 쿠키 만료)
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
        document.cookie.split(";").forEach((cookie) => {
          document.cookie =
            cookie.split("=")[0].trim() +
            "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";
        });
        window.dispatchEvent(new Event("loginSuccess"));
        window.location.href = "/";
      }
    } catch (err) {
      setError(toUserMessage(err, "회원 탈퇴에 실패했습니다."));
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-999 flex h-full w-full items-center justify-center bg-[rgba(16,24,40,0.45)]"
      onClick={close}
    >
      <div
        className="relative w-120 rounded-2xl bg-bg-box p-8 max-[560px]:w-[calc(100%-32px)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-center">
          <Image
            alt="warning icon"
            className="h-16 w-16"
            height={64}
            src="/assets/img/modalWarningIcon.svg"
            width={64}
          />
        </div>

        <h2 className="mt-6 text-center text-2xl font-medium leading-8 text-text-primary">
          탈퇴하시겠습니까?
        </h2>
        <p className="mt-3 whitespace-pre-line text-center text-body leading-6 text-text-secondary">
          {isSocial
            ? `이 작업은 되돌릴 수 없습니다.\n계속하려면 아래에 '${WITHDRAW_CONFIRM_TEXT}' 를 입력해주세요.`
            : "이 작업은 되돌릴 수 없습니다.\n계속하려면 비밀번호를 입력해주세요."}
        </p>
        <p className="mt-3 whitespace-pre-line text-center text-description leading-5 text-text-secondary">
          회원 탈퇴 시 회원정보는 부정 이용 방지 등을 위해{"\n"}
          <span className="font-semibold text-text-primary">
            1년간 보관 후 파기
          </span>
          됩니다.
        </p>

        <input
          type={isSocial ? "text" : "password"}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleConfirm();
          }}
          placeholder={isSocial ? WITHDRAW_CONFIRM_TEXT : "비밀번호를 입력하세요"}
          aria-label={isSocial ? "탈퇴 확인 문구" : "비밀번호"}
          autoFocus
          className={`${fieldBase} mt-6 ${error ? "border-text-red" : ""}`}
        />
        {error && <p className="mt-1.5 text-sm text-text-red">{error}</p>}

        <div className="mt-7 flex justify-center gap-3">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canSubmit || loading}
            className="h-12 w-32 rounded-[10px] bg-button-red-bg text-text-white text-body font-medium transition-all duration-200 hover:not-disabled:bg-button-red-hover-bg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "처리 중" : "탈퇴"}
          </button>
          <button
            type="button"
            onClick={close}
            disabled={loading}
            className="h-12 w-32 rounded-[10px] bg-bg-navbar text-text-primary text-body font-medium transition-all duration-200 hover:not-disabled:bg-bg-gray-box-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
