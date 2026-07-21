import type { SecurityKpi } from "../types";
import { securityClasses as s } from "../styles";

interface Props {
  kpi: SecurityKpi;
}

// "+18%" / "-4%" / null → "—"
function formatDelta(pct: number | null): string {
  if (pct === null || Number.isNaN(pct)) return "직전 대비 —";
  const sign = pct > 0 ? "+" : "";
  return `직전 ${sign}${pct}%`;
}

// ISO → "14:35 기록"
function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm} 기록`;
}

export default function SecurityKpiTiles({ kpi }: Props) {
  // 5xx: 오류율(rate)이 있으면 % 표시, BE가 rate를 null로 주면 발생 건수로 폴백
  const has5xx = kpi.http5xxCount > 0;
  const http5xxValue =
    kpi.http5xxRatePct !== null
      ? `${kpi.http5xxRatePct}%`
      : has5xx
        ? `${kpi.http5xxCount.toLocaleString()}건`
        : "0%";
  const http5xxSub =
    kpi.http5xxRatePct !== null
      ? `${kpi.http5xxCount.toLocaleString()}건 발생`
      : has5xx
        ? "오류율 미집계"
        : "정상";

  return (
    <div className={s.kpiGrid}>
      <div className={s.kpiTile}>
        <p className={s.kpiLabel}>접속 회원</p>
        <p className={s.kpiValue}>{kpi.loginUsers.toLocaleString()}</p>
        <p className={s.kpiDelta}>로그인 고유</p>
      </div>

      <div className={s.kpiTile}>
        <p className={s.kpiLabel}>최대 동시접속</p>
        <p className={s.kpiValue}>{kpi.maxConcurrent.toLocaleString()}</p>
        <p className={s.kpiDelta}>{formatTime(kpi.maxConcurrentAt)}</p>
      </div>

      <div className={s.kpiTile}>
        <p className={s.kpiLabel}>총 이벤트</p>
        <p className={s.kpiValue}>{kpi.totalEvents.toLocaleString()}</p>
        <p className={s.kpiDelta}>{formatDelta(kpi.totalEventsDeltaPct)}</p>
      </div>

      <div className={s.kpiTile}>
        <p className={s.kpiLabel}>보안 이벤트</p>
        <p className={s.kpiValueDanger}>{kpi.securityEvents.toLocaleString()}</p>
        <p className={s.kpiDelta}>{formatDelta(kpi.securityEventsDeltaPct)}</p>
      </div>

      <div className={s.kpiTile}>
        <p className={s.kpiLabel}>5xx 오류율</p>
        <p className={has5xx ? s.kpiValueDanger : s.kpiValue}>{http5xxValue}</p>
        <p className={s.kpiDelta}>{http5xxSub}</p>
      </div>

      <div className={s.kpiTile}>
        <p className={s.kpiLabel}>수강신청</p>
        <p className={s.kpiValue}>{kpi.enrollments.toLocaleString()}</p>
        <p className={s.kpiDelta}>{formatDelta(kpi.enrollmentsDeltaPct)}</p>
      </div>
    </div>
  );
}
