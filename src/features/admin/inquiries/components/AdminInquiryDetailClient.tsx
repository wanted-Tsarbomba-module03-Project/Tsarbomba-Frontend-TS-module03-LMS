"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  LoadingIndicator,
  OneButtonModal,
  TwoButtonModal,
} from "@/components/common";
import { handleClientError } from "@/lib/errorHandling";

import {
  getAdminInquiryDetail,
  replyAdminInquiry,
  updateAdminInquiryFilter,
} from "../actions";
import {
  adminInquiryDomainLabels,
  adminInquirySeverityLabels,
  adminInquiryStatusLabels,
} from "../constants";
import type { AdminInquiryDetail } from "../types";

const detailClasses = {
  container: "box-border bg-bg-main p-6 text-text-primary max-md:p-4",
  topBar:
    "mb-4 flex items-center justify-between gap-3 max-md:flex-col max-md:items-stretch",
  topActions: "flex flex-wrap items-center gap-2 max-md:w-full",
  backButton:
    "h-10 cursor-pointer rounded-base border border-border-light bg-bg-box px-4 text-body font-semibold text-text-secondary transition hover:bg-[#e5e7eb]",
  actionButton:
    "h-10 cursor-pointer rounded-base border border-button-blue-bg bg-bg-box px-4 text-body font-semibold text-button-blue-bg transition hover:bg-button-blue-bg hover:text-text-white disabled:cursor-not-allowed disabled:border-border-light disabled:bg-[#d1d5db] disabled:text-[#6b7280] max-md:flex-1",
  board:
    "overflow-hidden rounded-base border border-border-light bg-bg-box shadow-[0_10px_26px_rgba(15,23,42,0.06)]",
  header: "border-b border-border-light bg-bg-navbar px-6 py-5 max-md:px-4",
  headerTop:
    "flex items-start justify-between gap-4 max-md:flex-col max-md:items-stretch",
  title: "m-0 text-2xl font-bold leading-8 text-text-primary max-md:text-title-lg",
  meta:
    "mt-3 flex flex-wrap items-center gap-2 text-description text-text-secondary",
  badge:
    "inline-flex h-8 items-center justify-center rounded-full px-3 text-description font-semibold",
  domainBadge: "bg-[#ffedd5] text-[#c2410c]",
  severityBadge: "bg-[#fee2e2] text-[#b91c1c]",
  statusBadge: "bg-[#e0f2fe] text-[#075985]",
  filteredBadge: "bg-[#ede9fe] text-[#6d28d9]",
  body: "divide-y divide-border-light",
  section: "px-6 py-5 max-md:px-4",
  sectionTitle: "mt-0 mb-3 text-title-md font-bold text-text-primary",
  paragraph:
    "m-0 whitespace-pre-wrap break-keep text-body leading-7 text-text-primary",
  mutedParagraph:
    "m-0 whitespace-pre-wrap break-keep text-body leading-7 text-text-secondary",
  infoGrid: "grid grid-cols-2 gap-x-6 gap-y-3 max-md:grid-cols-1",
  infoItem: "min-w-0",
  infoLabel: "mb-1 text-description font-semibold text-text-secondary",
  infoValue: "break-keep text-body text-text-primary [overflow-wrap:anywhere]",
  link:
    "text-button-blue-bg underline-offset-2 hover:underline [overflow-wrap:anywhere]",
  replyBox:
    "rounded-base border border-border-light bg-bg-navbar p-4 text-body leading-7 text-text-primary",
  replyForm: "flex flex-col gap-3",
  textarea:
    "min-h-[150px] resize-y rounded-base border border-border-light bg-bg-box p-3 text-body leading-6 text-text-primary outline-hidden focus:ring-2 focus:ring-[#1a237e] disabled:bg-[#f3f4f6] disabled:text-text-secondary",
  modalOverlay:
    "fixed inset-0 z-[999] flex h-dvh w-dvw items-center justify-center bg-[rgba(16,24,40,0.45)] px-4 py-6",
  modalPanel:
    "w-[min(520px,100%)] rounded-2xl bg-bg-box p-6 shadow-[0_18px_44px_rgba(15,23,42,0.22)]",
  modalTitle: "m-0 text-xl font-bold text-text-primary",
  modalDescription:
    "mt-2 mb-0 min-h-[48px] whitespace-pre-line text-body text-text-secondary",
  modalTextarea:
    "mt-4 min-h-[140px] w-full resize-y rounded-base border border-border-light p-3 text-body text-text-primary outline-hidden focus:ring-2 focus:ring-[#1a237e] disabled:bg-[#f3f4f6] disabled:text-text-secondary",
  modalError:
    "mt-2 mb-0 min-h-[18px] text-description font-semibold text-[#b91c1c]",
  modalActions: "mt-5 flex justify-end gap-2",
  modalButton:
    "h-10 min-w-[88px] cursor-pointer rounded-base px-4 text-body font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
  modalPrimary:
    "border border-button-blue-bg bg-button-blue-bg text-text-white hover:not-disabled:bg-button-blue-hover-bg",
  modalSecondary:
    "border border-border-light bg-bg-navbar text-text-secondary hover:not-disabled:bg-[#e5e7eb]",
  replyFooter: "flex items-center justify-between gap-3 max-md:flex-col max-md:items-stretch",
  count: "text-description text-text-secondary",
  primaryButton:
    "h-10 cursor-pointer rounded-base border border-button-blue-bg bg-button-blue-bg px-4 text-body font-semibold text-text-white transition hover:not-disabled:bg-button-blue-hover-bg disabled:cursor-not-allowed disabled:border-border-light disabled:bg-[#d1d5db] disabled:text-[#6b7280]",
} as const;

const initialNoticeModal = {
  isOpen: false,
  title: "",
  content: "",
};

export default function AdminInquiryDetailClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const inquiryId = params.id;

  const [detail, setDetail] = useState<AdminInquiryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [filterReason, setFilterReason] = useState("");
  const [filterReasonOpen, setFilterReasonOpen] = useState(false);
  const [filterConfirmOpen, setFilterConfirmOpen] = useState(false);
  const [noticeModal, setNoticeModal] = useState(initialNoticeModal);

  useEffect(() => {
    const controller = new AbortController();

    const fetchDetail = async () => {
      try {
        setLoading(true);
        const result = await getAdminInquiryDetail(inquiryId, controller.signal);

        if (controller.signal.aborted) {
          return;
        }

        setDetail(result.data ?? null);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        handleClientError(error, {
          router,
          fallbackTitle: "문의 정보를 불러오지 못했습니다.",
          fallbackMessage: "잠시 후 다시 시도해 주세요.",
          showModal: openNoticeModal,
        });
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void fetchDetail();

    return () => controller.abort();
  }, [inquiryId, router]);

  function openNoticeModal(title: string, content: string) {
    setNoticeModal({
      isOpen: true,
      title,
      content,
    });
  }

  const closeNoticeModal = () => {
    setNoticeModal(initialNoticeModal);
  };

  const hasReply = Boolean(detail?.adminReply?.trim());
  const normalizedReply = replyContent.trim();
  const replyDisabled = saving || hasReply || normalizedReply.length === 0;
  const nextFiltered = detail ? !detail.filtered : false;
  const normalizedFilterReason = filterReason.trim();
  const filterReasonInvalid = normalizedFilterReason.length === 0;
  const filterActionLabel = detail?.filtered
    ? "정상 문의로 변경"
    : "AI 필터링 처리";

  const handleReplyRequest = () => {
    if (replyDisabled) {
      return;
    }

    setConfirmOpen(true);
  };

  const handleFilterRequest = () => {
    if (saving || !detail) {
      return;
    }

    setFilterReason("");
    setFilterReasonOpen(true);
  };

  const closeFilterReason = useCallback(() => {
    if (saving) {
      return;
    }

    setFilterReasonOpen(false);
    setFilterConfirmOpen(false);
    setFilterReason("");
  }, [saving]);

  const handleFilterReasonSubmit = () => {
    if (filterReasonInvalid) {
      return;
    }

    setFilterConfirmOpen(true);
  };

  const handleFilterConfirm = async () => {
    if (!detail || saving || filterReasonInvalid) {
      return;
    }

    try {
      setSaving(true);
      const result = await updateAdminInquiryFilter(detail.inquiryId, {
        filtered: nextFiltered,
        reason: normalizedFilterReason,
      });
      const filterResult = result.data;

      setDetail((currentDetail) =>
        currentDetail
          ? {
              ...currentDetail,
              ...(filterResult ?? {}),
              filtered: filterResult?.filtered ?? nextFiltered,
            }
          : currentDetail,
      );
      setFilterReason("");
      setFilterReasonOpen(false);
      setFilterConfirmOpen(false);
      openNoticeModal(
        "AI 필터링 상태 수정 완료",
        nextFiltered
          ? "문의가 AI 필터링 목록으로 변경되었습니다."
          : "문의가 정상 문의 목록으로 변경되었습니다.",
      );
    } catch (error) {
      handleClientError(error, {
        router,
        fallbackTitle: "AI 필터링 상태를 수정하지 못했습니다.",
        fallbackMessage: "잠시 후 다시 시도해 주세요.",
        showModal: openNoticeModal,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReplyConfirm = async () => {
    if (!detail || replyDisabled) {
      return;
    }

    try {
      setSaving(true);
      const result = await replyAdminInquiry(detail.inquiryId, {
        content: normalizedReply,
      });
      const replyResult = result.data;

      setDetail((currentDetail) =>
        currentDetail
          ? {
              ...currentDetail,
              ...(replyResult ?? {}),
              adminReply: replyResult?.adminReply ?? normalizedReply,
              repliedAt: replyResult?.repliedAt ?? currentDetail.repliedAt,
              repliedBy: replyResult?.repliedBy ?? currentDetail.repliedBy,
              status: replyResult?.status ?? "ANSWERED",
            }
          : currentDetail,
      );
      setReplyContent("");
      setConfirmOpen(false);
      openNoticeModal("답변 등록 완료", "관리자 답변이 등록되었습니다.");
    } catch (error) {
      handleClientError(error, {
        router,
        fallbackTitle: "답변을 등록하지 못했습니다.",
        fallbackMessage: "잠시 후 다시 시도해 주세요.",
        showModal: openNoticeModal,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={detailClasses.container}>
        <LoadingIndicator message="문의 상세 정보를 불러오는 중입니다." />
      </div>
    );
  }

  if (!detail) {
    return (
      <>
        <div className={detailClasses.container}>
          <button
            className={detailClasses.backButton}
            onClick={() => router.push("/admin/cs")}
            type="button"
          >
            목록으로
          </button>
          <section className={detailClasses.board}>
            <div className={detailClasses.section}>
              문의 정보를 찾을 수 없습니다.
            </div>
          </section>
        </div>
        <OneButtonModal
          isOpen={noticeModal.isOpen}
          modalContent={noticeModal.content}
          modalTitle={noticeModal.title}
          onClose={closeNoticeModal}
        />
      </>
    );
  }

  return (
    <>
      <div className={detailClasses.container}>
        <div className={detailClasses.topBar}>
          <button
            className={detailClasses.backButton}
            onClick={() => router.push("/admin/cs")}
            type="button"
          >
            목록으로
          </button>
        </div>

        <article className={detailClasses.board}>
          <header className={detailClasses.header}>
            <div className={detailClasses.headerTop}>
              <h1 className={detailClasses.title}>{detail.title}</h1>
              <div className={detailClasses.topActions}>
                <button
                  className={detailClasses.actionButton}
                  disabled={saving}
                  onClick={handleFilterRequest}
                  type="button"
                >
                  {filterActionLabel}
                </button>
              </div>
            </div>
            <div className={detailClasses.meta}>
              <span>문의 #{detail.inquiryId}</span>
              <span>회원 #{detail.userId}</span>
              <span>{formatDateTime(detail.createdAt)}</span>
              <span
                className={`${detailClasses.badge} ${detailClasses.domainBadge}`}
              >
                {adminInquiryDomainLabels[detail.domain] ?? detail.domain}
              </span>
              <span
                className={`${detailClasses.badge} ${detailClasses.severityBadge}`}
              >
                {adminInquirySeverityLabels[detail.severity] ??
                  detail.severity}
              </span>
              <span
                className={`${detailClasses.badge} ${detailClasses.statusBadge}`}
              >
                {adminInquiryStatusLabels[detail.status] ?? detail.status}
              </span>
              {detail.filtered && (
                <span
                  className={`${detailClasses.badge} ${detailClasses.filteredBadge}`}
                >
                  AI 필터링
                </span>
              )}
            </div>
          </header>

          <div className={detailClasses.body}>
            <section className={detailClasses.section}>
              <h2 className={detailClasses.sectionTitle}>문의 내용</h2>
              <p className={detailClasses.paragraph}>{detail.content}</p>
            </section>

            <section className={detailClasses.section}>
              <h2 className={detailClasses.sectionTitle}>AI 요약</h2>
              <p className={detailClasses.mutedParagraph}>
                {detail.summary || "-"}
              </p>
            </section>

            <section className={detailClasses.section}>
              <h2 className={detailClasses.sectionTitle}>권장 조치</h2>
              <p className={detailClasses.mutedParagraph}>
                {detail.recommendedAction || "-"}
              </p>
            </section>

            <section className={detailClasses.section}>
              <h2 className={detailClasses.sectionTitle}>참조 정보</h2>
              <div className={detailClasses.infoGrid}>
                <InfoItem label="원본 URL" value={renderUrl(detail.sourceUrl)} />
                <InfoItem
                  label="예상 URL"
                  value={renderUrl(detail.estimatedUrl)}
                />
                <InfoItem label="답변자" value={detail.repliedBy ?? "-"} />
                <InfoItem
                  label="답변일"
                  value={detail.repliedAt ? formatDateTime(detail.repliedAt) : "-"}
                />
              </div>
            </section>

            <section className={detailClasses.section}>
              <h2 className={detailClasses.sectionTitle}>관리자 답변</h2>
              {hasReply ? (
                <div className={detailClasses.replyBox}>{detail.adminReply}</div>
              ) : (
                <div className={detailClasses.replyForm}>
                  <textarea
                    className={detailClasses.textarea}
                    disabled={saving}
                    maxLength={1000}
                    onChange={(event) => setReplyContent(event.target.value)}
                    placeholder="문의에 대한 관리자 답변을 입력하세요. 등록 후 수정 및 삭제할 수 없습니다."
                    value={replyContent}
                  />
                  <div className={detailClasses.replyFooter}>
                    <span className={detailClasses.count}>
                      {replyContent.length}/1000
                    </span>
                    <button
                      className={detailClasses.primaryButton}
                      disabled={replyDisabled}
                      onClick={handleReplyRequest}
                      type="button"
                    >
                      답변 달기
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </article>
      </div>

      <TwoButtonModal
        cancelDisabled={saving}
        confirmDisabled={saving}
        isOpen={confirmOpen}
        modalContent="답변 등록 후에는 수정하거나 삭제할 수 없습니다."
        modalTitle="관리자 답변을 등록할까요?"
        onClose={() => {
          if (!saving) {
            setConfirmOpen(false);
          }
        }}
        onConfirm={() => void handleReplyConfirm()}
      />

      <FilterReasonModal
        disabled={saving}
        filtered={nextFiltered}
        isOpen={filterReasonOpen && !filterConfirmOpen}
        onClose={closeFilterReason}
        onReasonChange={setFilterReason}
        onSubmit={handleFilterReasonSubmit}
        reason={filterReason}
      />

      <TwoButtonModal
        cancelDisabled={saving}
        confirmDisabled={saving}
        isOpen={filterConfirmOpen}
        modalContent={`문의를 ${
          nextFiltered ? "AI 필터링" : "정상 문의"
        } 상태로 변경합니다.\n입력한 사유로 AI 필터링 상태를 수정할까요?`}
        modalTitle="AI 필터링 상태를 수정할까요?"
        onClose={() => {
          if (!saving) {
            setFilterConfirmOpen(false);
          }
        }}
        onConfirm={() => void handleFilterConfirm()}
      />

      <OneButtonModal
        isOpen={noticeModal.isOpen}
        modalContent={noticeModal.content}
        modalTitle={noticeModal.title}
        onClose={closeNoticeModal}
      />
    </>
  );
}

function InfoItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className={detailClasses.infoItem}>
      <div className={detailClasses.infoLabel}>{label}</div>
      <div className={detailClasses.infoValue}>{value}</div>
    </div>
  );
}

function FilterReasonModal({
  disabled,
  filtered,
  isOpen,
  onClose,
  onReasonChange,
  onSubmit,
  reason,
}: {
  disabled: boolean;
  filtered: boolean;
  isOpen: boolean;
  onClose: () => void;
  onReasonChange: (reason: string) => void;
  onSubmit: () => void;
  reason: string;
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

  const reasonInvalid = reason.trim().length === 0;

  return (
    <div className={detailClasses.modalOverlay} onClick={onClose}>
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className={detailClasses.modalPanel}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <h2 className={detailClasses.modalTitle} id={titleId}>
          AI 필터링 상태 수정
        </h2>
        <p className={detailClasses.modalDescription}>
          {`문의 상태를 ${
            filtered ? "AI 필터링" : "정상 문의"
          }로 변경하는 사유를 입력해 주세요.`}
        </p>
        <textarea
          className={detailClasses.modalTextarea}
          disabled={disabled}
          maxLength={300}
          onChange={(event) => onReasonChange(event.target.value)}
          placeholder="예: AI는 무의미 문의로 판단했지만 실제 문제 제출 오류 문의로 확인됨"
          ref={textareaRef}
          value={reason}
        />
        <p className={detailClasses.modalError}>
          {reasonInvalid ? "AI 필터링 상태 수정 사유를 입력해 주세요." : ""}
        </p>
        <div className={detailClasses.modalActions}>
          <button
            className={`${detailClasses.modalButton} ${detailClasses.modalSecondary}`}
            disabled={disabled}
            onClick={onClose}
            type="button"
          >
            취소
          </button>
          <button
            className={`${detailClasses.modalButton} ${detailClasses.modalPrimary}`}
            disabled={disabled || reasonInvalid}
            onClick={onSubmit}
            type="button"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}

function renderUrl(url: string | null) {
  if (!url) {
    return "-";
  }

  return (
    <a className={detailClasses.link} href={url}>
      {url}
    </a>
  );
}

function formatDateTime(value: string) {
  if (!value.trim()) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
