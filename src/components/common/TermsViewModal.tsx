"use client";

import { useEffect } from "react";
import { TERMS, type TermsKey } from "@/lib/terms";

interface TermsViewModalProps {
  /** 표시할 약관 키. null 이면 닫힘 */
  termsKey: TermsKey | null;
  onClose: () => void;
  /** 넘기면 "동의하고 닫기" 버튼 노출 (동의 폼용). 없으면 단순 열람 */
  onAgree?: (key: TermsKey) => void;
}

export default function TermsViewModal({
  termsKey,
  onClose,
  onAgree,
}: TermsViewModalProps) {
  // Esc 로 닫기 (열려 있을 때만 리스너 등록)
  useEffect(() => {
    if (!termsKey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [termsKey, onClose]);

  if (!termsKey) return null;
  const doc = TERMS[termsKey];

  return (
    <div
      className="fixed inset-0 z-999 flex h-dvh w-dvw items-center justify-center bg-[rgba(16,24,40,0.45)] px-4 py-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={doc.title}
    >
      <div
        className="flex max-h-[calc(100dvh-48px)] w-[min(560px,100%)] flex-col rounded-2xl bg-bg-box"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border-light px-6 py-4">
          <h2 className="text-lg font-semibold text-text-primary">
            {doc.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="약관 닫기"
            className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            >
              <path d="M15 5L5 15M5 5l10 10" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <p className="whitespace-pre-line text-sm leading-relaxed text-text-secondary">
            {doc.body}
          </p>
        </div>

        {onAgree && (
          <div className="flex justify-end border-t border-border-light px-6 py-4">
            <button
              type="button"
              onClick={() => {
                onAgree(termsKey);
                onClose();
              }}
              className="px-5 py-2.5 text-sm font-medium text-text-white bg-button-blue-bg rounded-lg hover:bg-button-blue-hover-bg transition-colors cursor-pointer"
            >
              동의하고 닫기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
