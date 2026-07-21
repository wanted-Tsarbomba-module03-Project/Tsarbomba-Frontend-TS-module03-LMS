export type AdminOpsChatRole = "user" | "ai";

export interface AdminOpsChatHistoryItem {
  role: AdminOpsChatRole;
  content: string;
}

export interface AdminOpsChatMessage extends AdminOpsChatHistoryItem {
  id: string;
  error?: boolean;
  pending?: boolean;
}

export interface AdminOpsChatStatus {
  tool?: string;
  message: string;
}
