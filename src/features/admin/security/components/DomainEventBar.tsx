import type { DomainCount } from "../types";
import {
  DOMAIN_BAR_COLORS,
  DOMAIN_BAR_DEFAULT,
  securityClasses as s,
} from "../styles";

interface Props {
  domainCounts: DomainCount[];
}

export default function DomainEventBar({ domainCounts }: Props) {
  const sorted = [...domainCounts].sort((a, b) => b.count - a.count);
  const max = sorted.reduce((acc, item) => Math.max(acc, item.count), 0);

  return (
    <section className={s.card}>
      <div className={s.cardHeader}>
        <h2 className={s.cardTitle}>도메인별 이벤트</h2>
        <span className={s.cardBadge}>도메인별</span>
      </div>

      {sorted.length === 0 ? (
        <div className={s.stateBox}>집계된 이벤트가 없어요.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((item) => (
            <div className={s.domainRow} key={item.group}>
              <span className={s.domainLabel}>{item.label}</span>
              <div className={s.domainTrack}>
                <div
                  className={s.domainFill}
                  style={{
                    width: max > 0 ? `${(item.count / max) * 100}%` : "0%",
                    backgroundColor:
                      DOMAIN_BAR_COLORS[item.group] ?? DOMAIN_BAR_DEFAULT,
                  }}
                />
              </div>
              <span className={s.domainCount}>{item.count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
