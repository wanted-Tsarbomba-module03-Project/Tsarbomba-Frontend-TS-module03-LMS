"use client";

import { useEffect, useState } from "react";
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
      return;
    }

    const controller = new AbortController();

    const fetchReplies = async () => {
      try {
        const result = await getActiveInquiryReplies(controller.signal);
        const nextReplies = result.data?.replies ?? [];

        if (controller.signal.aborted || nextReplies.length === 0) {
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

  const closeReplies = async () => {
    if (closing) {
      return;
    }

    setClosing(true);

    try {
      await Promise.allSettled(
        replies.map((reply) => markInquiryReplyVisible(reply.inquiryId)),
      );
    } finally {
      setClosing(false);
      setOpen(false);
      setReplies([]);
    }
  };

  return (
    <>
      {enabled && open && replies.length > 0 && (
        <div className={replyModalClasses.overlay}>
          <section
            aria-modal="true"
            className={replyModalClasses.panel}
            role="dialog"
          >
            <header className={replyModalClasses.header}>
              <h2 className={replyModalClasses.title}>
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
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
