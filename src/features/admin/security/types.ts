// 보안 요약 콘솔 응답 타입 — API.md "보안 요약 콘솔" 명세 기준
export type SecurityPeriod = "today" | "week" | "2m";

export interface SecurityKpi {
  loginUsers: number;
  maxConcurrent: number;
  maxConcurrentAt: string;
  totalEvents: number;
  totalEventsDeltaPct: number | null;
  securityEvents: number;
  securityEventsDeltaPct: number | null;
  http5xxCount: number;
  http5xxRatePct: number | null;
  enrollments: number;
  enrollmentsDeltaPct: number | null;
}

export interface DomainCount {
  group: string;
  label: string;
  count: number;
}

export type HttpAnomalyType =
  | "http_5xx"
  | "auth_401_spike"
  | "access_403"
  | "slow_request";

export interface HttpAnomaly {
  route: string;
  type: string;
  count: number;
  maxDurationMs: number | null;
  // 상태코드별 분해 (예: { "500": 3, "502": 2 }) — 있으면 코드별 pill 로 표시
  statusBreakdown?: Record<string, number> | null;
}

export interface RiskIp {
  ip: string;
  country: string | null;
  eventCount: number;
  mainType: string;
  targetUserIds: number[];
}

export interface HourlyBucket {
  hour: number;
  count: number;
}

export interface SecuritySummary {
  period: SecurityPeriod;
  kpi: SecurityKpi;
  domainCounts: DomainCount[];
  httpAnomalies: HttpAnomaly[];
  riskIps: RiskIp[];
  hourly: HourlyBucket[];
}

// AI 브리핑 (LLM 저장본) — 3분류 카드
export interface BriefingItem {
  title: string;
  detail: string;
  relatedCategory: string;
}

export interface BriefingContent {
  headline: string;
  narrative: string;
  actionRequired: BriefingItem[];
  watching: BriefingItem[];
  healthy: BriefingItem[];
}

export interface Briefing {
  briefingId: number;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  nextScheduledAt: string;
  stale: boolean;
  content: BriefingContent;
}
