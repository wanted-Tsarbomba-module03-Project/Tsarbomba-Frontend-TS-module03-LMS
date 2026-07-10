"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  signup,
  checkEmail,
  checkNickname,
  sendVerificationCode,
  verifyCode,
} from "@/features/auth/actions";
import OneButtonModal from "@/components/common/OneButtonModal";

export default function SignupForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");

  const [isSent, setIsSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const [timer, setTimer] = useState(0);
  const [isEmailChecked, setIsEmailChecked] = useState(false);
  const [isNicknameChecked, setIsNicknameChecked] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const pwRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const nicknameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  const [emailErr, setEmailErr] = useState("");
  const [codeErr, setCodeErr] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [confirmErr, setConfirmErr] = useState("");
  const [nameErr, setNameErr] = useState("");
  const [nicknameErr, setNicknameErr] = useState("");
  const [phoneErr, setPhoneErr] = useState("");

  // 타이머
  useEffect(() => {
    if (timer <= 0 || isVerified) return;
    const id = setTimeout(() => setTimer((t) => (t <= 1 ? 0 : t - 1)), 1000);
    return () => clearTimeout(id);
  }, [timer, isVerified]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  // 이메일
  const checkEmailFormat = (emailValue: string) => {
    if (!emailValue) {
      setEmailErr("이메일을 입력해주세요.");
      return false;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailValue)) {
      setEmailErr("이메일 형식이 올바르지 않습니다. (예: user@email.com)");
      return false;
    }
    setEmailErr("");
    return true;
  };

  // 비밀번호
  const validatePasswordOnBlur = (value: string) => {
    if (!value) {
      setPwErr("비밀번호는 필수입니다.");
      return;
    }
    const pwRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]:;"'<>,.?/~`\\|-]).{8,}$/;
    if (!pwRegex.test(value)) {
      setPwErr("비밀번호 형식이 맞지 않습니다.");
    } else {
      setPwErr("");
    }
  };

  const validateConfirmOnBlur = (value: string) => {
    if (!value) {
      setConfirmErr("비밀번호 확인은 필수입니다.");
      return;
    }
    if (pw !== value) {
      setConfirmErr("비밀번호가 일치하지 않습니다.");
    } else {
      setConfirmErr("");
    }
  };

  // 전화번호
  const validatePhoneOnBlur = (value: string) => {
    if (!value) {
      setPhoneErr("전화번호는 필수입니다.");
      return;
    }
    const phoneRegex = /^01[0-9]-\d{3,4}-\d{4}$/;
    if (!phoneRegex.test(value)) {
      setPhoneErr("전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678)");
    } else {
      setPhoneErr("");
    }
  };

  /* 1. 이메일 중복 체크 */
  const handleEmailCheck = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const isFormatValid = checkEmailFormat(email);
    if (!isFormatValid) return;

    try {
      const res = (await checkEmail(email)) as {
        success?: boolean;
        data?: unknown;
      };
      const isAvailable =
        (res as unknown) === true ||
        res?.success === true ||
        res?.data === true ||
        (res?.data as { available?: boolean })?.available === true;

      if (isAvailable) {
        setModalTitle("중복 확인 완료");
        setModalContent("사용 가능한 이메일입니다.");
        setIsSuccess(false);
        setModalOpen(true);
        setIsEmailChecked(true);
        setEmailErr("");
      } else {
        setEmailErr("이미 사용 중인 이메일입니다.");
        setIsEmailChecked(false);
      }
    } catch (err: unknown) {
      setEmailErr(
        err instanceof Error
          ? err.message
          : "이메일 중복 확인 API 통신 실패 (네트워크 점검 필요)",
      );
      setIsEmailChecked(false);
    }
  };

  /* 2. 닉네임 중복 체크 */
  const handleNicknameCheck = async (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault();
    if (!nickname) {
      setNicknameErr("닉네임을 입력해주세요.");
      return;
    }
    try {
      const res = (await checkNickname(nickname)) as {
        success?: boolean;
        data?: unknown;
      };
      const isAvailable =
        (res as unknown) === true ||
        res?.success === true ||
        res?.data === true ||
        (res?.data as { available?: boolean })?.available === true;

      if (isAvailable) {
        setModalTitle("중복 확인 완료");
        setModalContent("사용 가능한 닉네임입니다.");
        setIsSuccess(false);
        setModalOpen(true);
        setIsNicknameChecked(true);
        setNicknameErr("");
      } else {
        setNicknameErr("이미 사용 중인 닉네임입니다.");
        setIsNicknameChecked(false);
      }
    } catch (err: unknown) {
      setNicknameErr(
        err instanceof Error
          ? err.message
          : "닉네임 중복 확인 중 오류가 발생했습니다.",
      );
      setIsNicknameChecked(false);
    }
  };

  /* 3. 이메일 인증번호 전송 */
  const handleSendEmail = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!email) {
      setEmailErr("이메일을 입력해주세요.");
      return;
    }
    if (!isEmailChecked) {
      setEmailErr("이메일 중복확인을 먼저 완료해주세요.");
      return;
    }
    try {
      await sendVerificationCode(email);
      setIsSent(true);
      setTimer(180);
      setEmailErr("");
      setModalTitle("인증번호 발송");
      setModalContent("입력하신 이메일로 인증번호가 발송되었습니다.");
      setIsSuccess(false);
      setModalOpen(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("횟수") || message.includes("AUT-014")) {
        setEmailErr("이메일 발송 횟수를 초과했습니다.");
      } else {
        setEmailErr(message || "인증번호 발송 중 오류가 발생했습니다.");
      }
    }
  };

  /* 4. 인증번호 확인 검증 */
  const handleVerifyCode = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!code) {
      setCodeErr("인증번호를 입력해주세요.");
      return;
    }
    try {
      await verifyCode(email, code);
      setIsVerified(true);
      setCodeErr("");
      setModalTitle("인증 완료");
      setModalContent("이메일 인증이 성공적으로 완료되었습니다.");
      setIsSuccess(false);
      setModalOpen(true);
    } catch (err: unknown) {
      setCodeErr(
        err instanceof Error
          ? err.message
          : "인증번호가 일치하지 않거나 만료되었습니다.",
      );
      setIsVerified(false);
    }
  };

  /* 5. 최종 가입 폼 요청 제출 */
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || emailErr) {
      setEmailErr(
        email.trim() ? "이메일 형식을 확인해주세요." : "이메일을 입력해주세요.",
      );
      emailRef.current?.focus();
      return;
    }
    if (!isEmailChecked) {
      setEmailErr("이메일 중복확인을 완료해주세요.");
      emailRef.current?.focus();
      return;
    }
    if (!isVerified) {
      setCodeErr("이메일 인증을 완료해주세요.");
      codeRef.current?.focus();
      return;
    }
    if (!pw || pwErr) {
      setPwErr(
        pw ? "비밀번호 형식을 확인해주세요." : "비밀번호를 입력해주세요.",
      );
      pwRef.current?.focus();
      return;
    }
    if (pw !== confirm || confirmErr) {
      setConfirmErr("비밀번호가 일치하지 않습니다.");
      confirmRef.current?.focus();
      return;
    }
    if (!name.trim()) {
      setNameErr("이름을 입력해주세요.");
      nameRef.current?.focus();
      return;
    }
    if (!nickname.trim()) {
      setNicknameErr("닉네임을 입력해주세요.");
      nicknameRef.current?.focus();
      return;
    }
    if (!isNicknameChecked) {
      setNicknameErr("닉네임 중복확인을 완료해주세요.");
      nicknameRef.current?.focus();
      return;
    }
    if (!phone || phoneErr) {
      setPhoneErr(
        phone ? "전화번호 형식을 확인해주세요." : "전화번호를 입력해주세요.",
      );
      phoneRef.current?.focus();
      return;
    }

    {
      try {
        await signup({
          email,
          password: pw,
          passwordConfirm: confirm,
          name,
          nickname,
          phone,
        });
        setModalTitle("회원가입 완료");
        setModalContent("회원가입이 성공적으로 완료되었습니다!");
        setIsSuccess(true);
        setModalOpen(true);
      } catch (error: unknown) {
        setModalTitle("회원가입 실패");
        setModalContent(
          error instanceof Error
            ? error.message
            : "회원가입 처리 중 오류가 발생했습니다.",
        );
        setIsSuccess(false);
        setModalOpen(true);
      }
    }
  };

  return (
    <div className="w-full flex items-center justify-center bg-white px-4 py-10">
      <div className="w-full max-w-125 p-6 sm:p-[25px_40px] bg-white border border-border-light rounded-base text-center box-border">
        <h1 className="text-2xl font-bold text-text-primary mb-7.5">
          회원가입
        </h1>

        <form onSubmit={handleSignupSubmit} className="space-y-4" noValidate>
          <div className="text-left">
            <label className="auth-label">이메일*</label>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <input
                ref={emailRef}
                type="email"
                className={`w-full sm:flex-1 sm:min-w-0 auth-input ${emailErr ? "border-text-red" : "focus:border-text-blue"}`}
                placeholder="your@email.com"
                value={email}
                disabled={isVerified}
                onBlur={(e) => checkEmailFormat(e.target.value)}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setIsEmailChecked(false);
                  if (e.target.value) setEmailErr("");
                }}
              />
              <button
                type="button"
                className="h-11 px-3.5 text-sm bg-bg-gray-box text-text-primary border border-border-light rounded-base cursor-pointer whitespace-nowrap flex items-center justify-center hover:bg-bg-gray-box-hover transition-colors disabled:opacity-50"
                disabled={isVerified}
                onClick={handleEmailCheck}
              >
                중복확인
              </button>
            </div>
            {emailErr && <p className="auth-error">{emailErr}</p>}
          </div>

          <div className="text-left">
            <label className="auth-label">이메일 확인*</label>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <input
                ref={codeRef}
                type="text"
                className={`w-full sm:flex-1 sm:min-w-0 auth-input ${codeErr ? "border-text-red" : "focus:border-text-blue"}`}
                placeholder="인증번호 입력"
                value={code}
                disabled={isVerified}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (e.target.value) setCodeErr("");
                }}
              />
              {!isSent ? (
                <button
                  type="button"
                  className="h-11 px-5 text-sm bg-button-blue-bg text-white border-none rounded-base cursor-pointer whitespace-nowrap flex items-center justify-center hover:bg-button-blue-hover-bg transition-colors"
                  onClick={handleSendEmail}
                >
                  인증번호 전송
                </button>
              ) : (
                <div className="flex gap-1.5 w-full sm:w-auto">
                  <button
                    type="button"
                    className="h-11 flex-1 sm:flex-none px-3.5 text-sm bg-bg-gray-box text-text-primary border border-border-light rounded-base whitespace-nowrap flex items-center justify-center hover:bg-bg-gray-box-hover transition-colors disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                    onClick={handleSendEmail}
                    disabled={isVerified || timer > 0}
                  >
                    {timer > 0 ? formatTimer(timer) : "재발송"}
                  </button>
                  <button
                    type="button"
                    className="h-11 flex-1 sm:flex-none px-3.5 text-sm bg-button-blue-bg text-white border-none rounded-base cursor-pointer whitespace-nowrap flex items-center justify-center hover:bg-button-blue-hover-bg transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={handleVerifyCode}
                    disabled={isVerified}
                  >
                    확인
                  </button>
                </div>
              )}
            </div>
            {codeErr && <p className="auth-error">{codeErr}</p>}
          </div>

          <div className="text-left">
            <label className="auth-label">비밀번호*</label>
            <input
              ref={pwRef}
              type="password"
              className={`w-full auth-input ${pwErr ? "border-text-red" : "focus:border-text-blue"}`}
              placeholder="비밀번호를 입력해주세요"
              value={pw}
              onBlur={(e) => validatePasswordOnBlur(e.target.value)}
              onChange={(e) => {
                setPw(e.target.value);
                if (e.target.value) setPwErr("");
              }}
            />
            <p className="text-xs text-text-secondary mt-1.5 pl-1">
              ※ 8자 이상, 영문/숫자/특수문자를 모두 포함해야 합니다.
            </p>
            {pwErr && <p className="auth-error">{pwErr}</p>}
          </div>

          <div className="text-left">
            <label className="auth-label">비밀번호 확인*</label>
            <input
              ref={confirmRef}
              type="password"
              className={`w-full auth-input ${confirmErr ? "border-text-red" : "focus:border-text-blue"}`}
              placeholder="비밀번호를 한 번 더 입력해주세요"
              value={confirm}
              onBlur={(e) => validateConfirmOnBlur(e.target.value)}
              onChange={(e) => {
                setConfirm(e.target.value);
                if (e.target.value) setConfirmErr("");
              }}
            />
            {confirmErr && <p className="auth-error">{confirmErr}</p>}
          </div>

          <div className="text-left">
            <label className="auth-label">이름*</label>
            <input
              ref={nameRef}
              type="text"
              className={`w-full auth-input ${nameErr ? "border-text-red" : "focus:border-text-blue"}`}
              placeholder="이름을 입력해주세요"
              value={name}
              onBlur={(e) =>
                setNameErr(e.target.value.trim() ? "" : "이름을 입력해주세요.")
              }
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value) setNameErr("");
              }}
            />
            {nameErr && <p className="auth-error">{nameErr}</p>}
          </div>

          <div className="text-left">
            <label className="auth-label">닉네임*</label>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <input
                ref={nicknameRef}
                type="text"
                className={`w-full sm:flex-1 sm:min-w-0 auth-input ${nicknameErr ? "border-text-red" : "focus:border-text-blue"}`}
                placeholder="닉네임을 입력해주세요"
                value={nickname}
                onBlur={(e) => {
                  if (!e.target.value.trim())
                    setNicknameErr("닉네임을 입력해주세요.");
                }}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setIsNicknameChecked(false);
                  if (e.target.value) setNicknameErr("");
                }}
              />
              <button
                type="button"
                className="h-11 px-3.5 text-sm bg-bg-gray-box text-text-primary border border-border-light rounded-base cursor-pointer whitespace-nowrap flex items-center justify-center hover:bg-bg-gray-box-hover transition-colors"
                onClick={handleNicknameCheck}
              >
                중복확인
              </button>
            </div>
            {nicknameErr && <p className="auth-error">{nicknameErr}</p>}
          </div>

          <div className="text-left">
            <label className="auth-label">전화번호*</label>
            <input
              ref={phoneRef}
              type="tel"
              className={`w-full auth-input ${phoneErr ? "border-text-red" : "focus:border-text-blue"}`}
              placeholder="010-0000-0000"
              value={phone}
              onBlur={(e) => validatePhoneOnBlur(e.target.value)}
              onChange={(e) => {
                setPhone(e.target.value);
                if (e.target.value) setPhoneErr("");
              }}
            />
            {phoneErr && <p className="auth-error">{phoneErr}</p>}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="w-full h-10 text-base border-none rounded-base bg-button-blue-bg text-white flex items-center justify-center flex-1 cursor-pointer hover:bg-button-blue-hover-bg transition-colors"
            >
              가입하기
            </button>
            <button
              type="button"
              className="w-full h-10 text-base rounded-base bg-bg-gray-box text-text-primary border border-border-light flex items-center justify-center flex-1 cursor-pointer hover:bg-bg-gray-box-hover transition-colors"
              onClick={() => router.push("/auth/login")}
            >
              취소
            </button>
          </div>
        </form>
      </div>

      <OneButtonModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          if (isSuccess) {
            router.push("/auth/login");
          }
        }}
        modalTitle={modalTitle}
        modalContent={modalContent}
      />
    </div>
  );
}
