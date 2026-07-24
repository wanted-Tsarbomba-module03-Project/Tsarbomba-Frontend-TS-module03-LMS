"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  FilterDropdown,
  List,
  ListSkeleton,
  OneButtonModal,
  Pagination,
  TwoButtonModal,
  listCellClasses,
  type FilterDropdownOption,
  type FilterDropdownValue,
  type ListColumn,
} from "@/components/common";
import { handleClientError } from "@/lib/errorHandling";

import {
  getAdminInquiries,
  updateAdminInquiryClassification,
} from "../actions";
import {
  ADMIN_INQUIRY_PAGE_SIZE,
  adminInquiryDomainLabels,
  adminInquiryDomainOptions,
  adminInquirySeverityLabels,
  adminInquirySeverityOptions,
  adminInquiryStatusLabels,
  adminInquiryStatusOptions,
} from "../constants";
import type {
  AdminInquiryDomain,
  AdminInquirySeverity,
  AdminInquiryStatus,
  AdminInquirySummary,
} from "../types";

type InquiryFilteredTab = "normal" | "filtered";
type ClassificationField = "domain" | "severity";
type ClassificationDraft = {
  field: ClassificationField;
  inquiry: AdminInquirySummary;
  domain: AdminInquiryDomain;
  severity: AdminInquirySeverity;
  reason: string;
} | null;

const filteredOptions: Array<FilterDropdownOption<InquiryFilteredTab>> = [
  { label: "정상", value: "normal", swatchClassName: "bg-[#0ea5e9]" },
  { label: "AI 필터링", value: "filtered", swatchClassName: "bg-[#9333ea]" },
];

const domainColorClasses: Record<AdminInquiryDomain, string> = {
  ADMIN: "bg-[#dbeafe] text-[#1d4ed8]",
  AUTH: "bg-[#fee2e2] text-[#b91c1c]",
  BADGE: "bg-[#fef3c7] text-[#b45309]",
  CHATBOT: "bg-[#ede9fe] text-[#6d28d9]",
  COURSE: "bg-[#dcfce7] text-[#15803d]",
  ENROLLMENT: "bg-[#ccfbf1] text-[#0f766e]",
  PROBLEMS: "bg-[#ffedd5] text-[#c2410c]",
  RANKING: "bg-[#fce7f3] text-[#be185d]",
  RECOMMENDATION: "bg-[#e0e7ff] text-[#4338ca]",
  USER: "bg-[#e0f2fe] text-[#0369a1]",
  LECTURE: "bg-[#f3e8ff] text-[#7e22ce]",
  LEARNING: "bg-[#ecfccb] text-[#4d7c0f]",
  ETC: "bg-[#f3f4f6] text-[#4b5563]",
};

const domainSwatchClasses: Record<AdminInquiryDomain, string> = {
  ADMIN: "bg-[#3b82f6]",
  AUTH: "bg-[#ef4444]",
  BADGE: "bg-[#f59e0b]",
  CHATBOT: "bg-[#8b5cf6]",
  COURSE: "bg-[#22c55e]",
  ENROLLMENT: "bg-[#14b8a6]",
  PROBLEMS: "bg-[#f97316]",
  RANKING: "bg-[#ec4899]",
  RECOMMENDATION: "bg-[#6366f1]",
  USER: "bg-[#0ea5e9]",
  LECTURE: "bg-[#a855f7]",
  LEARNING: "bg-[#84cc16]",
  ETC: "bg-[#6b7280]",
};

const severityColorClasses: Record<AdminInquirySeverity, string> = {
  LOW: "bg-[#f3f4f6] text-[#4b5563]",
  MEDIUM: "bg-[#fef9c3] text-[#854d0e]",
  HIGH: "bg-[#ffedd5] text-[#c2410c]",
  CRITICAL: "bg-[#fee2e2] text-[#b91c1c]",
};

const severitySwatchClasses: Record<AdminInquirySeverity, string> = {
  LOW: "bg-[#6b7280]",
  MEDIUM: "bg-[#eab308]",
  HIGH: "bg-[#f97316]",
  CRITICAL: "bg-[#ef4444]",
};

const statusColorClasses: Record<AdminInquiryStatus, string> = {
  OPEN: "bg-[#e0f2fe] text-[#075985]",
  ANSWERED: "bg-[#ecfdf5] text-[#047857]",
};

const statusSwatchClasses: Record<AdminInquiryStatus, string> = {
  OPEN: "bg-[#0ea5e9]",
  ANSWERED: "bg-[#10b981]",
};

const inquiryListClasses = {
  container: "box-border p-6 text-text-primary max-md:p-4",
  header:
    "mb-5 flex items-start justify-between gap-4 max-md:flex-col max-md:items-stretch",
  titleGroup: "flex flex-col gap-1",
  title: "m-0 text-2xl font-bold",
  description: "m-0 text-description text-text-secondary",
  filterBar:
    "mb-5 flex flex-wrap items-center justify-between gap-3 max-md:items-stretch",
  tabGroup: "flex flex-wrap gap-2",
  tabButton:
    "h-9 min-w-[92px] cursor-pointer rounded-base border border-button-blue-bg bg-bg-box px-3 text-body font-semibold text-button-blue-bg transition hover:bg-[#eef2ff]",
  activeTab:
    "border-button-blue-bg bg-button-blue-bg text-text-white hover:bg-button-blue-hover-bg",
  titleCell: "text-left",
  badge:
    "inline-flex h-8 min-w-[58px] items-center justify-center rounded-full px-3 text-description font-semibold",
  editableBadge:
    "cursor-pointer border-0 transition hover:brightness-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1a237e]",
  modalForm:
    "fixed inset-0 z-[999] flex h-dvh w-dvw items-center justify-center bg-[rgba(16,24,40,0.45)] px-4 py-6",
  modalPanel:
    "w-[min(520px,100%)] rounded-2xl bg-bg-box p-6 shadow-[0_18px_44px_rgba(15,23,42,0.22)]",
  modalTitle: "m-0 text-xl font-bold text-text-primary",
  modalDescription:
    "mt-2 mb-0 min-h-[48px] whitespace-pre-line text-body text-text-secondary",
  modalGrid: "mt-4 grid grid-cols-2 gap-3 max-sm:grid-cols-1",
  modalField: "flex min-w-0 flex-col gap-2",
  modalLabel: "text-description font-semibold text-text-primary",
  modalSelect:
    "h-11 rounded-base border border-border-light bg-bg-box px-3 text-body font-semibold text-text-primary outline-hidden focus:ring-2 focus:ring-[#1a237e]",
  modalTextarea:
    "mt-4 min-h-[140px] w-full resize-y rounded-base border border-border-light p-3 text-body text-text-primary outline-hidden focus:ring-2 focus:ring-[#1a237e]",
  modalError:
    "mt-2 mb-0 min-h-[18px] text-description font-semibold text-[#b91c1c]",
  modalActions: "mt-5 flex justify-end gap-2",
  modalButton:
    "h-10 min-w-[88px] cursor-pointer rounded-base px-4 text-body font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
  modalPrimary:
    "border border-button-blue-bg bg-button-blue-bg text-text-white hover:not-disabled:bg-button-blue-hover-bg",
  modalSecondary:
    "border border-border-light bg-bg-navbar text-text-secondary hover:not-disabled:bg-[#e5e7eb]",
  filterButton:
    "mx-auto flex min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-base px-2 py-1 text-description font-semibold text-text-primary transition hover:bg-[#e5e7eb] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1a237e]",
} as const;

function formatCreatedAt(createdAt: string) {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return createdAt;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function SummaryText({ summary }: { summary: string }) {
  const summaryRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const summaryElement = summaryRef.current;

    if (!summaryElement) {
      setIsOverflowing(false);
      return;
    }

    const updateOverflowState = () => {
      const nextIsOverflowing =
        summaryElement.scrollWidth > summaryElement.clientWidth ||
        summaryElement.scrollHeight > summaryElement.clientHeight;

      setIsOverflowing((currentIsOverflowing) =>
        currentIsOverflowing === nextIsOverflowing
          ? currentIsOverflowing
          : nextIsOverflowing,
      );
    };

    updateOverflowState();

    const resizeObserver = new ResizeObserver(updateOverflowState);
    resizeObserver.observe(summaryElement);
    window.addEventListener("resize", updateOverflowState);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateOverflowState);
    };
  }, [summary]);

  return (
    <span
      className={`${listCellClasses.twoLineKeepAll} text-description text-text-secondary`}
      ref={summaryRef}
      title={isOverflowing ? summary : undefined}
    >
      {summary}
    </span>
  );
}

function ClassificationReasonModal({
  draft,
  disabled,
  onClose,
  onDomainChange,
  onReasonChange,
  onSeverityChange,
  onSubmit,
}: {
  draft: ClassificationDraft;
  disabled: boolean;
  onClose: () => void;
  onDomainChange: (domain: AdminInquiryDomain) => void;
  onReasonChange: (reason: string) => void;
  onSeverityChange: (severity: AdminInquirySeverity) => void;
  onSubmit: () => void;
}) {
  const titleId = useId();
  const firstFieldRef = useRef<HTMLSelectElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const draftFocusKey = draft
    ? `${draft.inquiry.inquiryId}-${draft.field}`
    : null;

  useEffect(() => {
    if (!draftFocusKey) {
      return;
    }

    previouslyFocusedElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    firstFieldRef.current?.focus();

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
  }, [draftFocusKey, onClose]);

  if (!draft) {
    return null;
  }

  const reason = draft.reason;
  const reasonInvalid = reason.trim().length === 0;
  const editingDomain = draft.field === "domain";
  const fieldLabel = editingDomain ? "도메인" : "심각도";
  const unchanged = editingDomain
    ? draft.domain === draft.inquiry.domain
    : draft.severity === draft.inquiry.severity;
  const errorMessage = reasonInvalid
    ? "분류 수정 사유를 입력해 주세요."
    : unchanged
      ? `${fieldLabel}을(를) 변경해 주세요.`
      : "";

  return (
    <div className={inquiryListClasses.modalForm} onClick={onClose}>
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className={inquiryListClasses.modalPanel}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <h2 className={inquiryListClasses.modalTitle} id={titleId}>
          문의 분류 수정
        </h2>
        <p className={inquiryListClasses.modalDescription}>
          {`"${draft.inquiry.title}" 문의의 ${fieldLabel}을(를) 선택하고 수정 사유를 입력해 주세요.`}
        </p>
        <div className={inquiryListClasses.modalGrid}>
          {editingDomain ? (
            <label className={inquiryListClasses.modalField}>
              <span className={inquiryListClasses.modalLabel}>도메인</span>
              <select
                className={inquiryListClasses.modalSelect}
                disabled={disabled}
                onChange={(event) =>
                  onDomainChange(event.target.value as AdminInquiryDomain)
                }
                ref={firstFieldRef}
                value={draft.domain}
              >
                {adminInquiryDomainOptions.map(([optionValue, optionLabel]) => (
                  <option key={optionValue} value={optionValue}>
                    {optionLabel}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className={inquiryListClasses.modalField}>
              <span className={inquiryListClasses.modalLabel}>심각도</span>
              <select
                className={inquiryListClasses.modalSelect}
                disabled={disabled}
                onChange={(event) =>
                  onSeverityChange(event.target.value as AdminInquirySeverity)
                }
                ref={firstFieldRef}
                value={draft.severity}
              >
                {adminInquirySeverityOptions.map(
                  ([optionValue, optionLabel]) => (
                    <option key={optionValue} value={optionValue}>
                      {optionLabel}
                    </option>
                  ),
                )}
              </select>
            </label>
          )}
        </div>
        <textarea
          className={inquiryListClasses.modalTextarea}
          disabled={disabled}
          maxLength={300}
          onChange={(event) => onReasonChange(event.target.value)}
          placeholder="예: 문제 제출 결과 미노출은 강의가 아니라 문제 도메인 이슈로 봐야 함"
          ref={textareaRef}
          value={reason}
        />
        <p className={inquiryListClasses.modalError}>{errorMessage}</p>
        <div className={inquiryListClasses.modalActions}>
          <button
            className={`${inquiryListClasses.modalButton} ${inquiryListClasses.modalSecondary}`}
            disabled={disabled}
            onClick={onClose}
            type="button"
          >
            취소
          </button>
          <button
            className={`${inquiryListClasses.modalButton} ${inquiryListClasses.modalPrimary}`}
            disabled={disabled || reasonInvalid || unchanged}
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

// 문의 목록 헤더용 필터: 공용 FilterDropdown에 이 화면의 트리거 스타일만 주입
function FilterHeader<T extends FilterDropdownValue>({
  includeAll = true,
  label,
  onChange,
  options,
  value,
}: {
  includeAll?: boolean;
  label: string;
  onChange: (value: T | "") => void;
  options: Array<FilterDropdownOption<T>>;
  value: T | "";
}) {
  return (
    <FilterDropdown
      buttonClassName={inquiryListClasses.filterButton}
      className="mx-auto w-full"
      includeAll={includeAll}
      label={label}
      menuMinWidth={168}
      onChange={onChange}
      options={options}
      value={value}
    />
  );
}

export default function AdminInquiriesClient() {
  const router = useRouter();
  const [filteredTab, setFilteredTab] = useState<InquiryFilteredTab>("normal");
  const [domain, setDomain] = useState<AdminInquiryDomain | "">("");
  const [severity, setSeverity] = useState<AdminInquirySeverity | "">("");
  const [status, setStatus] = useState<AdminInquiryStatus | "">("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [inquiries, setInquiries] = useState<AdminInquirySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [processingClassification, setProcessingClassification] =
    useState(false);
  const [classificationDraft, setClassificationDraft] =
    useState<ClassificationDraft>(null);
  const [classificationConfirmOpen, setClassificationConfirmOpen] =
    useState(false);
  const [noticeModal, setNoticeModal] = useState({
    isOpen: false,
    title: "",
    content: "",
  });

  const resetPage = useCallback(() => {
    setPage(0);
  }, []);

  const domainOptions = useMemo(
    () =>
      adminInquiryDomainOptions.map(([value, label]) => ({
        label,
        value,
        swatchClassName: domainSwatchClasses[value],
      })),
    [],
  );

  const severityOptions = useMemo(
    () =>
      adminInquirySeverityOptions.map(([value, label]) => ({
        label,
        value,
        swatchClassName: severitySwatchClasses[value],
      })),
    [],
  );

  const statusOptions = useMemo(
    () =>
      adminInquiryStatusOptions.map(([value, label]) => ({
        label,
        value,
        swatchClassName: statusSwatchClasses[value],
      })),
    [],
  );

  const openClassificationModal = useCallback(
    (inquiry: AdminInquirySummary, field: ClassificationField) => {
      if (processingClassification) {
        return;
      }

      setClassificationDraft({
        domain: inquiry.domain,
        field,
        inquiry,
        reason: "",
        severity: inquiry.severity,
      });
    },
    [processingClassification],
  );

  const closeClassificationReason = useCallback(() => {
    if (processingClassification) {
      return;
    }

    setClassificationDraft(null);
    setClassificationConfirmOpen(false);
  }, [processingClassification]);

  const handleClassificationReasonChange = useCallback((reason: string) => {
    setClassificationDraft((currentDraft) =>
      currentDraft ? { ...currentDraft, reason } : currentDraft,
    );
  }, []);

  const handleClassificationDomainChange = useCallback(
    (domain: AdminInquiryDomain) => {
      setClassificationDraft((currentDraft) =>
        currentDraft ? { ...currentDraft, domain } : currentDraft,
      );
    },
    [],
  );

  const handleClassificationSeverityChange = useCallback(
    (severity: AdminInquirySeverity) => {
      setClassificationDraft((currentDraft) =>
        currentDraft ? { ...currentDraft, severity } : currentDraft,
      );
    },
    [],
  );

  const requestClassificationConfirm = useCallback(() => {
    if (
      !classificationDraft?.reason.trim() ||
      (classificationDraft.field === "domain"
        ? classificationDraft.domain === classificationDraft.inquiry.domain
        : classificationDraft.severity === classificationDraft.inquiry.severity)
    ) {
      return;
    }

    setClassificationConfirmOpen(true);
  }, [classificationDraft]);

  const handleClassificationConfirm = useCallback(async () => {
    if (!classificationDraft || processingClassification) {
      return;
    }

    const trimmedReason = classificationDraft.reason.trim();

    if (!trimmedReason) {
      setClassificationConfirmOpen(false);
      return;
    }

    setProcessingClassification(true);

    try {
      const result = await updateAdminInquiryClassification(
        classificationDraft.inquiry.inquiryId,
        {
          domain: classificationDraft.domain,
          reason: trimmedReason,
          severity: classificationDraft.severity,
        },
      );
      const updatedInquiry =
        result.data ??
        ({
          ...classificationDraft.inquiry,
          domain: classificationDraft.domain,
          severity: classificationDraft.severity,
        } satisfies AdminInquirySummary);

      setInquiries((currentInquiries) =>
        currentInquiries.map((inquiry) =>
          inquiry.inquiryId === updatedInquiry.inquiryId
            ? updatedInquiry
            : inquiry,
        ),
      );
      setClassificationConfirmOpen(false);
      setClassificationDraft(null);
      setNoticeModal({
        isOpen: true,
        title: "문의 분류 수정 완료",
        content: "문의 도메인과 심각도가 수정되었습니다.",
      });
    } catch (error) {
      handleClientError(error, {
        router,
        fallbackTitle: "문의 분류 수정 실패",
        fallbackMessage:
          "문의 분류를 수정하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        showModal: (title, content) =>
          setNoticeModal({
            isOpen: true,
            title,
            content,
          }),
      });
    } finally {
      setProcessingClassification(false);
    }
  }, [classificationDraft, processingClassification, router]);

  const renderDomainCell = useCallback(
    (inquiry: AdminInquirySummary) => (
      <button
        className={`${inquiryListClasses.badge} ${
          inquiryListClasses.editableBadge
        } ${domainColorClasses[inquiry.domain]}`}
        disabled={processingClassification}
        onClick={(event) => {
          event.stopPropagation();
          openClassificationModal(inquiry, "domain");
        }}
        type="button"
      >
        {adminInquiryDomainLabels[inquiry.domain] ?? inquiry.domain}
      </button>
    ),
    [openClassificationModal, processingClassification],
  );

  const renderSeverityCell = useCallback(
    (inquiry: AdminInquirySummary) => (
      <button
        className={`${inquiryListClasses.badge} ${
          inquiryListClasses.editableBadge
        } ${severityColorClasses[inquiry.severity]}`}
        disabled={processingClassification}
        onClick={(event) => {
          event.stopPropagation();
          openClassificationModal(inquiry, "severity");
        }}
        type="button"
      >
        {adminInquirySeverityLabels[inquiry.severity] ?? inquiry.severity}
      </button>
    ),
    [openClassificationModal, processingClassification],
  );

  const inquiryColumns = useMemo<ListColumn<AdminInquirySummary>[]>(
    () => [
      { key: "index", label: "번호", width: "72px" },
      {
        key: "title",
        label: "문의 내용",
        cellClassName: inquiryListClasses.titleCell,
        width: "34%",
        render: (inquiry) => (
          <div className="flex min-w-0 flex-col gap-1 text-left">
            <strong className="truncate text-body text-text-primary">
              {inquiry.title}
            </strong>
            <SummaryText summary={inquiry.summary} />
          </div>
        ),
      },
      {
        key: "domain",
        label: (
          <FilterHeader
            label="도메인"
            onChange={(nextDomain) => {
              setDomain(nextDomain);
              resetPage();
            }}
            options={domainOptions}
            value={domain}
          />
        ),
        title: (inquiry) =>
          adminInquiryDomainLabels[inquiry.domain] ?? inquiry.domain,
        width: "150px",
        render: renderDomainCell,
      },
      {
        key: "severity",
        label: (
          <FilterHeader
            label="심각도"
            onChange={(nextSeverity) => {
              setSeverity(nextSeverity);
              resetPage();
            }}
            options={severityOptions}
            value={severity}
          />
        ),
        title: (inquiry) =>
          adminInquirySeverityLabels[inquiry.severity] ?? inquiry.severity,
        width: "116px",
        render: renderSeverityCell,
      },
      {
        key: "status",
        label: (
          <FilterHeader
            label="상태"
            onChange={(nextStatus) => {
              setStatus(nextStatus);
              resetPage();
            }}
            options={statusOptions}
            value={status}
          />
        ),
        title: (inquiry) =>
          adminInquiryStatusLabels[inquiry.status] ?? inquiry.status,
        width: "124px",
        render: (inquiry) => (
          <span
            className={`${inquiryListClasses.badge} ${
              statusColorClasses[inquiry.status]
            }`}
          >
            {adminInquiryStatusLabels[inquiry.status] ?? inquiry.status}
          </span>
        ),
      },
      {
        key: "createdAt",
        label: "등록일",
        title: (inquiry) => formatCreatedAt(inquiry.createdAt),
        width: "150px",
        render: (inquiry) => formatCreatedAt(inquiry.createdAt),
      },
    ],
    [
      domain,
      domainOptions,
      renderDomainCell,
      renderSeverityCell,
      resetPage,
      severity,
      severityOptions,
      status,
      statusOptions,
    ],
  );

  useEffect(() => {
    const controller = new AbortController();

    const fetchInquiries = async () => {
      try {
        setLoading(true);

        const result = await getAdminInquiries(
          {
            isFiltered: filteredTab === "filtered",
            domain,
            severity,
            status,
            page,
            size: ADMIN_INQUIRY_PAGE_SIZE,
          },
          controller.signal,
        );

        setInquiries(result.data?.content ?? []);
        setTotalPages(result.data?.totalPages ?? 1);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        handleClientError(error, {
          router,
          fallbackTitle: "문의사항을 불러오지 못했습니다.",
          fallbackMessage: "잠시 후 다시 시도해 주세요.",
          showModal: (title, content) =>
            setNoticeModal({
              isOpen: true,
              title,
              content,
            }),
        });
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setHasLoaded(true);
        }
      }
    };

    void fetchInquiries();

    return () => controller.abort();
  }, [domain, filteredTab, page, router, severity, status]);

  return (
    <>
      <section className={inquiryListClasses.container}>
        <div className={inquiryListClasses.header}>
          <div className={inquiryListClasses.titleGroup}>
            <h1 className={inquiryListClasses.title}>문의사항 관리</h1>
          </div>
        </div>

        <div className={inquiryListClasses.filterBar}>
          <div
            aria-label="문의 목록 구분"
            className={inquiryListClasses.tabGroup}
          >
            {filteredOptions.map((tab) => (
              <button
                aria-pressed={filteredTab === tab.value}
                className={`${inquiryListClasses.tabButton} ${
                  filteredTab === tab.value ? inquiryListClasses.activeTab : ""
                }`}
                key={tab.value}
                onClick={() => {
                  setFilteredTab(tab.value);
                  resetPage();
                }}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading && !hasLoaded ? (
          <ListSkeleton
            columns={[
              "번호",
              "문의 내용",
              "도메인",
              "심각도",
              "상태",
              "등록일",
            ]}
            rowCount={ADMIN_INQUIRY_PAGE_SIZE}
            statusMessage="문의사항 목록을 불러오는 중입니다."
          />
        ) : (
          <List
            columns={inquiryColumns}
            data={inquiries}
            emptyMessage="조회된 문의사항이 없습니다."
            onRowClick={(inquiry) =>
              router.push(`/admin/cs/${inquiry.inquiryId}`)
            }
            pagination={
              <Pagination
                currentPage={page}
                disabled={loading}
                onPageChange={setPage}
                totalPages={totalPages}
              />
            }
            rowNumberOffset={page * ADMIN_INQUIRY_PAGE_SIZE}
            rowKey={(inquiry) => inquiry.inquiryId}
          />
        )}
      </section>

      <ClassificationReasonModal
        disabled={processingClassification}
        draft={classificationConfirmOpen ? null : classificationDraft}
        onClose={closeClassificationReason}
        onDomainChange={handleClassificationDomainChange}
        onReasonChange={handleClassificationReasonChange}
        onSeverityChange={handleClassificationSeverityChange}
        onSubmit={requestClassificationConfirm}
      />

      <TwoButtonModal
        cancelDisabled={processingClassification}
        confirmDisabled={processingClassification}
        isOpen={classificationConfirmOpen && classificationDraft !== null}
        modalContent={
          classificationDraft
            ? classificationDraft.field === "domain"
              ? `도메인: ${
                  adminInquiryDomainLabels[classificationDraft.inquiry.domain]
                } → ${
                  adminInquiryDomainLabels[classificationDraft.domain]
                }\n\n입력한 사유로 문의 도메인을 수정하시겠습니까?`
              : `심각도: ${
                  adminInquirySeverityLabels[
                    classificationDraft.inquiry.severity
                  ]
                } → ${
                  adminInquirySeverityLabels[classificationDraft.severity]
                }\n\n입력한 사유로 문의 심각도를 수정하시겠습니까?`
            : undefined
        }
        modalTitle="문의 분류를 수정할까요?"
        onClose={() => {
          if (!processingClassification) {
            setClassificationConfirmOpen(false);
          }
        }}
        onConfirm={handleClassificationConfirm}
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
    </>
  );
}
