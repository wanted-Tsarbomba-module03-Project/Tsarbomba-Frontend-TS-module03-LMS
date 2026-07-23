"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import OneButtonModal from "@/components/common/OneButtonModal";
import TermsViewModal from "@/components/common/TermsViewModal";
import { createInquiry } from "@/features/inquiries/actions";
import { handleClientError } from "@/lib/errorHandling";
import type { TermsKey } from "@/lib/terms";

const FOOTER_TEXT_CLASS =
  "line-clamp-2 whitespace-normal! break-keep leading-5 text-description text-text-secondary";
const INQUIRY_MAX_LENGTH = 500;

const footerClasses = {
  footer:
    "mt-3.75 flex min-h-12.5 w-full items-center justify-center bg-[#f3f4f6]",
  inner:
    "box-border flex w-full max-w-300 flex-col items-center justify-center px-4 py-2",
  linkRow: `flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center ${FOOTER_TEXT_CLASS}`,
  linkButton: "cursor-pointer hover:underline hover:underline-offset-[3px]",
  copyright: `mt-1.25 flex items-center justify-center text-center ${FOOTER_TEXT_CLASS}`,
  modalOverlay:
    "fixed inset-0 z-[999] flex h-dvh w-dvw items-center justify-center bg-[rgba(16,24,40,0.45)] px-4 py-6",
  modalPanel:
    "w-[min(520px,100%)] rounded-2xl bg-bg-box p-6 shadow-[0_18px_44px_rgba(15,23,42,0.22)]",
  modalTitle: "m-0 text-xl font-bold text-text-primary",
  modalDescription:
    "mt-2 mb-0 min-h-[48px] whitespace-pre-line text-body text-text-secondary",
  textarea:
    "mt-4 min-h-[160px] w-full resize-y rounded-base border border-border-light p-3 text-body text-text-primary outline-hidden focus:ring-2 focus:ring-[#1a237e] disabled:bg-[#f3f4f6] disabled:text-text-secondary",
  modalFooter: "mt-2 flex items-center justify-between gap-3",
  count: "text-description text-text-secondary",
  error: "min-h-[18px] text-description font-semibold text-[#b91c1c]",
  modalActions: "mt-5 flex justify-end gap-2",
  modalButton:
    "h-10 min-w-[88px] cursor-pointer rounded-base px-4 text-body font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
  modalPrimary:
    "border border-button-blue-bg bg-button-blue-bg text-text-white hover:not-disabled:bg-button-blue-hover-bg",
  modalSecondary:
    "border border-border-light bg-bg-navbar text-text-secondary hover:not-disabled:bg-[#e5e7eb]",
} as const;

function Footer() {
  const pathname = usePathname();
  const router = useRouter();
  const [viewing, setViewing] = useState<TermsKey | null>(null);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryContent, setInquiryContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [noticeModal, setNoticeModal] = useState({
    isOpen: false,
    title: "",
    content: "",
  });

  const normalizedInquiry = inquiryContent.trim();
  const inquiryInvalid = normalizedInquiry.length === 0;

  const closeInquiryModal = useCallback(() => {
    if (submitting) {
      return;
    }

    setInquiryOpen(false);
    setInquiryContent("");
  }, [submitting]);

  const handleInquirySubmit = async () => {
    if (submitting || inquiryInvalid) {
      return;
    }

    try {
      setSubmitting(true);
      await createInquiry({
        content: normalizedInquiry,
        sourceUrl: pathname || "/",
      });
      setInquiryOpen(false);
      setInquiryContent("");
      setNoticeModal({
        isOpen: true,
        title: "문의가 접수되었습니다.",
        content: "관리자가 내용을 확인한 뒤 필요한 조치를 진행합니다.",
      });
    } catch (error) {
      setInquiryOpen(false);
      handleClientError(error, {
        router,
        fallbackTitle: "문의를 등록하지 못했습니다.",
        fallbackMessage: "잠시 후 다시 시도해 주세요.",
        showModal: (title, content) =>
          setNoticeModal({
            isOpen: true,
            title,
            content,
          }),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className={footerClasses.footer}>
      <div className={footerClasses.inner}>
        <div className={footerClasses.linkRow}>
          <button
            type="button"
            onClick={() => setViewing("service")}
            className={footerClasses.linkButton}
          >
            이용약관
          </button>
          <span>|</span>
          <button
            type="button"
            onClick={() => setViewing("privacy")}
            className={footerClasses.linkButton}
          >
            개인정보처리방침
          </button>
          <span>|</span>
          <span>고객센터: 111</span>
          <span>|</span>
          <button
            className={footerClasses.linkButton}
            onClick={() => setInquiryOpen(true)}
            type="button"
          >
            문의하기
          </button>
        </div>

        <p className={footerClasses.copyright}>
          © 2026 Tsarbomba All rights reserved
        </p>
      </div>

      <TermsViewModal termsKey={viewing} onClose={() => setViewing(null)} />
      <InquiryModal
        content={inquiryContent}
        disabled={submitting}
        isOpen={inquiryOpen}
        onChange={setInquiryContent}
        onClose={closeInquiryModal}
        onSubmit={handleInquirySubmit}
      />
      <OneButtonModal
        isOpen={noticeModal.isOpen}
        modalContent={noticeModal.content}
        modalTitle={noticeModal.title}
        onClose={() =>
          setNoticeModal({
            isOpen: false,
            title: "",
            content: "",
          })
        }
      />
    </footer>
  );
}

function InquiryModal({
  content,
  disabled,
  isOpen,
  onChange,
  onClose,
  onSubmit,
}: {
  content: string;
  disabled: boolean;
  isOpen: boolean;
  onChange: (content: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const titleId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    previouslyFocusedElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    textareaRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = textareaRef.current
        ?.closest('[role="dialog"]')
        ?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), textarea:not(:disabled), input:not(:disabled), select:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])',
        );

      if (!focusableElements || focusableElements.length === 0) {
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedElementRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const contentInvalid = content.trim().length === 0;

  return (
    <div className={footerClasses.modalOverlay} onClick={onClose}>
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className={footerClasses.modalPanel}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <h2 className={footerClasses.modalTitle} id={titleId}>
          문의하기
        </h2>
        <p className={footerClasses.modalDescription}>
          {"이용 중 불편한 점이나 확인이 필요한 내용을 남겨 주세요.\n현재 페이지 경로가 함께 전달됩니다."}
        </p>
        <textarea
          className={footerClasses.textarea}
          disabled={disabled}
          maxLength={INQUIRY_MAX_LENGTH}
          onChange={(event) => onChange(event.target.value)}
          placeholder="문의 내용을 입력해 주세요."
          ref={textareaRef}
          value={content}
        />
        <div className={footerClasses.modalFooter}>
          <span className={footerClasses.count}>
            {content.length}/{INQUIRY_MAX_LENGTH}
          </span>
          <span className={footerClasses.error}>
            {contentInvalid ? "문의 내용을 입력해 주세요." : ""}
          </span>
        </div>
        <div className={footerClasses.modalActions}>
          <button
            className={`${footerClasses.modalButton} ${footerClasses.modalSecondary}`}
            disabled={disabled}
            onClick={onClose}
            type="button"
          >
            취소
          </button>
          <button
            className={`${footerClasses.modalButton} ${footerClasses.modalPrimary}`}
            disabled={disabled || contentInvalid}
            onClick={onSubmit}
            type="button"
          >
            등록
          </button>
        </div>
      </div>
    </div>
  );
}

export default Footer;
