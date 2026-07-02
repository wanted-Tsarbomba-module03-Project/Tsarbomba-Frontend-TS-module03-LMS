"use client";

// CSR - 범용 챗봇: 사용자 입력, AI 응답, 채팅방 수정/삭제가 즉시 반영되는 대화형 화면
import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  OneButtonModal,
  TwoButtonModal,
  WarningModal,
} from "@/components/common";
import { getProblemSetDetail } from "@/features/problems/actions";
import { handleClientError } from "@/lib/errorHandling";

import {
  deleteChatRoom,
  getChatMessages,
  getChatRooms,
  updateChatRoomTitle,
} from "../actions";
import { streamChat } from "../stream";
import { chatClasses } from "../styles";
import { createChatTypewriter } from "../typewriter";
import type { ChatMessage } from "../types";
import {
  createMessage,
  DEFAULT_CHAT_TITLE,
  getLinkedProblem,
  getLinkedProblemLabel,
  type LinkedProblem,
  normalizeId,
  resizeChatInput,
} from "../utils";
import { ChatMessagesSkeleton } from "./ChatPageSkeleton";

interface GeneralChatClientProps {
  roomId?: string;
}

async function enrichLinkedProblem(
  linkedProblem: LinkedProblem | null,
  signal?: AbortSignal,
) {
  if (!linkedProblem) {
    return null;
  }

  try {
    const problemSet = await getProblemSetDetail(linkedProblem.problemSetId, "", {
      signal,
    });
    const problem = problemSet.problems.find(
      (item) => normalizeId(item.problemId) === linkedProblem.problemId,
    );

    return {
      ...linkedProblem,
      problemSetTitle: problemSet.title,
      problemTitle: problem?.title,
    };
  } catch {
    return linkedProblem;
  }
}

function createClientMessageId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export default function GeneralChatClient({ roomId }: GeneralChatClientProps) {
  const router = useRouter();
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const shouldFollowScrollRef = useRef(true);
  const userScrollIntentRef = useRef(false);
  const userScrollIntentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatStreamAbortRef = useRef<AbortController | null>(null);
  const skipNextRoomLoadRef = useRef<string | null>(null);
  const activeRoomIdRef = useRef<string | undefined>(roomId);

  const [currentRoomId, setCurrentRoomId] = useState(roomId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(Boolean(roomId));
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [showResponsePending, setShowResponsePending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingTitle, setUpdatingTitle] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [titleConfirmOpen, setTitleConfirmOpen] = useState(false);
  const [moveConfirmOpen, setMoveConfirmOpen] = useState(false);
  const [chatTitle, setChatTitle] = useState(DEFAULT_CHAT_TITLE);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInputValue, setTitleInputValue] = useState("");
  const [linkedProblemState, setLinkedProblemState] =
    useState<LinkedProblem | null>(null);
  const [modal, setModal] = useState({
    open: false,
    title: "",
    content: "",
  });

  const activeRoomId = currentRoomId;
  const linkedProblem = activeRoomId ? linkedProblemState : null;
  const linkedProblemLabel = linkedProblem
    ? getLinkedProblemLabel(linkedProblem)
    : "";
  const headerActionDisabled = deleting || updatingTitle;

  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
  }, [activeRoomId]);

  const updateShouldFollowScroll = useCallback(() => {
    const container = messageContainerRef.current;

    if (!container) {
      shouldFollowScrollRef.current = true;
      return;
    }

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    shouldFollowScrollRef.current = distanceFromBottom <= 96;
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

  useEffect(() => {
    const container = messageContainerRef.current;

    if (!shouldFollowScrollRef.current) {
      return;
    }

    if (container) {
      container.scrollTo({
        behavior: sending ? "auto" : "smooth",
        top: container.scrollHeight,
      });
    } else {
      messagesEndRef.current?.scrollIntoView({
        behavior: sending ? "auto" : "smooth",
      });
    }
  }, [messages, sending]);

  useEffect(() => {
    return () => {
      if (userScrollIntentTimerRef.current) {
        clearTimeout(userScrollIntentTimerRef.current);
      }

      chatStreamAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    resizeChatInput(inputRef.current);
  }, [inputValue]);

  const refreshChatRoomMeta = useCallback(async (targetRoomId: string) => {
    try {
      const rooms = await getChatRooms();
      const currentRoom = rooms.find(
        (room) => String(room.roomId) === targetRoomId,
      );

      if (activeRoomIdRef.current !== targetRoomId) {
        return;
      }

      const nextTitle = currentRoom?.title || DEFAULT_CHAT_TITLE;
      const enrichedLinkedProblem = await enrichLinkedProblem(
        getLinkedProblem(currentRoom),
      );

      if (activeRoomIdRef.current !== targetRoomId) {
        return;
      }

      setChatTitle(nextTitle);
      setTitleInputValue(nextTitle);
      setLinkedProblemState(enrichedLinkedProblem);
    } catch {
      // 새 채팅방 제목 조회 실패는 현재 메시지 표시를 방해하지 않는다.
    }
  }, []);

  useEffect(() => {
    if (!activeRoomId) {
      const timeoutId = setTimeout(() => {
        setMessagesLoading(false);
      }, 0);

      return () => {
        clearTimeout(timeoutId);
      };
    }

    if (skipNextRoomLoadRef.current === activeRoomId) {
      skipNextRoomLoadRef.current = null;
      setMessagesLoading(false);
      return undefined;
    }

    const controller = new AbortController();

    const loadChat = async () => {
      try {
        setMessagesLoading(true);
        const [rooms, roomMessages] = await Promise.all([
          getChatRooms(controller.signal),
          getChatMessages(activeRoomId, controller.signal),
        ]);
        const currentRoom = rooms.find(
          (room) => String(room.roomId) === String(activeRoomId),
        );

        if (controller.signal.aborted) {
          return;
        }

        const enrichedLinkedProblem = await enrichLinkedProblem(
          getLinkedProblem(currentRoom),
          controller.signal,
        );

        if (controller.signal.aborted) {
          return;
        }

        const nextTitle = currentRoom?.title || DEFAULT_CHAT_TITLE;

        setChatTitle(nextTitle);
        setTitleInputValue(nextTitle);
        setLinkedProblemState(enrichedLinkedProblem);
        setMessages(roomMessages);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        handleClientError(error, {
          router,
          fallbackTitle: "채팅 조회 실패",
          fallbackMessage:
            "채팅 내용을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
          showModal: (title, content) =>
            setModal({ open: true, title, content }),
        });
      } finally {
        if (!controller.signal.aborted) {
          setMessagesLoading(false);
        }
      }
    };

    void loadChat();

    return () => {
      controller.abort();
    };
  }, [activeRoomId, router]);

  const appendMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() || sending) {
      return;
    }

    const userMessage = inputValue;
    const controller = new AbortController();
    const roomIdAtRequestStart = activeRoomIdRef.current;
    let newRoomId: number | undefined;
    let streamErrorReceived = false;
    const userMessageId = createClientMessageId();
    const assistantMessageId = createClientMessageId();

    appendMessage(createMessage("USER", userMessage, false, userMessageId));
    appendMessage(createMessage("ASSISTANT", "", false, assistantMessageId));
    setInputValue("");
    setSending(true);
    setShowResponsePending(true);
    shouldFollowScrollRef.current = true;
    chatStreamAbortRef.current?.abort();
    chatStreamAbortRef.current = controller;

    const setLastAssistant = (content: string, error = false) => {
      setMessages((prev) => {
        const next = [...prev];
        const messageIndex = next.findIndex(
          (message) => message.clientId === assistantMessageId,
        );

        if (messageIndex < 0) {
          return prev;
        }

        next[messageIndex] = {
          ...next[messageIndex],
          content,
          error,
        };

        return next;
      });
    };
    const typewriter = createChatTypewriter({
      onUpdate: setLastAssistant,
      signal: controller.signal,
    });

    try {
      const path = activeRoomId
        ? `/api/v1/chat/${activeRoomId}/messages`
        : "/api/v1/chat/messages";

      await streamChat(
        path,
        activeRoomId
          ? { userMessage }
          : { userMessage, problemSetId: null, problemId: null },
        {
          onToken: (token) => {
            setShowResponsePending(false);
            typewriter.push(token);
          },
          onRoom: (roomId) => {
            newRoomId = roomId;
          },
          onError: (error) => {
            streamErrorReceived = true;
            setShowResponsePending(false);
            typewriter.stop();
            setLastAssistant(error.message, true);
          },
        },
        controller.signal,
      );

      await typewriter.flush();

      if (streamErrorReceived) {
        return;
      }

      window.dispatchEvent(new Event("chatRoomUpdated"));

      if (!activeRoomId && newRoomId) {
        if (activeRoomIdRef.current !== roomIdAtRequestStart) {
          return;
        }

        const nextRoomId = String(newRoomId);

        skipNextRoomLoadRef.current = nextRoomId;
        activeRoomIdRef.current = nextRoomId;
        setCurrentRoomId(nextRoomId);
        window.history.replaceState(null, "", `/chat/${nextRoomId}`);
        void refreshChatRoomMeta(nextRoomId);
      }
    } catch (error) {
      if (controller.signal.aborted) {
        typewriter.stop();
        return;
      }

      typewriter.stop();
      setLastAssistant(
        "AI 응답을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
        true,
      );
      setShowResponsePending(false);

      handleClientError(error, {
        router,
        fallbackTitle: "메시지 전송 실패",
        fallbackMessage:
          "메시지를 전송하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        showModal: (title, content) => setModal({ open: true, title, content }),
      });
    } finally {
      if (chatStreamAbortRef.current === controller) {
        chatStreamAbortRef.current = null;
      }

      typewriter.stop();

      if (!controller.signal.aborted) {
        setSending(false);
        setShowResponsePending(false);
      }
    }
  }, [
    activeRoomId,
    appendMessage,
    inputValue,
    refreshChatRoomMeta,
    router,
    sending,
  ]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const handleDeleteChatRoom = async () => {
    if (!activeRoomId || deleting) {
      return;
    }

    setDeleting(true);

    try {
      await deleteChatRoom(activeRoomId);
      window.dispatchEvent(new Event("chatRoomUpdated"));
      setDeleteModalOpen(false);
      router.replace("/chat");
    } catch (error) {
      setDeleteModalOpen(false);
      handleClientError(error, {
        router,
        fallbackTitle: "채팅방 삭제 실패",
        fallbackMessage:
          "채팅방을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        showModal: (title, content) => setModal({ open: true, title, content }),
      });
    } finally {
      setDeleting(false);
    }
  };

  const startTitleEdit = () => {
    setTitleInputValue(chatTitle);
    setEditingTitle(true);
  };

  const cancelTitleEdit = () => {
    setTitleInputValue(chatTitle);
    setEditingTitle(false);
    setTitleConfirmOpen(false);
  };

  const requestTitleUpdate = () => {
    const nextTitle = titleInputValue.trim();

    if (!nextTitle || nextTitle === chatTitle) {
      cancelTitleEdit();
      return;
    }

    setTitleConfirmOpen(true);
  };

  const handleUpdateTitle = async () => {
    if (!activeRoomId || updatingTitle) {
      return;
    }

    const nextTitle = titleInputValue.trim();

    if (!nextTitle) {
      return;
    }

    setUpdatingTitle(true);

    try {
      const updatedRoom = await updateChatRoomTitle(activeRoomId, nextTitle);
      const updatedTitle = updatedRoom?.title ?? nextTitle;

      setChatTitle(updatedTitle);
      setTitleInputValue(updatedTitle);
      setEditingTitle(false);
      setTitleConfirmOpen(false);
      window.dispatchEvent(new Event("chatRoomUpdated"));
    } catch (error) {
      setTitleConfirmOpen(false);
      handleClientError(error, {
        router,
        fallbackTitle: "채팅방 이름 수정 실패",
        fallbackMessage:
          "채팅방 이름을 수정하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        showModal: (title, content) => setModal({ open: true, title, content }),
      });
    } finally {
      setUpdatingTitle(false);
    }
  };

  const handleMoveProblem = () => {
    if (!linkedProblem) {
      return;
    }

    setMoveConfirmOpen(false);
    router.push(`/problems/${linkedProblem.problemSetId}`);
  };

  return (
    <main className={chatClasses.page}>
      <div className={chatClasses.header}>
        {editingTitle ? (
          <input
            aria-label="채팅방 이름"
            className={chatClasses.titleInput}
            disabled={updatingTitle}
            maxLength={80}
            onChange={(event) => setTitleInputValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                requestTitleUpdate();
              }

              if (event.key === "Escape") {
                cancelTitleEdit();
              }
            }}
            value={titleInputValue}
          />
        ) : (
          <div className={chatClasses.titleGroup}>
            <h1 className={chatClasses.title}>{chatTitle}</h1>
            {linkedProblem && (
              <span className={chatClasses.linkedProblemTitle}>
                연결된 문제풀이방: {linkedProblemLabel}
              </span>
            )}
          </div>
        )}

        {activeRoomId && (
          <div className={chatClasses.headerActions}>
            {linkedProblem && !editingTitle && (
              <button
                className={chatClasses.moveButton}
                disabled={headerActionDisabled}
                onClick={() => setMoveConfirmOpen(true)}
                type="button"
              >
                문제 이동
              </button>
            )}
            {editingTitle ? (
              <>
                <button
                  className={chatClasses.editButton}
                  disabled={updatingTitle}
                  onClick={requestTitleUpdate}
                  type="button"
                >
                  저장
                </button>
                <button
                  className={chatClasses.cancelEditButton}
                  disabled={updatingTitle}
                  onClick={cancelTitleEdit}
                  type="button"
                >
                  취소
                </button>
              </>
            ) : (
              <button
                className={chatClasses.editButton}
                disabled={headerActionDisabled}
                onClick={startTitleEdit}
                type="button"
              >
                수정
              </button>
            )}
            <button
              className={chatClasses.deleteButton}
              disabled={headerActionDisabled}
              onClick={() => setDeleteModalOpen(true)}
              type="button"
            >
              삭제
            </button>
          </div>
        )}
      </div>

      <div
        className={chatClasses.messageContainer}
        onPointerDown={markUserScrollIntent}
        onScroll={handleMessageScroll}
        onTouchMove={markUserScrollIntent}
        onWheel={markUserScrollIntent}
        ref={messageContainerRef}
      >
        {messagesLoading ? (
          <>
            <p aria-live="polite" className="sr-only" role="status">
              채팅 내용을 불러오는 중입니다.
            </p>
            <ChatMessagesSkeleton />
          </>
        ) : (
          messages.map((message, index) => {
            if (message.role === "ASSISTANT" && !message.content) {
              return null;
            }

            return (
              <div
                className={`${chatClasses.messageWrapper} ${
                  message.role === "USER"
                    ? chatClasses.userWrapper
                    : chatClasses.assistantWrapper
                }`}
                key={message.clientId ?? `${message.role}-${index}`}
              >
                <div
                  className={`${chatClasses.message} ${
                    message.role === "USER"
                      ? chatClasses.userMessage
                      : chatClasses.assistantMessage
                  } ${message.error ? chatClasses.errorMessage : ""}`}
                >
                  {message.content}
                </div>
              </div>
            );
          })
        )}

        {!messagesLoading && showResponsePending && (
          <div
            className={`${chatClasses.messageWrapper} ${chatClasses.assistantWrapper}`}
          >
            <div
              aria-live="polite"
              className={`${chatClasses.message} ${chatClasses.assistantMessage}`}
              role="status"
            >
              <span className={chatClasses.spinnerWrap}>
                <span aria-hidden="true" className={chatClasses.spinner} />
                <span className={chatClasses.spinnerText}>
                  AI 응답 중입니다.
                </span>
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className={chatClasses.inputAreaBase}>
        <div className={chatClasses.inputRow}>
          <textarea
            aria-label="채팅 메시지 입력"
            className={chatClasses.input}
            disabled={sending}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="질문 입력"
            ref={inputRef}
            rows={1}
            value={inputValue}
          />

          <button
            className={chatClasses.sendButton}
            disabled={sending || !inputValue.trim()}
            onClick={() => void sendMessage()}
            type="button"
          >
            전송
          </button>
        </div>
      </div>

      <OneButtonModal
        isOpen={modal.open}
        modalContent={modal.content}
        modalTitle={modal.title}
        onClose={() => setModal((prev) => ({ ...prev, open: false }))}
      />

      <WarningModal
        cancelDisabled={deleting}
        confirmDisabled={deleting}
        isOpen={deleteModalOpen}
        modalContent="삭제한 채팅방은 복구할 수 없습니다."
        modalTitle="채팅방을 삭제하시겠습니까?"
        onClose={() => {
          if (!deleting) {
            setDeleteModalOpen(false);
          }
        }}
        onConfirm={handleDeleteChatRoom}
      />

      <TwoButtonModal
        cancelDisabled={updatingTitle}
        confirmDisabled={updatingTitle || !titleInputValue.trim()}
        isOpen={titleConfirmOpen}
        modalContent={`채팅방 이름을 "${titleInputValue.trim()}"(으)로 변경합니다.`}
        modalTitle="채팅방 이름을 수정하시겠습니까?"
        onClose={() => {
          if (!updatingTitle) {
            setTitleConfirmOpen(false);
          }
        }}
        onConfirm={handleUpdateTitle}
      />

      <TwoButtonModal
        isOpen={moveConfirmOpen}
        modalContent="현재 채팅방을 나가고 연결된 문제풀이방으로 이동합니다."
        modalTitle="이동하시겠습니까?"
        onClose={() => setMoveConfirmOpen(false)}
        onConfirm={handleMoveProblem}
      />
    </main>
  );
}
