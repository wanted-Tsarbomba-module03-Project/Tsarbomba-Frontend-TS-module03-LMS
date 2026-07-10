"use client";

import { useState } from "react";
import { TERMS, type TermsKey } from "@/features/auth/terms";
import TermsViewModal from "@/features/auth/components/TermsViewModal";

export interface TermsAgreementValue {
  serviceAgreed: boolean;
  privacyAgreed: boolean;
}

interface TermsAgreementProps {
  value: TermsAgreementValue;
  onChange: (next: TermsAgreementValue) => void;
  /** 미동의 상태로 제출 시도 시 표시할 에러 문구 */
  error?: string;
}

export default function TermsAgreement({
  value,
  onChange,
  error,
}: TermsAgreementProps) {
  // 전문 보기 모달 대상 (null 이면 닫힘)
  const [viewing, setViewing] = useState<TermsKey | null>(null);

  const allAgreed = value.serviceAgreed && value.privacyAgreed;

  const toggleAll = () => {
    const next = !allAgreed;
    onChange({ serviceAgreed: next, privacyAgreed: next });
  };

  const rows: { key: TermsKey; agreed: boolean }[] = [
    { key: "service", agreed: value.serviceAgreed },
    { key: "privacy", agreed: value.privacyAgreed },
  ];

  const setOne = (key: TermsKey, agreed: boolean) => {
    onChange({
      serviceAgreed: key === "service" ? agreed : value.serviceAgreed,
      privacyAgreed: key === "privacy" ? agreed : value.privacyAgreed,
    });
  };

  return (
    <div className="text-left">
      <div className="rounded-base border border-border-light p-3.5">
        {/* 전체 동의 */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 shrink-0 accent-button-blue-bg cursor-pointer"
            checked={allAgreed}
            onChange={toggleAll}
          />
          <span className="text-sm font-bold text-text-primary">
            약관 전체 동의
          </span>
        </label>

        <div className="my-3 border-t border-border-light" />

        {/* 개별 약관 */}
        <div className="flex flex-col gap-2.5">
          {rows.map(({ key, agreed }) => (
            <div key={key} className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 cursor-pointer min-w-0">
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 accent-button-blue-bg cursor-pointer"
                  checked={agreed}
                  onChange={(e) => setOne(key, e.target.checked)}
                />
                <span className="text-sm text-text-primary truncate">
                  <span className="text-text-blue">(필수)</span> {TERMS[key].title}
                </span>
              </label>
              <button
                type="button"
                onClick={() => setViewing(key)}
                className="shrink-0 text-xs text-text-secondary underline underline-offset-2 hover:text-text-primary cursor-pointer"
              >
                보기
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="auth-error">{error}</p>}

      {/* 전문 보기 모달 — "동의하고 닫기" 시 해당 체크박스 자동 체크 */}
      <TermsViewModal
        termsKey={viewing}
        onClose={() => setViewing(null)}
        onAgree={(key) => setOne(key, true)}
      />
    </div>
  );
}
