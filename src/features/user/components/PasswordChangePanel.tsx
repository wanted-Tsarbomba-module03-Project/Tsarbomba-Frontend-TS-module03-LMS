"use client";

import { useId, useState } from "react";
import { OneButtonModal } from "@/components/common";
import PasswordInput from "@/components/common/PasswordInput";
import { changeMyPassword } from "../actions";
import { PW_PLACEHOLDER, PW_REGEX, toUserMessage } from "../validation";
import { fieldBase, fieldLabel } from "./styles";

// 비밀번호 변경 (마이페이지 진입 시 이미 비번 확인했으므로 이메일 OTP 없이 바로 변경)
export default function PasswordChangePanel({ email }: { email: string }) {
  const newPwId = useId();
  const newPwErrId = useId();
  const newPwConfirmId = useId();
  const newPwConfirmErrId = useId();
  const [newPw, setNewPw] = useState("");
  const [newPwConfirm, setNewPwConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [pwErr, setPwErr] = useState("");
  const [doneOpen, setDoneOpen] = useState(false);

  const pwMismatch = newPwConfirm.length > 0 && newPw !== newPwConfirm;

  // 새 비밀번호로 변경
  const handleChange = async () => {
    if (loading) return;
    setPwErr("");
    if (!PW_REGEX.test(newPw)) {
      setPwErr("비밀번호는 8자 이상, 영문/숫자/특수문자를 포함해야 합니다.");
      return;
    }
    if (newPw !== newPwConfirm) {
      // pwMismatch UI 가 이미 confirm 칸 아래에 표시 — 별도 setPwErr 불필요
      return;
    }
    setLoading(true);
    try {
      await changeMyPassword(newPw, newPwConfirm);
      setDoneOpen(true);
    } catch (err) {
      setPwErr(toUserMessage(err, "비밀번호 변경에 실패했습니다."));
    } finally {
      setLoading(false);
    }
  };

  // 변경 완료 후 재로그인
  // BE 가 accessToken/refreshToken 쿠키를 만료시키므로 FE 는 클라이언트 캐시만 정리
  const handleDoneClose = () => {
    setDoneOpen(false);
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
      window.dispatchEvent(new Event("loginSuccess"));
      window.location.href = "/auth/login";
    }
  };

  return (
    <div className="w-80 shrink-0 border border-border-light rounded-xl bg-bg-box p-6 max-lg:w-full">
      <h2 className="text-lg font-semibold text-text-primary mb-2">
        비밀번호 변경
      </h2>
      <p className="text-sm text-text-secondary mb-5 break-all">
        새 비밀번호를 입력해주세요.
        <br />
        <span className="font-medium text-text-primary">이메일: {email}</span>
      </p>

      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor={newPwId} className={fieldLabel}>
            새 비밀번호 입력
          </label>
          <PasswordInput
            id={newPwId}
            className={`${fieldBase} ${pwErr ? "border-text-red" : ""}`}
            value={newPw}
            onChange={(e) => {
              setNewPw(e.target.value);
              if (pwErr) setPwErr("");
            }}
            placeholder={PW_PLACEHOLDER}
            aria-invalid={pwErr ? true : undefined}
            aria-describedby={pwErr ? newPwErrId : undefined}
          />
          {pwErr && (
            <p id={newPwErrId} className="mt-1 text-xs text-text-red">
              {pwErr}
            </p>
          )}
        </div>
        <div>
          <label htmlFor={newPwConfirmId} className={fieldLabel}>
            새 비밀번호 입력 확인
          </label>
          <PasswordInput
            id={newPwConfirmId}
            className={`${fieldBase} ${pwMismatch ? "border-text-red" : ""}`}
            value={newPwConfirm}
            onChange={(e) => setNewPwConfirm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleChange();
            }}
            placeholder="비밀번호를 한 번 더 입력해주세요"
            aria-invalid={pwMismatch ? true : undefined}
            aria-describedby={pwMismatch ? newPwConfirmErrId : undefined}
          />
          {pwMismatch && (
            <p id={newPwConfirmErrId} className="mt-1 text-xs text-text-red">
              비밀번호가 일치하지 않습니다.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleChange}
          disabled={loading || pwMismatch || !newPw || !newPwConfirm}
          className="w-full h-11 bg-button-blue-bg text-text-white rounded-lg font-semibold cursor-pointer hover:bg-button-blue-hover-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "변경 중" : "변경"}
        </button>
      </div>

      {/* 비밀번호 변경 완료 모달 */}
      <OneButtonModal
        isOpen={doneOpen}
        onClose={handleDoneClose}
        modalTitle="비밀번호 변경 완료"
        modalContent={
          "비밀번호가 변경되었습니다.\n새 비밀번호로 다시 로그인해주세요."
        }
      />
    </div>
  );
}
