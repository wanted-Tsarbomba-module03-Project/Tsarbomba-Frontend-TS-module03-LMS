import type {
  AdminInquiryDomain,
  AdminInquirySeverity,
  AdminInquiryStatus,
} from "./types";

export const ADMIN_INQUIRY_PAGE_SIZE = 20;

export const adminInquiryDomainLabels: Record<AdminInquiryDomain, string> = {
  ADMIN: "관리자/운영",
  AUTH: "로그인/인증",
  BADGE: "뱃지",
  CHATBOT: "챗봇",
  COURSE: "강의",
  ENROLLMENT: "수강 관리",
  PROBLEMS: "문제/채점",
  RANKING: "랭킹",
  RECOMMENDATION: "추천",
  USER: "회원/프로필",
  LECTURE: "강의 영상/자료",
  LEARNING: "학습 진행",
  ETC: "기타",
};

export const adminInquirySeverityLabels: Record<AdminInquirySeverity, string> =
  {
    LOW: "낮음",
    MEDIUM: "보통",
    HIGH: "높음",
    CRITICAL: "긴급",
  };

export const adminInquiryStatusLabels: Record<AdminInquiryStatus, string> = {
  OPEN: "새 문의",
  ANSWERED: "답변 완료",
};

export const adminInquiryDomainOptions = Object.entries(
  adminInquiryDomainLabels,
) as Array<[AdminInquiryDomain, string]>;

export const adminInquirySeverityOptions = Object.entries(
  adminInquirySeverityLabels,
) as Array<[AdminInquirySeverity, string]>;

export const adminInquiryStatusOptions = Object.entries(
  adminInquiryStatusLabels,
) as Array<[AdminInquiryStatus, string]>;
