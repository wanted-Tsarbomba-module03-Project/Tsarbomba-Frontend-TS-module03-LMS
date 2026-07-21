"use client";

import type {
  CSSProperties,
  FormEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

import { streamChat } from "@/features/chat/stream";
import { getErrorContent } from "@/lib/errorHandling";

import type {
  AdminOpsChatHistoryItem,
  AdminOpsChatMessage,
  AdminOpsChatStatus,
} from "./types";

const OPS_CHAT_PATH = "/api/v1/admin/security/ops-chat";
const HISTORY_LIMIT = 20;
const DRAG_VIEWPORT_MARGIN = 12;
const DESKTOP_DRAG_MEDIA_QUERY = "(min-width: 768px)";
const SUGGESTED_QUESTIONS = [
  "어제 의심 로그인 있었어?",
  "최근 3일 로그인 실패 추이 알려줘",
  "오늘 보안 브리핑 요약해줘",
];

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

function createMessageId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function toConversationHistory(
  messages: AdminOpsChatMessage[],
): AdminOpsChatHistoryItem[] {
  return messages
    .filter((message) => !message.error && !message.pending && message.content)
    .map(({ role, content }) => ({ role, content }))
    .slice(-HISTORY_LIMIT);
}

export default function AdminOpsChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AdminOpsChatMessage[]>([]);
  const [currentStatus, setCurrentStatus] =
    useState<AdminOpsChatStatus | null>(null);
  const [sending, setSending] = useState(false);
  const [dragPosition, setDragPosition] = useState<DragPosition | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const dragPointerOffsetRef = useRef<DragPosition | null>(null);
  const dragListenersRef = useRef<DragListeners | null>(null);

  const isDisabled = sending;

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

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const getClampedDragPosition = useCallback(
    (clientX: number, clientY: number): DragPosition | null => {
      const panel = panelRef.current;
      const offset = dragPointerOffsetRef.current;

      if (!panel || !offset) {
        return null;
      }

      const panelRect = panel.getBoundingClientRect();
      const maxViewportX =
        window.innerWidth - panelRect.width - DRAG_VIEWPORT_MARGIN;
      const maxViewportY =
        window.innerHeight - panelRect.height - DRAG_VIEWPORT_MARGIN;

      return {
        x: clamp(
          clientX - offset.x,
          DRAG_VIEWPORT_MARGIN,
          Math.max(DRAG_VIEWPORT_MARGIN, maxViewportX),
        ),
        y: clamp(
          clientY - offset.y,
          DRAG_VIEWPORT_MARGIN,
          Math.max(DRAG_VIEWPORT_MARGIN, maxViewportY),
        ),
      };
    },
    [],
  );

  const handleDragStart = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!window.matchMedia(DESKTOP_DRAG_MEDIA_QUERY).matches) {
        return;
      }

      const target = event.target as HTMLElement;

      if (target.closest("button, input, textarea")) {
        return;
      }

      const panel = panelRef.current;

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

      const panel = panelRef.current;

      if (!panel || !window.matchMedia(DESKTOP_DRAG_MEDIA_QUERY).matches) {
        setDragPosition(null);
        return;
      }

      const panelRect = panel.getBoundingClientRect();
      const maxX = window.innerWidth - panelRect.width - DRAG_VIEWPORT_MARGIN;
      const maxY = window.innerHeight - panelRect.height - DRAG_VIEWPORT_MARGIN;

      setDragPosition({
        x: clamp(dragPosition.x, DRAG_VIEWPORT_MARGIN, Math.max(DRAG_VIEWPORT_MARGIN, maxX)),
        y: clamp(dragPosition.y, DRAG_VIEWPORT_MARGIN, Math.max(DRAG_VIEWPORT_MARGIN, maxY)),
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
      bottom: "auto",
      left: `${dragPosition.x}px`,
      right: "auto",
      top: `${dragPosition.y}px`,
    };
  }, [dragPosition]);

  const appendAssistantText = useCallback((messageId: string, text: string) => {
    setMessages((prevMessages) =>
      prevMessages.map((message) =>
        message.id === messageId
          ? {
              ...message,
              content: `${message.content}${text}`,
              pending: false,
            }
          : message,
      ),
    );
  }, []);

  const updateAssistantMessage = useCallback(
    (messageId: string, nextMessage: Partial<AdminOpsChatMessage>) => {
      setMessages((prevMessages) =>
        prevMessages.map((message) =>
          message.id === messageId ? { ...message, ...nextMessage } : message,
        ),
      );
    },
    [],
  );

  const sendMessage = useCallback(
    async (messageText: string) => {
      const trimmed = messageText.trim();

      if (!trimmed || sending) {
        return;
      }

      const history = toConversationHistory(messages);
      const userMessage: AdminOpsChatMessage = {
        id: createMessageId(),
        role: "user",
        content: trimmed,
      };
      const assistantMessageId = createMessageId();
      const assistantMessage: AdminOpsChatMessage = {
        id: assistantMessageId,
        role: "ai",
        content: "",
        pending: true,
      };
      const controller = new AbortController();

      abortRef.current?.abort();
      abortRef.current = controller;
      setInput("");
      setCurrentStatus(null);
      setMessages((prevMessages) => [
        ...prevMessages,
        userMessage,
        assistantMessage,
      ]);
      setSending(true);

      try {
        await streamChat(
          OPS_CHAT_PATH,
          {
            userMessage: trimmed,
            conversationHistory: history,
          },
          {
            onToken: (text) => {
              appendAssistantText(assistantMessageId, text);
            },
            onStatus: (status) => {
              setCurrentStatus(status);
              updateAssistantMessage(assistantMessageId, { pending: true });
            },
            onDone: () => {
              setCurrentStatus(null);
              updateAssistantMessage(assistantMessageId, { pending: false });
            },
            onError: (error) => {
              setCurrentStatus(null);
              updateAssistantMessage(assistantMessageId, {
                content:
                  error.message ||
                  "운영 챗봇 응답 생성에 실패했습니다. 다시 시도해 주세요.",
                error: true,
                pending: false,
              });
            },
          },
          controller.signal,
        );
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setCurrentStatus(null);
        updateAssistantMessage(assistantMessageId, {
          content: getErrorContent(
            error,
            "운영 챗봇 응답을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
          ),
          error: true,
          pending: false,
        });
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }

        if (!controller.signal.aborted) {
          setSending(false);
        }
      }
    },
    [appendAssistantText, messages, sending, updateAssistantMessage],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    scrollAnchorRef.current?.scrollIntoView({ block: "end" });
  }, [messages, currentStatus, open]);

  return (
    <>
      {!open && (
        <button
          aria-label="운영 보안 도우미 열기"
          className="fixed bottom-6 right-6 z-50 flex h-[60px] w-[60px] cursor-pointer items-center justify-center rounded-full border border-[#1a237e] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.22)] transition hover:bg-[#eef2ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a237e] max-md:bottom-4 max-md:right-4"
          onClick={() => setOpen(true)}
          type="button"
        >
          <Image
            alt=""
            height={34}
            src="/assets/img/chatbot.svg"
            width={34}
          />
        </button>
      )}

      {open && (
        <aside
          aria-label="운영 보안 도우미"
          className="fixed bottom-6 right-6 z-50 flex h-[min(640px,calc(100vh-48px))] w-[min(420px,calc(100vw-32px))] flex-col overflow-hidden rounded-base border border-border-light bg-white shadow-[0_18px_48px_rgba(15,23,42,0.24)] max-md:inset-x-4 max-md:bottom-4 max-md:h-[min(620px,calc(100vh-32px))] max-md:w-auto"
          ref={panelRef}
          style={panelStyle}
        >
          <header
            className="relative flex min-h-[62px] cursor-move items-center justify-between border-b border-border-light px-5"
            onPointerDown={handleDragStart}
          >
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-2 h-1 w-12 -translate-x-1/2 rounded-full bg-[#cbd5e1]"
            />
            <div className="min-w-0 pt-1">
              <strong className="block truncate text-title-md text-text-primary">
                운영 보안 도우미
              </strong>
              <span className="block truncate text-description text-text-secondary">
                로그인 실패, 의심 IP, 보안 브리핑을 빠르게 확인합니다
              </span>
            </div>
            <button
              aria-label="운영 보안 도우미 닫기"
              className="ml-3 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-base border border-border-light bg-white text-xl leading-none text-text-primary transition hover:border-[#b91c1c] hover:bg-[#fee2e2] hover:text-[#b91c1c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a237e]"
              onClick={() => setOpen(false)}
              type="button"
            >
              <span aria-hidden="true">×</span>
            </button>
          </header>

          <div
            className="flex-1 overflow-y-auto bg-[#f8fafc] px-4 py-4"
            ref={messagesRef}
          >
            {messages.length === 0 && (
              <div className="rounded-base border border-border-light bg-white p-4 text-body text-text-secondary">
                <strong className="mb-2 block text-text-primary">
                  확인할 운영 이슈를 물어보세요.
                </strong>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_QUESTIONS.map((question) => (
                    <button
                      className="cursor-pointer rounded-base border border-[#1a237e] bg-white px-3 py-2 text-description font-semibold text-[#1a237e] transition hover:bg-[#eef2ff]"
                      key={question}
                      onClick={() => void sendMessage(question)}
                      type="button"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {messages.map((message) => {
                const isUser = message.role === "user";

                if (!message.content) {
                  return null;
                }

                return (
                  <div
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    key={message.id}
                  >
                    <div
                      className={`max-w-[88%] whitespace-pre-wrap break-words rounded-base px-3.5 py-2.5 text-body leading-normal ${
                        isUser
                          ? "bg-[#1a237e] text-white"
                          : message.error
                            ? "border border-[#fecaca] bg-[#fef2f2] text-[#991b1b]"
                            : "border border-border-light bg-white text-text-primary"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                );
              })}

              {sending && currentStatus && (
                <div
                  aria-live="polite"
                  className="flex justify-start"
                  role="status"
                >
                  <div className="inline-flex max-w-[88%] items-center gap-2 rounded-base border border-[#bfdbfe] bg-[#eff6ff] px-3 py-2 text-description font-semibold text-[#1a237e]">
                    <span
                      aria-hidden="true"
                      className="h-3 w-3 animate-spin rounded-full border-2 border-[#bfdbfe] border-t-[#1a237e]"
                    />
                    {currentStatus.message}
                  </div>
                </div>
              )}
            </div>
            <div ref={scrollAnchorRef} />
          </div>

          <form
            className="border-t border-border-light bg-white p-3"
            onSubmit={handleSubmit}
          >
            <label className="sr-only" htmlFor="admin-ops-chat-input">
              운영 보안 질문 입력
            </label>
            <div className="flex gap-2">
              <textarea
                className="min-h-11 flex-1 resize-none rounded-base border border-border-light px-3 py-2 text-body text-text-primary outline-none transition focus:border-[#1a237e] focus:ring-2 focus:ring-[#1a237e]/20 disabled:bg-[#f1f5f9]"
                disabled={isDisabled}
                id="admin-ops-chat-input"
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage(input);
                  }
                }}
                placeholder="예: 어제 새벽 로그인 실패가 왜 늘었어?"
                rows={1}
                value={input}
              />
              <button
                className="h-11 min-w-[72px] cursor-pointer rounded-base border border-[#1a237e] bg-[#1a237e] px-4 text-body font-semibold text-white transition hover:bg-[#111751] disabled:cursor-not-allowed disabled:border-[#cbd5e1] disabled:bg-[#94a3b8]"
                disabled={isDisabled || !input.trim()}
                type="submit"
              >
                전송
              </button>
            </div>
          </form>
        </aside>
      )}
    </>
  );
}
