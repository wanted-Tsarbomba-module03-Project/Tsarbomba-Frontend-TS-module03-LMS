"use client";

import { useState } from "react";

import type { HttpAnomaly } from "../types";
import { securityClasses as s } from "../styles";

interface Props {
  httpAnomalies: HttpAnomaly[];
}

interface Pill {
  label: string;
  danger: boolean;
}

// statusBreakdown 이 있으면 코드별 pill(5xx=빨강 우선 정렬), 없으면 type 기준 단일 pill
function pillsFor(item: HttpAnomaly): Pill[] {
  const breakdown = item.statusBreakdown;
  if (breakdown && Object.keys(breakdown).length > 0) {
    return Object.entries(breakdown)
      .sort(([a], [b]) => {
        // 5xx(위험) 먼저, 그다음 코드 오름차순
        const da = a.startsWith("5") ? 0 : 1;
        const db = b.startsWith("5") ? 0 : 1;
        return da - db || Number(a) - Number(b);
      })
      .map(([code, cnt]) => ({
        label: `${code} ×${cnt}`,
        danger: code.startsWith("5"),
      }));
  }

  switch (item.type) {
    case "http_5xx":
      return [{ label: `5xx ×${item.count}`, danger: true }];
    case "auth_401_spike":
      return [{ label: `401 ×${item.count} 급증`, danger: false }];
    case "access_403":
      return [{ label: `403 ×${item.count}`, danger: false }];
    case "slow_request": {
      const sec = item.maxDurationMs
        ? (item.maxDurationMs / 1000).toFixed(1)
        : "?";
      return [{ label: `지연 ${sec}s`, danger: false }];
    }
    default:
      return [{ label: `${item.type} ×${item.count}`, danger: false }];
  }
}

export default function HttpAnomalyList({ httpAnomalies }: Props) {
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <section className={s.card}>
      <div className={s.cardHeader}>
        <h2 className={s.cardTitle}>HTTP 예외 신호</h2>
        <span className={s.cardBadge}>HTTP 신호</span>
      </div>

      {httpAnomalies.length === 0 ? (
        <div className={s.stateBox}>예외 신호가 없어요. (정상 요청은 수집하지 않아요)</div>
      ) : (
        <>
          <div className="flex flex-col">
            {httpAnomalies.map((item, index) => {
              const pills = pillsFor(item);
              const key = `${item.route}-${item.type}-${index}`;
              const isOpen = openKeys.has(key);
              const hasMore = pills.length > 1;
              const [top, ...rest] = pills;

              return (
                <div className={s.httpRow} key={key}>
                  <span className={s.httpRoute}>{item.route}</span>
                  <div className={s.httpPillGroup}>
                    {hasMore ? (
                      // 맨 위(위험) pill 박스 안 우측에 화살표를 넣어 토글
                      <button
                        className={
                          top.danger
                            ? s.httpTogglePillDanger
                            : s.httpTogglePillWarn
                        }
                        onClick={() => toggle(key)}
                        type="button"
                      >
                        <span>{top.label}</span>
                        <span className={s.httpToggleCaret}>
                          {isOpen ? "▲" : "▼"}
                        </span>
                      </button>
                    ) : (
                      <span
                        className={top.danger ? s.httpPillDanger : s.httpPillWarn}
                      >
                        {top.label}
                      </span>
                    )}

                    {isOpen &&
                      rest.map((pill) => (
                        <span
                          className={
                            pill.danger ? s.httpPillDanger : s.httpPillWarn
                          }
                          key={pill.label}
                        >
                          {pill.label}
                        </span>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
          <p className={`${s.httpEmpty} mt-3`}>정상 요청은 수집하지 않습니다</p>
        </>
      )}
    </section>
  );
}
