export type AdminInquiryDomain =
  | "ADMIN"
  | "AUTH"
  | "BADGE"
  | "CHATBOT"
  | "COURSE"
  | "ENROLLMENT"
  | "PROBLEMS"
  | "RANKING"
  | "RECOMMENDATION"
  | "USER"
  | "LECTURE"
  | "LEARNING"
  | "ETC";

export type AdminInquirySeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AdminInquiryStatus = "OPEN" | "ANSWERED";

export interface AdminInquirySummary {
  inquiryId: number;
  title: string;
  summary: string;
  domain: AdminInquiryDomain;
  severity: AdminInquirySeverity;
  status: AdminInquiryStatus;
  filtered: boolean;
  createdAt: string;
}

export interface AdminInquiryDetail extends AdminInquirySummary {
  userId: number;
  content: string;
  sourceUrl: string | null;
  estimatedUrl: string | null;
  recommendedAction: string | null;
  adminReply: string | null;
  repliedBy: number | string | null;
  repliedAt: string | null;
}

export interface AdminInquiryPageResponse {
  content: AdminInquirySummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface AdminInquiryListParams {
  isFiltered: boolean;
  domain?: AdminInquiryDomain | "";
  severity?: AdminInquirySeverity | "";
  status?: AdminInquiryStatus | "";
  page?: number;
  size?: number;
}

export interface AdminInquiryClassificationRequest {
  domain: AdminInquiryDomain;
  severity: AdminInquirySeverity;
  reason: string;
}

export interface AdminInquiryReplyRequest {
  content: string;
}

export interface AdminInquiryFilterRequest {
  filtered: boolean;
  reason: string;
}
