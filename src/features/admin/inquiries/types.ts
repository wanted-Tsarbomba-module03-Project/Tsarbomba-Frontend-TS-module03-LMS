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
