export type FeedbackRating = "UP" | "DOWN";

export interface ChatRoom {
  roomId: number;
  title: string;
  updatedAt: string;
  problemSetId?: number | string | null;
  problemId?: number | string | null;
  problemSet?: {
    id?: number | string | null;
    problemSetId?: number | string | null;
  } | null;
  problem?: {
    id?: number | string | null;
    problemId?: number | string | null;
  } | null;
}

export interface ChatRoomTitleUpdate {
  roomId: number;
  title: string;
  updatedAt: string;
}

export interface ChatMessage {
  messageId?: number;
  role: "USER" | "ASSISTANT" | "AI";
  content: string;
  createdAt?: string;
  feedback?: FeedbackRating | null;
  error?: boolean;
  clientId?: string;
}

export interface ChatResponse {
  answer: string;
  roomId?: number;
}

export type SuggestedQuestionSource = "GENERATED" | "DEFAULT";

export interface SuggestedQuestions {
  problemSetId: number;
  problemId: number;
  source: SuggestedQuestionSource;
  questions: string[];
}
