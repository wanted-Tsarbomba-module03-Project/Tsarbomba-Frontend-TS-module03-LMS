import Image from "next/image";

import { optimizedImageProps } from "@/components/common/imageOptimization";

import { BADGE_FALLBACK_SRC, rankingClasses } from "../styles";
import type { RankingMode, RankingUser } from "../types";
import { formatPoint, getDisplayName } from "../utils";

interface RankingPodiumProps {
  mode: RankingMode;
  topRankers: RankingUser[];
}

type PodiumPlace = 1 | 2 | 3;

const podiumPlaceStyles: Record<
  PodiumPlace,
  { item: string; medal: string; imageSize: number }
> = {
  1: {
    item: rankingClasses.podiumItemFirst,
    medal: rankingClasses.podiumMedalFirst,
    imageSize: 72,
  },
  2: {
    item: rankingClasses.podiumItemSecond,
    medal: rankingClasses.podiumMedalSecond,
    imageSize: 56,
  },
  3: {
    item: rankingClasses.podiumItemThird,
    medal: rankingClasses.podiumMedalThird,
    imageSize: 56,
  },
};

function toPodiumPlace(rank: number | null, fallback: number): PodiumPlace {
  const value = rank ?? fallback;

  return value === 1 || value === 2 || value === 3 ? value : 3;
}

export default function RankingPodium({ mode, topRankers }: RankingPodiumProps) {
  if (topRankers.length === 0) {
    return null;
  }

  return (
    <div className={rankingClasses.podium}>
      {topRankers.map((user, index) => {
        const place = toPodiumPlace(user.rank, index + 1);
        const placeStyle = podiumPlaceStyles[place];
        const point = mode === "weekly" ? user.weeklyPoint : user.totalPoint;

        return (
          <div
            className={`${rankingClasses.podiumItem} ${placeStyle.item}`}
            key={user.userId}
          >
            <span className={`${rankingClasses.podiumMedal} ${placeStyle.medal}`}>
              {place}
            </span>
            <span className={rankingClasses.podiumBadge}>
              <Image
                alt={`${user.nickname} 뱃지`}
                className={rankingClasses.podiumBadgeImage}
                height={placeStyle.imageSize}
                sizes={`${placeStyle.imageSize}px`}
                src={user.badgeImageUrl || BADGE_FALLBACK_SRC}
                width={placeStyle.imageSize}
                {...optimizedImageProps}
              />
            </span>
            <span className={rankingClasses.podiumName}>
              {getDisplayName(user)}
            </span>
            <span className={rankingClasses.podiumPoint}>
              {formatPoint(point)} P
            </span>
          </div>
        );
      })}
    </div>
  );
}
