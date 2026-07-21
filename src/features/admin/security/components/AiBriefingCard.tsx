import type { Briefing, BriefingItem } from "../types";
import { securityClasses as s } from "../styles";

interface Props {
  briefing: Briefing | null;
}

interface TriCardProps {
  variant: "action" | "watch" | "healthy";
  heading: string;
  items: BriefingItem[];
}

const VARIANT_STYLE = {
  action: { box: s.triCardAction, mark: "▲", color: "text-text-red" },
  watch: { box: s.triCardWatch, mark: "●", color: "text-[#b45309]" },
  healthy: { box: s.triCardHealthy, mark: "✓", color: "text-[#15803d]" },
} as const;

function TriCard({ variant, heading, items }: TriCardProps) {
  const style = VARIANT_STYLE[variant];
  return (
    <div className={`${style.box} flex flex-col gap-3`}>
      <p className={`${s.triCardTitle} ${style.color}`}>
        {style.mark} {heading} {items.length}
      </p>
      <div className="flex flex-col gap-2.5">
        {items.map((item, index) => (
          <p className={s.triCardDetail} key={`${item.title}-${index}`}>
            <span className={s.triCardItemTitle}>{item.title}</span>
            {item.detail ? ` · ${item.detail}` : ""}
          </p>
        ))}
      </div>
    </div>
  );
}

export default function AiBriefingCard({ briefing }: Props) {
  return (
    <section className={s.card}>
      <div className={s.cardHeader}>
        <div className="flex items-center gap-2">
          <h2 className={s.cardTitle}>✦ AI 브리핑</h2>
          <span className={s.briefingTag}>자동 생성</span>
        </div>
        <span className={s.cardBadge}>AI 브리핑</span>
      </div>

      {briefing === null ? (
        <div className={s.stateBox}>브리핑 준비 중이에요. 잠시 후 다시 확인해 주세요.</div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className={s.briefingHeadline}>{briefing.content.headline}</p>
          <p className={s.briefingNarrative}>{briefing.content.narrative}</p>

          <div className={s.triCardGrid}>
            <TriCard
              heading="조치 필요"
              items={briefing.content.actionRequired}
              variant="action"
            />
            <TriCard
              heading="관찰 중"
              items={briefing.content.watching}
              variant="watch"
            />
            <TriCard
              heading="잘 돌아감"
              items={briefing.content.healthy}
              variant="healthy"
            />
          </div>
        </div>
      )}
    </section>
  );
}
