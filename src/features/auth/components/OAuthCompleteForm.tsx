"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  checkNickname,
  completeOauthSignup,
  getOauthTempInfo,
} from "@/features/auth/actions";
import OneButtonModal from "@/components/common/OneButtonModal";
import LoadingIndicator from "@/components/common/LoadingIndicator";
import TermsAgreement, {
  type TermsAgreementValue,
} from "@/features/auth/components/TermsAgreement";
import { formatPhoneNumber } from "@/features/auth/formatPhone";

const PHONE_REGEX = /^01[0-9]-\d{3,4}-\d{4}$/;

export default function OAuthCompleteForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [tempLoading, setTempLoading] = useState(true);
  const [tempError, setTempError] = useState("");

  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [nicknameErr, setNicknameErr] = useState("");
  const [phoneErr, setPhoneErr] = useState("");
  const [isNicknameChecked, setIsNicknameChecked] = useState(false);
  const [terms, setTerms] = useState<TermsAgreementValue>({
    serviceAgreed: false,
    privacyAgreed: false,
  });
  const [termsErr, setTermsErr] = useState("");
  const [submitErr, setSubmitErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState("");
  const [modalOnClose, setModalOnClose] = useState<(() => void) | null>(null);

  const nicknameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  // 마운트 시 구글 임시정보 조회 — TEMP_TOKEN 만료/없음(401)이면 로그인 페이지로
  useEffect(() => {
    let alive = true;
    getOauthTempInfo()
      .then((data) => {
        if (!alive) return;
        setEmail(data.email);
        setName(data.name);
      })
      .catch((err) => {
        if (!alive) return;
        setTempError(
          err instanceof Error
            ? err.message
            : "임시 회원 정보를 불러오지 못했습니다.",
        );
      })
      .finally(() => {
        if (alive) setTempLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const validatePhoneOnBlur = (value: string) => {
    if (!value) {
      setPhoneErr("전화번호는 필수입니다.");
      return;
    }
    if (!PHONE_REGEX.test(value)) {
      setPhoneErr("전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678)");
    } else {
      setPhoneErr("");
    }
  };

  const openInfoModal = (title: string, content: string) => {
    setModalTitle(title);
    setModalContent(content);
    setModalOnClose(null);
    setModalOpen(true);
  };

  const handleNicknameCheck = async () => {
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
        openInfoModal("중복 확인 완료", "사용 가능한 닉네임입니다.");
        setIsNicknameChecked(true);
        setNicknameErr("");
      } else {
        setNicknameErr("이미 사용 중인 닉네임입니다.");
        setIsNicknameChecked(false);
      }
    } catch (err) {
      setNicknameErr(
        err instanceof Error
          ? err.message
          : "닉네임 중복 확인 중 오류가 발생했습니다.",
      );
      setIsNicknameChecked(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitErr("");

    if (!nickname) {
      setNicknameErr("닉네임을 입력해주세요.");
      nicknameRef.current?.focus();
      return;
    }
    if (!isNicknameChecked) {
      setNicknameErr("닉네임 중복 확인을 해주세요.");
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
    if (!terms.serviceAgreed || !terms.privacyAgreed) {
      setTermsErr("필수 약관에 모두 동의해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      await completeOauthSignup({
        nickname,
        phone,
        termsOfServiceAgreed: terms.serviceAgreed,
        privacyPolicyAgreed: terms.privacyAgreed,
      });
      // BE 가 AT/RT 쿠키 발급 — 헤더가 읽는 localStorage 는 모달 의존 없이 즉시 세팅
      if (typeof window !== "undefined") {
        localStorage.setItem("userNickname", nickname);
        localStorage.setItem("userRole", "STUDENT");
        window.dispatchEvent(new Event("loginSuccess"));
      }
      setModalTitle("회원가입 완료");
      setModalContent("환영합니다! 메인 페이지로 이동합니다.");
      setModalOnClose(() => () => {
        if (typeof window !== "undefined") {
          window.location.href = "/";
        }
      });
      setModalOpen(true);
    } catch (err) {
      setSubmitErr(
        err instanceof Error
          ? err.message
          : "회원가입 처리 중 오류가 발생했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // TEMP_TOKEN 없음/만료 → 로그인 페이지로 안내
  if (!tempLoading && tempError) {
    return (
      <OneButtonModal
        isOpen={true}
        onClose={() => router.replace("/auth/login")}
        modalTitle="추가 정보 입력을 진행할 수 없습니다"
        modalContent={`${tempError}\n다시 구글 로그인부터 시도해주세요.`}
      />
    );
  }

  if (tempLoading) {
    return <LoadingIndicator message="회원 정보를 불러오는 중입니다." />;
  }

  return (
    <div className="w-full flex flex-col items-center justify-start bg-white px-4 pb-16">
      <div className="w-full max-w-100 p-[24px_20px] sm:p-[30px_40px] bg-white border border-border-light rounded-base text-center box-border shadow-sm">
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          추가 정보 입력
        </h1>
        <p className="text-sm text-text-secondary mb-6">
          닉네임과 전화번호를 입력하면 가입이 완료됩니다.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="text-left">
            <label className="auth-label">이메일</label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full auth-input bg-bg-gray-box text-text-secondary cursor-not-allowed"
            />
          </div>

          <div className="text-left">
            <label className="auth-label">이름</label>
            <input
              type="text"
              value={name}
              readOnly
              className="w-full auth-input bg-bg-gray-box text-text-secondary cursor-not-allowed"
            />
          </div>

          <div className="text-left">
            <label htmlFor="oauth-nickname" className="auth-label">
              닉네임
            </label>
            <div className="flex gap-2">
              <input
                id="oauth-nickname"
                ref={nicknameRef}
                type="text"
                className={`flex-1 auth-input ${nicknameErr ? "border-text-red" : "focus:border-text-blue"}`}
                placeholder="닉네임을 입력하세요"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setIsNicknameChecked(false);
                  if (nicknameErr) setNicknameErr("");
                }}
              />
              <button
                type="button"
                onClick={handleNicknameCheck}
                className="shrink-0 h-11 px-3 text-sm bg-bg-gray-box text-text-primary rounded-lg cursor-pointer whitespace-nowrap hover:bg-bg-gray-box-hover transition-colors"
              >
                중복 확인
              </button>
            </div>
            {nicknameErr && <p className="auth-error">{nicknameErr}</p>}
          </div>

          <div className="text-left">
            <label htmlFor="oauth-phone" className="auth-label">
              전화번호
            </label>
            <input
              id="oauth-phone"
              ref={phoneRef}
              type="tel"
              className={`w-full auth-input ${phoneErr ? "border-text-red" : "focus:border-text-blue"}`}
              placeholder="010-1234-5678"
              value={phone}
              onChange={(e) => {
                setPhone(formatPhoneNumber(e.target.value));
                if (phoneErr) setPhoneErr("");
              }}
              onBlur={(e) => validatePhoneOnBlur(e.target.value)}
            />
            {phoneErr && <p className="auth-error">{phoneErr}</p>}
          </div>

          <TermsAgreement
            value={terms}
            onChange={(next) => {
              setTerms(next);
              if (next.serviceAgreed && next.privacyAgreed) setTermsErr("");
            }}
            error={termsErr}
          />

          {submitErr && (
            <p
              role="alert"
              aria-live="polite"
              className="text-xs text-text-red mt-2 pl-1 text-left font-medium"
            >
              {submitErr}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 text-base border-none rounded-base bg-button-blue-bg text-white font-semibold flex items-center justify-center cursor-pointer hover:bg-button-blue-hover-bg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "가입 중..." : "가입 완료"}
          </button>
        </form>
      </div>

      <OneButtonModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          modalOnClose?.();
        }}
        modalTitle={modalTitle}
        modalContent={modalContent}
      />
    </div>
  );
}
