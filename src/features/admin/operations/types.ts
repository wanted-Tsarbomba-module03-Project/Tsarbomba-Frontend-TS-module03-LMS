export type TargetType = "COURSE" | "PROBLEM" | "USER";

export type AlertStatus = "OPEN" | "RESOLVED" | "IGNORED";

export interface ApiResponse<T> {
  status?: number;
  message?: string;
  data?: T;
}

export interface PageResponse<T> {
  content: T[];
  totalPages?: number;
  totalElements?: number;
  number?: number;
  size?: number;
}

export interface AutomationRule {
  operationRuleId: number;
  ruleCode: string;
  ruleName?: string;
  description?: string;
  targetType: TargetType;
  enabled: boolean;
  thresholdValue: number | "";
  thresholdMin?: number;
  thresholdMax?: number;
  thresholdUnit?: string;
  minSampleCount: number | null | "";
  minSampleCountLabel?: string | null;
}

export interface OperationAlertSummary {
  operationAlertId: number;
  recommendedAction?: string | null;
  status: AlertStatus;
  severity?: string | null;
}

export interface OperationAlertDetail {
  alert: {
    operationAlertId: number;
    status: AlertStatus;
    severity?: string | null;
    reason?: string | null;
    recommendedAction?: string | null;
    adminMemo?: string | null;
    thresholdValueSnapshot?: number | null;
    firstDetectedAt?: string | null;
    lastDetectedAt?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  };
  rule: {
    ruleName?: string | null;
    ruleCode?: string | null;
    description?: string | null;
    thresholdUnit?: string | null;
    minSampleCountLabel?: string | null;
  };
  target: {
    targetType: TargetType;
    targetId: number;
    title?: string | null;
    nickname?: string | null;
    problemSetTitle?: string | null;
    courseTitle?: string | null;
    email?: string | null;
    status?: string | null;
  };
  metric: {
    observedLabel?: string | null;
    observedValue?: number | null;
    thresholdLabel?: string | null;
    thresholdValue?: number | null;
    unit?: string | null;
    minSampleCount?: number | null;
    minSampleCountUnit?: string | null;
  };
  assignee?: {
    name?: string | null;
    email?: string | null;
  } | null;
}

export type UserDetailTab = "COURSE" | "PROBLEM";

export interface AdminUserSummary {
  userId: number;
  name?: string | null;
  nickname?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  isLocked: boolean;
  createdAt?: string | null;
}

export interface AdminUserDetail {
  userId: number;
  name?: string | null;
  nickname?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  isLocked: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type AdminPermissionType = "userManagement" | "ruleManagement";
export type AdminPermissionApiType = "USER_MANAGEMENT" | "RULE_MANAGEMENT";

export interface AdminAccountSummary {
  userId: number;
  email?: string | null;
  name?: string | null;
  nickname?: string | null;
  role?: string | null;
  locked?: boolean;
  permissionStates?: Partial<Record<AdminPermissionType, boolean>>;
  createdAt?: string | null;
}

export interface AdminAccountPageResponse {
  items: AdminAccountSummary[];
  totalPages?: number;
  totalElements?: number;
  number?: number;
  size?: number;
}

export interface AdminPermissionUpdateRequest {
  permissionType: AdminPermissionApiType;
  granted: boolean;
}

export interface AdminPermissionUpdateResponse extends AdminAccountSummary {
  updatedPermission?: AdminPermissionUpdateRequest;
}

export type AdminProblemCategoryStatus = "ACTIVE" | "INACTIVE";

export interface AdminProblemCategory {
  categoryId: number;
  categoryName: string;
  status: AdminProblemCategoryStatus;
}

export interface UserCourseProgressResponse {
  enrollmentId?: number;
  studentId?: number;
  courseId?: number;
  instructorId?: number;
  courseTitle?: string | null;
  courseDescription?: string | null;
  courseThumbnailUrl?: string | null;
  status?: string | null;
  enrolledAt?: string | null;
}

export interface UserCourseRow {
  enrollmentId?: number;
  courseId?: number;
  title?: string | null;
  date?: string | null;
}

export interface UserProblemSubmission {
  problemId?: number;
  problemTitle?: string | null;
  submissionStatus?: string | null;
  submittedAt?: string | null;
}
