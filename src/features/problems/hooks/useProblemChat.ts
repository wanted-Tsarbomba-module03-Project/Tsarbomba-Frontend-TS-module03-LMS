"use client";

// 문제풀이 화면의 AI 채팅(문제 전용 채팅방) 로직.
// UserProblemDetailClient / CourseProblemDetailClient 가 공유하기 위해 훅으로 추출.
// per-problem 풀이 상태(userCodes/problemStates 등)와 독립적인 채팅 상태 클러스터만 담당한다.
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createClientMessageId } from "@/features/chat/clientMessageId";
import { streamChat } from "@/features/chat/stream";
import { createChatTypewriter } from "@/features/chat/typewriter";
import { handleClientError } from "@/lib/errorHandling";

import {
  getProblemChatMessages,
  getProblemChatRooms,
  updateProblemChatRoomTitle,
} from "../actions";
import type { ChatMessage, ProblemChatRoom } from "../types";
import { useProblemChatFeedback } from "./useProblemChatFeedback";
import { useProblemSuggestedQuestions } from "./useProblemSuggestedQuestions";

function normalizeId(value?: number | string | null) {
  return value == null ? "" : String(value);
}

function getRoomProblemSetId(room: ProblemChatRoom) {
  return (
    room.problemSetId ??
    room.problemSet?.problemSetId ??
    room.problemSet?.id ??
    null
  );
}

function getRoomProblemId(room: ProblemChatRoom) {
  return room.problemId ?? room.problem?.problemId ?? room.problem?.id ?? null;
}

function findProblemChatRoom(
  rooms: ProblemChatRoom[],
  problemSetId: number,
  problemId: number,
) {
  const targetProblemSetId = normalizeId(problemSetId);
  const targetProblemId = normalizeId(problemId);

  return rooms.find(
    (room) =>
      normalizeId(getRoomProblemSetId(room)) === targetProblemSetId &&
      normalizeId(getRoomProblemId(room)) === targetProblemId,
  );
}

function findProblemChatRoomById(rooms: ProblemChatRoom[], roomId: number) {
  return rooms.find((room) => room.roomId === roomId);
}

interface UseProblemChatParams {
  /** 현재 문제집 id (problemSet.id) */
  problemSetId: number;
  /** 현재 소문제 id (currentProblem?.problemId) */
  currentProblemId: number | undefined;
  /** 오류를 사용자에게 표시(공용 alert modal 등) — 호출 측에서 안정적(useCallback)으로 전달 */
  showError: (title: string, content: string) => void;
}

export function useProblemChat({
  problemSetId,
  currentProblemId,
  showError,
}: UseProblemChatParams) {
  const router = useRouter();

  const [chatOpen, setChatOpen] = useState(false);
  const [hasOpenedChatPanel, setHasOpenedChatPanel] = useState(false);
  const [chatRoomId, setChatRoomId] = useState<number | null>(null);
  const [chatRoomTitle, setChatRoomTitle] = useState<string | null>(null);
  const [chatRoomTitleInput, setChatRoomTitleInput] = useState("");
  const [chatRoomTitleEditing, setChatRoomTitleEditing] = useState(false);
  const [chatRoomTitleConfirmOpen, setChatRoomTitleConfirmOpen] =
    useState(false);
  const [chatRoomTitleUpdating, setChatRoomTitleUpdating] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [feedbackPendingIds, setFeedbackPendingIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [showChatResponsePending, setShowChatResponsePending] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const suggestedQuestions = useProblemSuggestedQuestions(
    problemSetId,
    currentProblemId,
  );
  const activeChatRoomIdRef = useRef<number | null>(null);
  const chatStreamAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    activeChatRoomIdRef.current = chatRoomId;
  }, [chatRoomId]);

  useEffect(() => {
    return () => {
      chatStreamAbortRef.current?.abort();
    };
  }, []);

  const toggleChat = useCallback(() => {
    setHasOpenedChatPanel(true);
    setChatOpen((prev) => !prev);
  }, []);

  const resetChatState = useCallback(() => {
    chatStreamAbortRef.current?.abort();
    chatStreamAbortRef.current = null;
    setChatRoomId(null);
    setChatRoomTitle(null);
    setChatRoomTitleInput("");
    setChatRoomTitleEditing(false);
    setChatRoomTitleConfirmOpen(false);
    setChatMessages([]);
    setChatInput("");
    setChatSending(false);
    setShowChatResponsePending(false);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadProblemChatRoom = async () => {
      if (!hasOpenedChatPanel) {
        return;
      }

      if (!problemSetId || !currentProblemId) {
        resetChatState();
        return;
      }

      resetChatState();
      setChatLoading(true);

      try {
        const rooms = await getProblemChatRooms();
        const room = findProblemChatRoom(rooms, problemSetId, currentProblemId);

        if (!isMounted || !room) {
          return;
        }

        setChatRoomId(room.roomId);
        setChatRoomTitle(room.title || null);
        setChatRoomTitleInput(room.title || "");

        const messages = await getProblemChatMessages(room.roomId);

        if (!isMounted) {
          return;
        }

        setChatMessages(messages);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        handleClientError(error, {
          router,
          fallbackTitle: "채팅방 조회 실패",
          fallbackMessage:
            "문제 전용 채팅방을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
          showModal: showError,
        });
      } finally {
        if (isMounted) {
          setChatLoading(false);
        }
      }
    };

    loadProblemChatRoom();

    return () => {
      isMounted = false;
    };
  }, [currentProblemId, hasOpenedChatPanel, problemSetId, resetChatState, router, showError]);

  const refreshProblemChatMessages = useCallback(async (roomId: number) => {
    const refreshed = await getProblemChatMessages(roomId);
    if (activeChatRoomIdRef.current === roomId) {
      setChatMessages(refreshed);
    }
  }, []);

  const handleChatFeedback = useProblemChatFeedback({
    chatMessages,
    setChatMessages,
    feedbackPendingIds,
    setFeedbackPendingIds,
    showError,
  });

  const sendChat = async (overrideMessage?: string) => {
    const userMessage =
      typeof overrideMessage === "string"
        ? overrideMessage.trim()
        : chatInput.trim();

    if (
      !userMessage ||
      chatSending ||
      chatLoading ||
      !problemSetId ||
      !currentProblemId
    ) {
      return;
    }

    const targetRoomId = chatRoomId;
    const targetProblemId = currentProblemId;
    const controller = new AbortController();
    let newRoomId: number | undefined;
    let streamErrorReceived = false;
    const userMessageId = createClientMessageId();
    const assistantMessageId = createClientMessageId();

    setChatMessages((prev) => [
      ...prev,
      { role: "USER", content: userMessage, clientId: userMessageId },
      { role: "ASSISTANT", content: "", clientId: assistantMessageId },
    ]);
    setChatInput("");
    setChatSending(true);
    setShowChatResponsePending(true);
    chatStreamAbortRef.current?.abort();
    chatStreamAbortRef.current = controller;

    const setLastAssistant = (content: string, error = false) => {
      setChatMessages((prev) => {
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
    const refreshNewChatRoomTitle = async (roomId: number) => {
      try {
        const rooms = await getProblemChatRooms();

        if (
          controller.signal.aborted ||
          activeChatRoomIdRef.current !== roomId
        ) {
          return;
        }

        const room = findProblemChatRoomById(rooms, roomId);
        const nextTitle = room?.title || null;

        setChatRoomTitle(nextTitle);
        setChatRoomTitleInput(nextTitle ?? "");
      } catch {
        // 채팅방 이름 갱신 실패는 메시지 스트림을 방해하지 않는다.
      }
    };
    const typewriter = createChatTypewriter({
      onUpdate: setLastAssistant,
      signal: controller.signal,
    });

    try {
      const path = targetRoomId
        ? `/api/v1/chat/${targetRoomId}/messages`
        : "/api/v1/chat/messages";

      await streamChat(
        path,
        targetRoomId
          ? { userMessage }
          : {
              userMessage,
              problemSetId,
              problemId: targetProblemId,
            },
        {
          onToken: (token) => {
            setShowChatResponsePending(false);
            typewriter.push(token);
          },
          onRoom: (roomId) => {
            newRoomId = roomId;
            activeChatRoomIdRef.current = roomId;
            setChatRoomId(roomId);
            void refreshNewChatRoomTitle(roomId);
          },
          onError: (error) => {
            streamErrorReceived = true;
            setShowChatResponsePending(false);
            typewriter.stop();
            setLastAssistant(error.message, true);
          },
          onDone: () => {
            const refreshRoomId = newRoomId ?? activeChatRoomIdRef.current;

            if (refreshRoomId) {
              void refreshProblemChatMessages(refreshRoomId).catch((error) => {
                handleClientError(error, {
                  router,
                  fallbackTitle: "메시지 동기화 실패",
                  fallbackMessage:
                    "최신 메시지를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
                  showModal: showError,
                });
              });
            }
          },
        },
        controller.signal,
      );

      await typewriter.flush();

      if (streamErrorReceived) {
        return;
      }

      if (!targetRoomId && newRoomId) {
        setChatRoomId(newRoomId);
      }

      window.dispatchEvent(new Event("chatRoomUpdated"));
    } catch (error) {
      if (controller.signal.aborted) {
        typewriter.stop();
        return;
      }

      typewriter.stop();
      setLastAssistant(
        "AI 답변을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
        true,
      );
      setShowChatResponsePending(false);

      handleClientError(error, {
        router,
        fallbackTitle: "메시지 전송 실패",
        fallbackMessage: "메시지를 전송하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        showModal: showError,
      });
    } finally {
      if (chatStreamAbortRef.current === controller) {
        chatStreamAbortRef.current = null;
      }

      typewriter.stop();

      if (!controller.signal.aborted) {
        setChatSending(false);
        setShowChatResponsePending(false);
      }
    }
  };

  const handleSelectSuggestedQuestion = (question: string) => {
    if (!chatOpen) {
      setChatOpen(true);
      setHasOpenedChatPanel(true);
    }

    setChatInput(question);
  };

  const startChatRoomTitleEdit = () => {
    setChatRoomTitleInput(chatRoomTitle ?? "");
    setChatRoomTitleEditing(true);
  };

  const cancelChatRoomTitleEdit = () => {
    setChatRoomTitleInput(chatRoomTitle ?? "");
    setChatRoomTitleEditing(false);
    setChatRoomTitleConfirmOpen(false);
  };

  const requestChatRoomTitleUpdate = () => {
    const nextTitle = chatRoomTitleInput.trim();

    if (!nextTitle || nextTitle === (chatRoomTitle ?? "")) {
      cancelChatRoomTitleEdit();
      return;
    }

    setChatRoomTitleConfirmOpen(true);
  };

  const handleChatRoomTitleUpdate = async () => {
    if (!chatRoomId || chatRoomTitleUpdating) {
      return;
    }

    const targetRoomId = chatRoomId;
    const nextTitle = chatRoomTitleInput.trim();

    if (!nextTitle) {
      return;
    }

    setChatRoomTitleUpdating(true);

    try {
      const updatedRoom = await updateProblemChatRoomTitle(
        targetRoomId,
        nextTitle,
      );

      if (activeChatRoomIdRef.current !== targetRoomId) {
        return;
      }

      const updatedTitle = updatedRoom?.title ?? nextTitle;

      setChatRoomTitle(updatedTitle);
      setChatRoomTitleInput(updatedTitle);
      setChatRoomTitleEditing(false);
      setChatRoomTitleConfirmOpen(false);
      window.dispatchEvent(new Event("chatRoomUpdated"));
    } catch (error) {
      setChatRoomTitleConfirmOpen(false);
      handleClientError(error, {
        router,
        fallbackTitle: "채팅방 이름 수정 실패",
        fallbackMessage:
          "채팅방 이름을 수정하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        showModal: showError,
      });
    } finally {
      setChatRoomTitleUpdating(false);
    }
  };

  return {
    chatOpen,
    setChatOpen,
    hasOpenedChatPanel,
    chatRoomId,
    chatRoomTitle,
    chatRoomTitleInput,
    setChatRoomTitleInput,
    chatRoomTitleEditing,
    chatRoomTitleConfirmOpen,
    setChatRoomTitleConfirmOpen,
    chatRoomTitleUpdating,
    chatMessages,
    feedbackPendingIds,
    chatInput,
    setChatInput,
    chatSending,
    showChatResponsePending,
    chatLoading,
    suggestedQuestions,
    toggleChat,
    resetChatState,
    sendChat,
    handleChatFeedback,
    handleSelectSuggestedQuestion,
    startChatRoomTitleEdit,
    cancelChatRoomTitleEdit,
    requestChatRoomTitleUpdate,
    handleChatRoomTitleUpdate,
  };
}
