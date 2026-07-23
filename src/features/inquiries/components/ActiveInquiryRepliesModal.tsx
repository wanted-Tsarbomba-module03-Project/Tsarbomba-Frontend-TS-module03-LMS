"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import OneButtonModal from "@/components/common/OneButtonModal";
import { handleClientError } from "@/lib/errorHandling";

import {
  getActiveInquiryReplies,
  markInquiryReplyVisible,
  type ActiveInquiryReply,
} from "../actions";

const replyModalClasses = {
  overlay:
    "fixed inset-0 z-[999] flex h-dvh w-dvw items-center justify-center bg-[rgba(16,24,40,0.45)] px-4 py-6",
  panel:
    "flex max-h-[calc(100dvh-48px)] w-[min(680px,100%)] flex-col rounded-2xl bg-bg-box shadow-[0_18px_44px_rgba(15,23,42,0.22)]",
  header: "border-b border-border-light px-6 py-5 max-md:px-4",
  title: "m-0 text-xl font-bold text-text-primary",
  description:
    "mt-2 mb-0 break-keep text-body leading-6 text-text-secondary",
  body: "flex-1 overflow-y-auto px-6 py-4 max-md:px-4",
  list: "m-0 flex list-none flex-col gap-4 p-0",
  item: "rounded-base border border-border-light bg-bg-navbar p-4",
  itemTitle: "m-0 text-title-md font-bold text-text-primary",
  meta: "mt-1 text-description text-text-secondary",
  block: "mt-3",
  label: "mb-1 text-description font-semibold text-text-secondary",
  text: "m-0 whitespace-pre-wrap break-keep text-body leading-7 text-text-primary",
  footer:
    "flex justify-end border-t border-border-light px-6 py-4 max-md:px-4",
  button:
    "h-10 min-w-[96px] cursor-pointer rounded-base border border-button-blue-bg bg-button-blue-bg px-4 text-body font-semibold text-text-white transition hover:not-disabled:bg-button-blue-hover-bg disabled:cursor-not-allowed disabled:border-border-light disabled:bg-[#d1d5db] disabled:text-[#6b7280]",
} as const;

export default function ActiveInquiryRepliesModal({
  enabled,
}: {
  enabled: boolean;
}) {
  const router = useRouter();
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const [replies, setReplies] = useState<ActiveInquiryReply[]>([]);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [noticeModal, setNoticeModal] = useState({
    isOpen: false,
    title: "",
    content: "",
  });

  useEffect(() => {
    if (!enabled) {
      const resetTimer = window.setTimeout(() => {
        setOpen(false);
        setReplies([]);
      }, 0);

      return () => window.clearTimeout(resetTimer);
    }

    const controller = new AbortController();

    const fetchReplies = async () => {
      try {
        const result = await getActiveInquiryReplies(controller.signal);
        const nextReplies = result.data?.replies ?? [];

        if (controller.signal.aborted) {
          return;
        }

        if (nextReplies.length === 0) {
          setOpen(false);
          setReplies([]);
          return;
        }

        setReplies(nextReplies);
        setOpen(true);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        handleClientError(error, {
          router,
          fallbackTitle: "문의 답변을 확인하지 못했습니다.",
          fallbackMessage: "잠시 후 다시 시도해 주세요.",
          showModal: (title, content) =>
            setNoticeModal({
              isOpen: true,
              title,
              content,
            }),
        });
      }
    };

    void fetchReplies();

    return () => controller.abort();
  }, [enabled, router]);

  const closeReplies = useCallback(async () => {
    if (closing) {
      return;
    }

    setClosing(true);

    try {
      const results = await Promise.allSettled(
        replies.map((reply) => markInquiryReplyVisible(reply.inquiryId)),
      );
      const failedReplies = replies.filter(
        (_, index) => results[index]?.status === "rejected",
      );

      if (failedReplies.length > 0) {
        setReplies(failedReplies);
        setOpen(true);
        setNoticeModal({
          isOpen: true,
          title: "문의 답변 확인 처리 실패",
          content:
            "일부 답변을 확인 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        });
        return;
      }

      setOpen(false);
      setReplies([]);
    } finally {
      setClosing(false);
    }
  }, [closing, replies]);

  useEffect(() => {
    if (!enabled || !open || replies.length === 0) {
      return;
    }

    previouslyFocusedElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        void closeReplies();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = closeButtonRef.current
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
  }, [closeReplies, enabled, open, replies.length]);

  return (
    <>
      {enabled && open && replies.length > 0 && (
        <div className={replyModalClasses.overlay}>
          <section
            aria-modal="true"
            aria-labelledby={titleId}
            className={replyModalClasses.panel}
            role="dialog"
          >
            <header className={replyModalClasses.header}>
              <h2 className={replyModalClasses.title} id={titleId}>
                문의 답변이 도착했습니다
              </h2>
              <p className={replyModalClasses.description}>
                확인하지 않은 문의 답변을 확인해 주세요.
              </p>
            </header>
            <div className={replyModalClasses.body}>
              <ul className={replyModalClasses.list}>
                {replies.map((reply) => (
                  <li className={replyModalClasses.item} key={reply.inquiryId}>
                    <h3 className={replyModalClasses.itemTitle}>
                      {reply.title}
                    </h3>
                    <div className={replyModalClasses.meta}>
                      답변일: {formatDateTime(reply.repliedAt)}
                    </div>
                    <div className={replyModalClasses.block}>
                      <div className={replyModalClasses.label}>문의 내용</div>
                      <p className={replyModalClasses.text}>{reply.content}</p>
                    </div>
                    <div className={replyModalClasses.block}>
                      <div className={replyModalClasses.label}>관리자 답변</div>
                      <p className={replyModalClasses.text}>
                        {reply.adminReply}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <footer className={replyModalClasses.footer}>
              <button
                className={replyModalClasses.button}
                disabled={closing}
                onClick={() => void closeReplies()}
                ref={closeButtonRef}
                type="button"
              >
                닫기
              </button>
            </footer>
          </section>
        </div>
      )}

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
