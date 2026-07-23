"use client";

// CSR - 문제풀이 챗봇 패널: 입력 높이, 전송 상태, 메시지 렌더링이 사용자 입력에 따라 즉시 바뀜
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

import {
  ChatCopyButton,
  ChatFeedbackActions,
} from "@/components/common/ChatMessageActions";
import ChatMarkdown from "@/components/common/ChatMarkdown";
import { problemChatClasses } from "@/features/chat/styles";
import { isUserMessage, resizeChatInput } from "@/features/chat/utils";

import type { ChatMessage, FeedbackRating } from "../types";

interface ProblemChatPanelProps {
  chatInput: string;
  chatMessages: ChatMessage[];
  chatOpen: boolean;
  feedbackPendingIds?: Set<number>;
  chatRoomTitleEditing?: boolean;
  chatRoomTitleInput?: string;
  chatRoomTitle?: string | null;
  chatSending: boolean;
  showChatSendingIndicator?: boolean;
  suggestedQuestions?: string[];
  canEditChatRoomTitle?: boolean;
  onChatInputChange: (value: string) => void;
  onChatRoomTitleCancel?: () => void;
  onChatRoomTitleChange?: (value: string) => void;
  onChatRoomTitleEdit?: () => void;
  onChatRoomTitleSubmit?: () => void;
  onClose: () => void;
  onFeedback?: (
    messageId: number,
    rating: FeedbackRating,
  ) => boolean | Promise<boolean>;
  onSelectSuggestedQuestion?: (question: string) => void;
  onSendChat: (message?: string) => void;
}

const DESKTOP_DRAG_MEDIA_QUERY = "(min-width: 768px)";
const DRAG_VIEWPORT_MARGIN = 12;
const SCROLL_FOLLOW_THRESHOLD = 96;

interface DragPosition {
  x: number;
  y: number;
}

interface DragListeners {
  onPointerMove: (event: PointerEvent) => void;
  onPointerUp: () => void;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export default function ProblemChatPanel({
  chatInput,
  chatMessages,
  chatOpen,
  feedbackPendingIds,
  chatRoomTitleEditing = false,
  chatRoomTitleInput = "",
  chatRoomTitle,
  chatSending,
  showChatSendingIndicator = chatSending,
  suggestedQuestions = [],
  canEditChatRoomTitle = false,
  onChatInputChange,
  onChatRoomTitleCancel,
  onChatRoomTitleChange,
  onChatRoomTitleEdit,
  onChatRoomTitleSubmit,
  onClose,
  onFeedback,
  onSelectSuggestedQuestion,
  onSendChat,
}: ProblemChatPanelProps) {
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const chatPanelRef = useRef<HTMLElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef(chatMessages.length);
  const previousSendingIndicatorRef = useRef(showChatSendingIndicator);
  const shouldFollowScrollRef = useRef(true);
  const userScrollIntentRef = useRef(false);
  const userScrollIntentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const dragPointerOffsetRef = useRef<DragPosition | null>(null);
  const dragListenersRef = useRef<DragListeners | null>(null);
  const chatToastTimerRef = useRef<number | null>(null);
  const [dragPosition, setDragPosition] = useState<DragPosition | null>(null);
  const [chatToastMessage, setChatToastMessage] = useState("");
  const isChatDisabled = chatSending || !chatOpen;

  useEffect(() => {
    resizeChatInput(chatInputRef.current);
  }, [chatInput]);

  useEffect(() => {
    return () => {
      if (chatToastTimerRef.current) {
        clearTimeout(chatToastTimerRef.current);
      }
    };
  }, []);

  const getClampedDragPosition = useCallback(
    (clientX: number, clientY: number): DragPosition | null => {
      const panel = chatPanelRef.current;
      const offset = dragPointerOffsetRef.current;

      if (!panel || !offset) {
        return null;
      }

      const panelRect = panel.getBoundingClientRect();
      const minViewportX = DRAG_VIEWPORT_MARGIN;
      const minViewportY = DRAG_VIEWPORT_MARGIN;
      const maxViewportX =
        window.innerWidth - panelRect.width - DRAG_VIEWPORT_MARGIN;
      const maxViewportY =
        window.innerHeight - panelRect.height - DRAG_VIEWPORT_MARGIN;
      const nextViewportX = clamp(
        clientX - offset.x,
        minViewportX,
        Math.max(minViewportX, maxViewportX),
      );
      const nextViewportY = clamp(
        clientY - offset.y,
        minViewportY,
        Math.max(minViewportY, maxViewportY),
      );

      return {
        x: nextViewportX,
        y: nextViewportY,
      };
    },
    [],
  );

  const updateShouldFollowScroll = useCallback(() => {
    const container = chatMessagesRef.current;

    if (!container) {
      shouldFollowScrollRef.current = true;
      return;
    }

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    shouldFollowScrollRef.current = distanceFromBottom <= SCROLL_FOLLOW_THRESHOLD;
  }, []);

  const markUserScrollIntent = useCallback(() => {
    userScrollIntentRef.current = true;

    if (userScrollIntentTimerRef.current) {
      clearTimeout(userScrollIntentTimerRef.current);
    }

    userScrollIntentTimerRef.current = setTimeout(() => {
      userScrollIntentRef.current = false;
      userScrollIntentTimerRef.current = null;
    }, 150);
  }, []);

  const handleMessageScroll = useCallback(() => {
    if (!userScrollIntentRef.current) {
      return;
    }

    updateShouldFollowScroll();
  }, [updateShouldFollowScroll]);

  const scrollToLatestMessage = useCallback((behavior: ScrollBehavior) => {
    scrollAnchorRef.current?.scrollIntoView({
      behavior,
      block: "end",
    });
  }, []);

  useEffect(() => {
    if (!chatOpen) {
      return;
    }

    const previousMessageCount = previousMessageCountRef.current;
    const previousSendingIndicator = previousSendingIndicatorRef.current;
    const hasNewMessage = chatMessages.length > previousMessageCount;
    const hasNewSendingIndicator =
      showChatSendingIndicator && !previousSendingIndicator;

    previousMessageCountRef.current = chatMessages.length;
    previousSendingIndicatorRef.current = showChatSendingIndicator;

    if (hasNewMessage || hasNewSendingIndicator) {
      shouldFollowScrollRef.current = true;
      scrollToLatestMessage(hasNewMessage ? "smooth" : "auto");
      return;
    }

    if (shouldFollowScrollRef.current) {
      scrollToLatestMessage("auto");
    }
  }, [
    chatMessages,
    chatOpen,
    scrollToLatestMessage,
    showChatSendingIndicator,
  ]);

  useEffect(() => {
    if (!chatOpen) {
      shouldFollowScrollRef.current = true;
      userScrollIntentRef.current = false;
    }
  }, [chatOpen]);

  useEffect(() => {
    return () => {
      if (userScrollIntentTimerRef.current) {
        clearTimeout(userScrollIntentTimerRef.current);
      }
    };
  }, []);

  const endDrag = useCallback(() => {
    const listeners = dragListenersRef.current;

    if (listeners) {
      window.removeEventListener("pointermove", listeners.onPointerMove);
      window.removeEventListener("pointerup", listeners.onPointerUp);
      dragListenersRef.current = null;
    }

    dragPointerOffsetRef.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => endDrag, [endDrag]);

  const handleDragStart = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!window.matchMedia(DESKTOP_DRAG_MEDIA_QUERY).matches) {
        return;
      }

      const target = event.target as HTMLElement;

      if (target.closest("button, input, textarea")) {
        return;
      }

      const panel = chatPanelRef.current;

      if (!panel) {
        return;
      }

      event.preventDefault();
      endDrag();

      const panelRect = panel.getBoundingClientRect();
      dragPointerOffsetRef.current = {
        x: event.clientX - panelRect.left,
        y: event.clientY - panelRect.top,
      };

      const nextPosition = getClampedDragPosition(event.clientX, event.clientY);

      if (nextPosition) {
        setDragPosition(nextPosition);
      }

      const handlePointerMove = (pointerEvent: PointerEvent) => {
        const clampedPosition = getClampedDragPosition(
          pointerEvent.clientX,
          pointerEvent.clientY,
        );

        if (clampedPosition) {
          setDragPosition(clampedPosition);
        }
      };

      const handlePointerUp = () => {
        endDrag();
      };

      document.body.style.cursor = "move";
      document.body.style.userSelect = "none";
      dragListenersRef.current = {
        onPointerMove: handlePointerMove,
        onPointerUp: handlePointerUp,
      };
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp, { once: true });
    },
    [endDrag, getClampedDragPosition],
  );

  useEffect(() => {
    const handleResize = () => {
      if (!dragPosition) {
        return;
      }

      const panel = chatPanelRef.current;

      if (!panel) {
        return;
      }

      if (!window.matchMedia(DESKTOP_DRAG_MEDIA_QUERY).matches) {
        setDragPosition(null);
        return;
      }

      const panelRect = panel.getBoundingClientRect();
      const minX = DRAG_VIEWPORT_MARGIN;
      const minY = DRAG_VIEWPORT_MARGIN;
      const maxX =
        window.innerWidth -
        panelRect.width -
        DRAG_VIEWPORT_MARGIN;
      const maxY =
        window.innerHeight -
        panelRect.height -
        DRAG_VIEWPORT_MARGIN;

      setDragPosition({
        x: clamp(dragPosition.x, minX, Math.max(minX, maxX)),
        y: clamp(dragPosition.y, minY, Math.max(minY, maxY)),
      });
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [dragPosition]);

  const panelStyle = useMemo<CSSProperties | undefined>(() => {
    if (!dragPosition) {
      return undefined;
    }

    return {
      left: `${dragPosition.x}px`,
      right: "auto",
      top: `${dragPosition.y}px`,
    };
  }, [dragPosition]);

  const showChatToast = useCallback((message: string) => {
    if (chatToastTimerRef.current) {
      clearTimeout(chatToastTimerRef.current);
    }

    setChatToastMessage(message);
    chatToastTimerRef.current = window.setTimeout(() => {
      setChatToastMessage("");
      chatToastTimerRef.current = null;
    }, 1800);
  }, []);

  return (
    <aside
      aria-hidden={!chatOpen}
      className={`${problemChatClasses.chatPanel} ${
        chatOpen ? problemChatClasses.open : problemChatClasses.closed
      }`}
      ref={chatPanelRef}
      style={panelStyle}
    >
      <div
        className={`${problemChatClasses.chatHeader} ${problemChatClasses.chatHeaderDraggable}`}
        onPointerDown={handleDragStart}
      >
        <span
          aria-hidden="true"
          className={problemChatClasses.chatDragHint}
        />
        <span className={problemChatClasses.chatHeaderTitle}>
          문제풀이 챗봇
        </span>
        <button
          aria-label="채팅창 닫기"
          className={problemChatClasses.closeButton}
          onClick={onClose}
          type="button"
        >
          <span aria-hidden="true">×</span>
        </button>
        {chatRoomTitle && (
          <span className={problemChatClasses.chatRoomTitleRow}>
            {chatRoomTitleEditing ? (
              <>
                <input
                  aria-label="채팅방 이름"
                  className={problemChatClasses.chatRoomTitleInput}
                  maxLength={80}
                  onChange={(event) =>
                    onChatRoomTitleChange?.(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      onChatRoomTitleSubmit?.();
                    }

                    if (event.key === "Escape") {
                      onChatRoomTitleCancel?.();
                    }
                  }}
                  value={chatRoomTitleInput}
                />
                <button
                  className={problemChatClasses.titleActionButton}
                  onClick={onChatRoomTitleSubmit}
                  type="button"
                >
                  저장
                </button>
                <button
                  className={problemChatClasses.titleCancelButton}
                  onClick={onChatRoomTitleCancel}
                  type="button"
                >
                  취소
                </button>
              </>
            ) : (
              <>
                <span className={problemChatClasses.chatRoomTitle}>
                  {chatRoomTitle}
                </span>
                {canEditChatRoomTitle && (
                  <button
                    aria-label="채팅방 이름 수정"
                    className={problemChatClasses.editTitleButton}
                    onClick={onChatRoomTitleEdit}
                    type="button"
                  >
                    <Image
                      alt=""
                      height={20}
                      src="/assets/img/edit-Icon.svg"
                      width={20}
                    />
                  </button>
                )}
              </>
            )}
          </span>
        )}
      </div>

      <div
        className={problemChatClasses.chatMessages}
        onPointerDown={markUserScrollIntent}
        onScroll={handleMessageScroll}
        onTouchMove={markUserScrollIntent}
        onWheel={markUserScrollIntent}
        ref={chatMessagesRef}
      >
        {chatMessages.map((message, index) => {
          if (!isUserMessage(message) && !message.content) {
            return null;
          }

          const isUser = isUserMessage(message);
          const isAssistant = !isUser && !message.error;

          return (
            <div
              className={`${problemChatClasses.chatMessageWrap} ${
                isUser
                  ? problemChatClasses.userMessageWrap
                  : problemChatClasses.assistantMessageWrap
              }`}
              key={message.clientId ?? `${message.role}-${index}`}
            >
              <div className="group/message flex max-w-[94%] min-w-0 flex-col">
                <div
                  className={`${problemChatClasses.chatMessage} max-w-none! ${
                    isUser
                      ? problemChatClasses.userMessage
                      : problemChatClasses.assistantMessage
                  } ${message.error ? problemChatClasses.errorMessage : ""}`}
                >
                  {isAssistant ? (
                    <ChatMarkdown content={message.content} />
                  ) : (
                    message.content
                  )}
                </div>
                <div
                  className={`mt-1.5 flex items-center gap-2 ${
                    isAssistant ? "justify-start" : "justify-end"
                  }`}
                >
                  {isAssistant ? (
                    <ChatFeedbackActions
                      disabled={
                        message.messageId != null &&
                        feedbackPendingIds?.has(message.messageId)
                      }
                      feedback={message.feedback}
                      messageId={message.messageId}
                      onFeedback={onFeedback}
                      onFeedbackComplete={showChatToast}
                    />
                  ) : (
                    <span aria-hidden="true" />
                  )}
                  <ChatCopyButton
                    content={message.content}
                    className="opacity-0 transition-opacity group-hover/message:opacity-100 group-focus-within/message:opacity-100"
                    onCopyFailed={() =>
                      showChatToast("메시지를 복사하지 못했습니다.")
                    }
                    onCopied={() => showChatToast("메시지를 복사했습니다.")}
                  />
                </div>
              </div>
            </div>
          );
        })}
        {showChatSendingIndicator && (
          <div
            className={`${problemChatClasses.chatMessageWrap} ${problemChatClasses.assistantMessageWrap}`}
          >
            <div
              aria-live="polite"
              className={`${problemChatClasses.chatMessage} ${problemChatClasses.assistantMessage}`}
              role="status"
            >
              <span className={problemChatClasses.spinnerWrap}>
                <span
                  aria-hidden="true"
                  className={problemChatClasses.spinner}
                />
                <span className={problemChatClasses.spinnerText}>
                  AI 응답 중입니다.
                </span>
              </span>
            </div>
          </div>
        )}
        <div ref={scrollAnchorRef} />
      </div>

      {chatToastMessage && (
        <div
          aria-live="polite"
          className="absolute bottom-20 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-base bg-button-blue-bg px-[18px] py-3 text-body font-semibold text-text-white shadow-lg"
          role="status"
        >
          {chatToastMessage}
        </div>
      )}

      {suggestedQuestions.length > 0 && chatMessages.length === 0 && (
        <div className={problemChatClasses.suggestedWrap}>
          {suggestedQuestions.map((question) => (
            <button
              className={problemChatClasses.suggestedChip}
              disabled={isChatDisabled}
              key={question}
              onClick={() => onSelectSuggestedQuestion?.(question)}
              type="button"
            >
              {question}
            </button>
          ))}
        </div>
      )}

      <div className={problemChatClasses.chatInputWrap}>
        <textarea
          aria-label="챗봇 질문 입력"
          disabled={isChatDisabled}
          onChange={(event) => onChatInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSendChat();
            }
          }}
          placeholder="질문 입력"
          ref={chatInputRef}
          rows={1}
          value={chatInput}
        />
        <button
          disabled={isChatDisabled || !chatInput.trim()}
          onClick={() => onSendChat()}
          type="button"
        >
          전송
        </button>
      </div>
    </aside>
  );
}
