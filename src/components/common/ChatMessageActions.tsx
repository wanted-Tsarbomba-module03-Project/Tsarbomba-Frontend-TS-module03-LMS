"use client";

import Image from "next/image";

export type ChatFeedbackRating = "UP" | "DOWN";

interface ChatCopyButtonProps {
  className?: string;
  content: string;
  onCopied?: () => void;
}

interface ChatFeedbackActionsProps {
  feedback?: ChatFeedbackRating | null;
  messageId?: number;
  onFeedback?: (
    messageId: number,
    rating: ChatFeedbackRating,
  ) => boolean | Promise<boolean>;
  onFeedbackComplete?: (message: string) => void;
}

const actionButtonClass =
  "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-base border border-transparent bg-white/70 p-1.5 transition hover:border-[#1a237e]/30 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a237e] disabled:cursor-not-allowed disabled:opacity-45";

const activeFeedbackClass =
  "scale-105 border-[#1a237e]! bg-[#dbeafe]! shadow-[0_0_0_2px_rgba(26,35,126,0.28),0_4px_10px_rgba(26,35,126,0.18)]";

async function copyMessage(content: string) {
  if (!content) {
    return false;
  }

  await navigator.clipboard?.writeText(content);
  return true;
}

export function ChatCopyButton({
  className = "",
  content,
  onCopied,
}: ChatCopyButtonProps) {
  return (
    <button
      aria-label="메시지 복사"
      className={`${actionButtonClass} shrink-0 ${className}`}
      disabled={!content}
      onClick={() => {
        void copyMessage(content)
          .then((copied) => {
            if (copied) {
              onCopied?.();
            }
          })
          .catch(() => undefined);
      }}
      type="button"
    >
      <Image alt="" height={16} src="/assets/img/copy.svg" width={16} />
    </button>
  );
}

export function ChatFeedbackActions({
  feedback,
  messageId,
  onFeedback,
  onFeedbackComplete,
}: ChatFeedbackActionsProps) {
  const canSendFeedback = messageId != null && Boolean(onFeedback);

  if (!canSendFeedback) {
    return null;
  }

  const handleFeedbackClick = (nextRating: ChatFeedbackRating) => {
    const isCancel = feedback === nextRating;

    void Promise.resolve(onFeedback?.(messageId!, nextRating))
      .then((succeeded) => {
        if (succeeded) {
          onFeedbackComplete?.(
            isCancel
              ? "평가를 취소했습니다."
              : nextRating === "UP"
                ? "도움이 됐다는 평가를 남겼습니다."
                : "아쉬웠다는 평가를 남겼습니다.",
          );
        }
      })
      .catch(() => undefined);
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        aria-label="도움이 됐어요"
        aria-pressed={feedback === "UP"}
        className={`${actionButtonClass} ${
          feedback === "UP" ? activeFeedbackClass : ""
        }`}
        onClick={() => handleFeedbackClick("UP")}
        type="button"
      >
        <Image alt="" height={16} src="/assets/img/good.svg" width={16} />
      </button>
      <button
        aria-label="아쉬웠어요"
        aria-pressed={feedback === "DOWN"}
        className={`${actionButtonClass} ${
          feedback === "DOWN" ? activeFeedbackClass : ""
        }`}
        onClick={() => handleFeedbackClick("DOWN")}
        type="button"
      >
        <Image alt="" height={16} src="/assets/img/bad.svg" width={16} />
      </button>
    </div>
  );
}
