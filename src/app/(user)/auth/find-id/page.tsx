"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { findEmail } from "@/features/auth/actions";
import { formatPhoneNumber } from "@/features/auth/formatPhone";

const PHONE_REGEX = /^01[0-9]-\d{3,4}-\d{4}$/;

const toUserMessage = (err: unknown, fallback: string): string => {
  const msg = err instanceof Error ? err.message : "";
  const technical = /JDBC|Hikari|Connection|Exception|SQL|timeout|timed out/i;
  if (msg && !msg.includes("\n") && msg.length <= 60 && !technical.test(msg)) {
    return msg;
  }
  return fallback;
};

export default function FindIdPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [resultEmail, setResultEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFindIdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || !trimmedPhone) {
      setErrorMsg("이름과 전화번호를 모두 입력해주세요.");
      return;
    }
    if (!PHONE_REGEX.test(trimmedPhone)) {
      setErrorMsg("전화번호 형식을 확인해주세요. (예: 010-1234-5678)");
      return;
    }
    if (loading) return;

    setLoading(true);
    try {
      const email = await findEmail(trimmedName, trimmedPhone);
      setResultEmail(email);
    } catch (err) {
      setErrorMsg(toUserMessage(err, "일치하는 회원 정보를 찾을 수 없습니다."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-start bg-background px-4 pb-16">
      <div className="w-100 max-w-full px-10 py-8 bg-bg-box border border-border-light rounded-base text-center box-border shadow-sm">
        {!resultEmail ? (
          <>
            <h1 className="text-title-lg font-bold text-text-primary mb-6">
              이메일 찾기
            </h1>
            <form
              onSubmit={handleFindIdSubmit}
              className="space-y-4"
              noValidate
            >
              <div className="text-left flex flex-col">
                <label className="auth-label">이름*</label>
                <input
                  type="text"
                  className="auth-input w-full"
                  placeholder="이름을 입력하세요"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (e.target.value) setErrorMsg("");
                  }}
                />
              </div>

              <div className="text-left flex flex-col">
                <label className="auth-label">전화번호*</label>
                <input
                  type="text"
                  className="auth-input w-full"
                  placeholder="010-0000-0000"
                  value={phone}
                  inputMode="numeric"
                  maxLength={13}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setPhone(formatted);
                    if (formatted) setErrorMsg("");
                  }}
                />
              </div>

              {errorMsg && <p className="auth-error text-left">{errorMsg}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-body border-none rounded-base bg-button-blue-bg text-text-white font-medium flex items-center justify-center cursor-pointer mt-6 hover:bg-button-blue-hover-bg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "조회 중..." : "확인"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-title-lg font-bold text-text-primary mb-6">
              이메일 찾기 결과
            </h1>
            <div className="text-title-md font-bold text-text-blue my-12 text-center select-all">
              {resultEmail}
            </div>
            <button
              type="button"
              className="w-full h-11 text-body border-none rounded-base bg-button-blue-bg text-text-white font-medium flex items-center justify-center cursor-pointer hover:bg-button-blue-hover-bg transition-colors"
              onClick={() => router.push("/auth/login")}
            >
              돌아가기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
