"use client";

// 채팅 메시지 좋아요/싫어요(피드백) 토글 - 낙관적 업데이트 + 실패 시 롤백.
// User/Course 문제풀이 채팅에서 동일 로직을 공유한다.
import { useCallback, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";

import { handleClientError } from "@/lib/errorHandling";

import {
  deleteProblemMessageFeedback,
  setProblemMessageFeedback,
} from "../actions";
import type { ChatMessage, FeedbackRating } from "../types";

interface UseProblemChatFeedbackParams {
  chatMessages: ChatMessage[];
  setChatMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  feedbackPendingIds: Set<number>;
  setFeedbackPendingIds: Dispatch<SetStateAction<Set<number>>>;
  showError: (title: string, content: string) => void;
}

export function useProblemChatFeedback({
  chatMessages,
  setChatMessages,
  feedbackPendingIds,
  setFeedbackPendingIds,
  showError,
}: UseProblemChatFeedbackParams) {
  const router = useRouter();

  return useCallback(
    async (messageId: number, nextRating: FeedbackRating) => {
      if (feedbackPendingIds.has(messageId)) {
        return false;
      }

      const currentFeedback =
        chatMessages.find((message) => message.messageId === messageId)
          ?.feedback ?? null;
      const isCancel = currentFeedback === nextRating;

      setFeedbackPendingIds((prev) => new Set(prev).add(messageId));

      setChatMessages((prev) =>
        prev.map((message) =>
          message.messageId === messageId
            ? { ...message, feedback: isCancel ? null : nextRating }
            : message,
        ),
      );

      try {
        if (isCancel) {
          await deleteProblemMessageFeedback(messageId);
        } else {
          await setProblemMessageFeedback(messageId, nextRating);
        }

        return true;
      } catch (error) {
        setChatMessages((prev) =>
          prev.map((message) =>
            message.messageId === messageId
              ? { ...message, feedback: currentFeedback }
              : message,
          ),
        );
        handleClientError(error, {
          router,
          fallbackTitle: "평가 저장 실패",
          fallbackMessage:
            "메시지 평가를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
          showModal: showError,
        });

        return false;
      } finally {
        setFeedbackPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(messageId);
          return next;
        });
      }
    },
    [
      chatMessages,
      feedbackPendingIds,
      router,
      showError,
      setChatMessages,
      setFeedbackPendingIds,
    ],
  );
}
