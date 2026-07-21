import { requestAdminOperation } from "../operations/api";
import type { Briefing, SecurityPeriod, SecuritySummary } from "./types";

const SECURITY_BASE = "/api/v1/admin/security";

// 기간 내 집계 요약 (KPI·도메인·HTTP 예외·위험 IP). 데이터 없어도 200 + 0값.
export async function getSecuritySummary(
  period: SecurityPeriod = "today",
  signal?: AbortSignal,
) {
  return requestAdminOperation<SecuritySummary>(
    `${SECURITY_BASE}/summary?period=${period}`,
    { signal },
  );
}

// 최근 생성된 AI 브리핑 저장본 조회. LLM 호출 없음(즉시). 이력 없으면 data: null.
export async function getSecurityBriefing(signal?: AbortSignal) {
  return requestAdminOperation<Briefing | null>(`${SECURITY_BASE}/briefing`, {
    signal,
  });
}

// 즉시 재생성 — 동기 5~30초. 성공 시 GET /briefing 과 동일 구조 반환.
// 429 SEC-001(쿨다운) / 502 SEC-002(AI 실패)는 호출부에서 ApiClientError.code 로 분기.
export async function regenerateSecurityBriefing() {
  return requestAdminOperation<Briefing>(`${SECURITY_BASE}/briefing/regenerate`, {
    method: "POST",
  });
}

// 위험 IP 드릴다운 잠금 버튼 — 기존 계정 정지 API 재사용.
export { toggleUserLock } from "../operations/actions";
