import Image from "next/image";

import { optimizedImageProps } from "@/components/common/imageOptimization";
import { BADGE_FALLBACK_SRC, rankingClasses } from "../styles";
import type { RankingUser } from "../types";

interface RankingBadgeImageProps {
  user: RankingUser;
}

export default function RankingBadgeImage({ user }: RankingBadgeImageProps) {
  return (
    <span className={rankingClasses.badgeWrap}>
      <Image
        alt={`${user.nickname} 뱃지`}
        className={rankingClasses.badgeImage}
        height={44}
        src={user.badgeImageUrl || BADGE_FALLBACK_SRC}
        width={44}
        sizes="44px"
        {...optimizedImageProps}
      />
    </span>
  );
}
