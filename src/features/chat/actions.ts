import { requestChatJson } from "./api";
import type {
  ChatMessage,
  ChatResponse,
  ChatRoom,
  ChatRoomTitleUpdate,
  FeedbackRating,
  SuggestedQuestions,
} from "./types";

export async function getChatRooms(signal?: AbortSignal) {
  const result = await requestChatJson<ChatRoom[]>(
    "/api/v1/chat/list",
    "채팅방 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    {
      method: "GET",
      signal,
    },
  );

  return result.data ?? [];
}

export async function getChatMessages(roomId: string, signal?: AbortSignal) {
  const result = await requestChatJson<ChatMessage[]>(
    `/api/v1/chat/${roomId}/messages`,
    "채팅 내용을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    {
      method: "GET",
      signal,
    },
  );

  return result.data ?? [];
}

export async function createGeneralChatMessage(userMessage: string) {
  const result = await requestChatJson<ChatResponse>(
    "/api/v1/chat/messages",
    "AI 응답을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    {
      method: "POST",
      body: JSON.stringify({ userMessage }),
    },
  );

  return result.data;
}

export async function sendChatMessage(roomId: string, userMessage: string) {
  const result = await requestChatJson<ChatResponse>(
    `/api/v1/chat/${roomId}/messages`,
    "메시지를 전송하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    {
      method: "POST",
      body: JSON.stringify({ userMessage }),
    },
  );

  return result.data;
}

export async function setMessageFeedback(
  messageId: number,
  rating: FeedbackRating,
) {
  const result = await requestChatJson<{
    messageId: number;
    rating: FeedbackRating;
  }>(
    `/api/v1/chat/messages/${messageId}/feedback`,
    "평가를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    {
      method: "PUT",
      body: JSON.stringify({ rating }),
    },
  );

  return result.data;
}

export async function deleteMessageFeedback(messageId: number) {
  const result = await requestChatJson<unknown>(
    `/api/v1/chat/messages/${messageId}/feedback`,
    "평가를 취소하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    {
      method: "DELETE",
    },
  );

  return result.data;
}

export async function deleteChatRoom(roomId: string) {
  return requestChatJson<unknown>(
    `/api/v1/chat/${roomId}`,
    "채팅방을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    {
      method: "DELETE",
    },
  );
}

export async function updateChatRoomTitle(roomId: string, title: string) {
  const result = await requestChatJson<ChatRoomTitleUpdate>(
    `/api/v1/chat/${roomId}`,
    "채팅방 이름을 수정하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    {
      method: "PATCH",
      body: JSON.stringify({ title }),
    },
  );

  return result.data;
}

export async function getSuggestedQuestions(
  problemSetId: number,
  problemId: number,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({
    problemSetId: String(problemSetId),
    problemId: String(problemId),
  });
  const result = await requestChatJson<SuggestedQuestions>(
    `/api/v1/chat/suggested-questions?${query.toString()}`,
    "추천 질문을 불러오지 못했습니다.",
    {
      method: "GET",
      signal,
    },
  );

  return result.data ?? null;
}
