import type { AlertStatus, AutomationRule, TargetType } from "./types";

export const ALERT_PAGE_SIZE = 20;
export const ADMIN_USER_PAGE_SIZE = 20;
export const ADMIN_ACCOUNT_PAGE_SIZE = 20;

export const ALERT_LIST_COLUMN_LABELS = [
  "No.",
  "알람 내용",
  "처리상태",
] as const;

export const ADMIN_USER_LIST_COLUMN_LABELS = [
  "No.",
  "이름",
  "닉네임",
  "이메일",
  "가입일",
  "상태",
] as const;

export const ADMIN_ACCOUNT_LIST_COLUMN_LABELS = [
  "No.",
  "이름",
  "닉네임",
  "이메일",
  "회원 관리 권한",
  "규칙 관리 권한",
] as const;

export const ACCOUNT_LOCK_STATUS_LABEL = {
  locked: "잠금",
  unlocked: "정상",
} as const;

export const ACCOUNT_LOCK_ACTION_LABEL = {
  lock: "계정 잠금",
  unlock: "잠금 해제",
} as const;

export const USER_DETAIL_COURSE_COLUMN_LABELS = [
  "No.",
  "강의명",
  "등록일",
] as const;

export const USER_DETAIL_PROBLEM_COLUMN_LABELS = [
  "No.",
  "문제명",
  "결과",
  "제출일",
] as const;

export const alertStatusLabel: Record<AlertStatus, string> = {
  OPEN: "미처리",
  RESOLVED: "처리 완료",
  IGNORED: "무시됨",
};

export const alertTargetTabs: Array<{ label: string; value: TargetType }> = [
  { label: "문제", value: "PROBLEM" },
  { label: "회원", value: "USER" },
  { label: "강좌", value: "COURSE" },
];

export const automationTargetTypeLabel: Record<
  AutomationRule["targetType"],
  string
> = {
  COURSE: "강좌",
  PROBLEM: "문제",
  USER: "회원",
};

export const operationTargetTypeLabel: Record<TargetType, string> = {
  COURSE: "강좌",
  PROBLEM: "문제",
  USER: "회원",
};
