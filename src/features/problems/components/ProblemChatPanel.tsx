"use client";

// CSR - 문제풀이 챗봇 패널: 입력 높이, 전송 상태, 메시지 렌더링이 사용자 입력에 따라 즉시 바뀜
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

import { problemChatClasses } from "@/features/chat/styles";
import { isUserMessage, resizeChatInput } from "@/features/chat/utils";

import type { ChatMessage } from "../types";

interface ProblemChatPanelProps {
  chatInput: string;
  chatMessages: ChatMessage[];
  chatOpen: boolean;
  chatRoomTitleEditing?: boolean;
  chatRoomTitleInput?: string;
  chatRoomTitle?: string | null;
  chatSending: boolean;
  showChatSendingIndicator?: boolean;
  canEditChatRoomTitle?: boolean;
  onChatInputChange: (value: string) => void;
  onChatRoomTitleCancel?: () => void;
  onChatRoomTitleChange?: (value: string) => void;
  onChatRoomTitleEdit?: () => void;
  onChatRoomTitleSubmit?: () => void;
  onClose: () => void;
  onSendChat: () => void;
}

const DESKTOP_DRAG_MEDIA_QUERY = "(min-width: 768px)";
const DRAG_VIEWPORT_MARGIN = 12;
const SCROLL_FOLLOW_THRESHOLD = 96;

interface DragPosition {
  x: number;
  y: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export default function ProblemChatPanel({
  chatInput,
  chatMessages,
  chatOpen,
  chatRoomTitleEditing = false,
  chatRoomTitleInput = "",
  chatRoomTitle,
  chatSending,
  showChatSendingIndicator = chatSending,
  canEditChatRoomTitle = false,
  onChatInputChange,
  onChatRoomTitleCancel,
  onChatRoomTitleChange,
  onChatRoomTitleEdit,
  onChatRoomTitleSubmit,
  onClose,
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
  const [dragPosition, setDragPosition] = useState<DragPosition | null>(null);
  const isChatDisabled = chatSending || !chatOpen;

  useEffect(() => {
    resizeChatInput(chatInputRef.current);
  }, [chatInput]);

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
        dragPointerOffsetRef.current = null;
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "move";
      document.body.style.userSelect = "none";
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp, { once: true });
    },
    [getClampedDragPosition],
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
          aria-label="채팅창 이동 핸들"
          className={problemChatClasses.chatDragHint}
          role="img"
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

          return (
            <div
              className={`${problemChatClasses.chatMessageWrap} ${
                isUserMessage(message)
                  ? problemChatClasses.userMessageWrap
                  : problemChatClasses.assistantMessageWrap
              }`}
              key={message.clientId ?? `${message.role}-${index}`}
            >
              <div
                className={`${problemChatClasses.chatMessage} ${
                  isUserMessage(message)
                    ? problemChatClasses.userMessage
                    : problemChatClasses.assistantMessage
                } ${message.error ? problemChatClasses.errorMessage : ""}`}
              >
                {message.content}
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
          onClick={onSendChat}
          type="button"
        >
          전송
        </button>
      </div>
    </aside>
  );
}
