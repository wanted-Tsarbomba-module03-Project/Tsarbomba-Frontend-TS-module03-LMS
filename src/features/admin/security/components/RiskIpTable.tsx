"use client";

import { useRouter } from "next/navigation";

import type { RiskIp } from "../types";
import { securityClasses as s } from "../styles";

interface Props {
  riskIps: RiskIp[];
  onLock: (ip: string, userId: number) => void;
  lockingKey: string | null;
}

// 잠금 버튼을 노출할 공격 유형 — 표적 계정을 보호(정지)해야 하는 무차별 대입류.
const LOCKABLE_TYPES = new Set([
  "login_fail",
  "brute_force",
  "credential_stuffing",
]);

export default function RiskIpTable({ riskIps, onLock, lockingKey }: Props) {
  const router = useRouter();

  const goMember = (id: number) => router.push(`/admin/users/${id}`);

  return (
    <section className={s.card}>
      <div className={s.cardHeader}>
        <h2 className={s.cardTitle}>위험 IP 드릴다운</h2>
        <span className={s.cardBadge}>드릴다운 + 잠금</span>
      </div>

      {riskIps.length === 0 ? (
        <div className={s.stateBox}>탐지된 위험 IP가 없어요.</div>
      ) : (
        <table className={s.table}>
          <thead>
            <tr>
              <th className={s.th}>위험 IP</th>
              <th className={s.th}>이벤트</th>
              <th className={s.th}>주요 타입</th>
              <th className={s.th}>표적 계정</th>
              <th className={s.th}>처리</th>
            </tr>
          </thead>
          <tbody>
            {riskIps.map((riskIp) => {
              const canLock =
                LOCKABLE_TYPES.has(riskIp.mainType) &&
                riskIp.targetUserIds.length > 0;
              // 표적 계정이 없으면 null 한 줄, 있으면 계정마다 한 줄
              const userRows: (number | null)[] =
                riskIp.targetUserIds.length > 0 ? riskIp.targetUserIds : [null];
              const span = userRows.length;

              return userRows.map((uid, idx) => {
                const rowKey = `${riskIp.ip}:${uid ?? "none"}`;
                const isLocking = lockingKey === rowKey;

                return (
                  <tr className={idx === 0 ? s.rowGroupStart : ""} key={rowKey}>
                    {idx === 0 && (
                      <>
                        <td className={s.tdGroup} rowSpan={span}>
                          {riskIp.ip}
                          {riskIp.country && (
                            <span className={s.ipCountry}>{riskIp.country}</span>
                          )}
                        </td>
                        <td className={s.tdGroupDanger} rowSpan={span}>
                          {riskIp.eventCount.toLocaleString()}
                        </td>
                        <td className={s.tdGroup} rowSpan={span}>
                          {riskIp.mainType}
                        </td>
                      </>
                    )}

                    <td className={s.td}>
                      {uid === null ? (
                        <span className={s.targetEmpty}>—</span>
                      ) : (
                        `user ${uid}`
                      )}
                    </td>

                    <td className={s.td}>
                      {uid === null ? (
                        <button
                          className={s.investigateButton}
                          onClick={() => router.push("/admin/users")}
                          type="button"
                        >
                          조사
                        </button>
                      ) : canLock ? (
                        <button
                          className={s.lockButton}
                          disabled={isLocking}
                          onClick={() => onLock(riskIp.ip, uid)}
                          type="button"
                        >
                          {isLocking ? "처리 중" : "잠금"}
                        </button>
                      ) : (
                        <button
                          className={s.investigateButton}
                          onClick={() => goMember(uid)}
                          type="button"
                        >
                          조사
                        </button>
                      )}
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
