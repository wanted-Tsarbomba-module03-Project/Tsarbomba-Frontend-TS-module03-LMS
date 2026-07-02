// SSR + CSR - 랭킹 페이지: 최초 전체 랭킹과 내 전체 랭킹은 서버에서 가져오고, 주간/전체 전환은 클라이언트에서 즉시 조회함
import { cookies } from "next/headers";

import JsonLdScript from "@/components/common/JsonLdScript";
import {
  getMyPointRanking,
  getTotalPointRankings,
} from "@/features/ranking/actions";
import RankingClient from "@/features/ranking/components/RankingClient";
import {
  createBreadcrumbJsonLd,
  createItemListJsonLd,
  createPageMetadata,
} from "@/lib/seo";

export const metadata = createPageMetadata({
  description:
    "codebomba 학습자의 주간 랭킹과 전체 랭킹을 확인하고 내 랭킹 정보를 비교하세요.",
  path: "/ranking",
  title: "랭킹",
});

export default async function RankingPage() {
  const cookieHeader = (await cookies()).toString();
  const requestInit = {
    ...(cookieHeader ? { headers: { Cookie: cookieHeader } } : {}),
  };

  const [initialRankings, initialMyRanking] = await Promise.all([
    getTotalPointRankings(requestInit).catch(() => []),
    getMyPointRanking(requestInit).catch(() => null),
  ]);
  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: "홈", path: "/" },
    { name: "랭킹", path: "/ranking" },
  ]);
  const rankingListJsonLd = createItemListJsonLd({
    description: "codebomba 학습자의 전체 포인트 랭킹 목록입니다.",
    items: initialRankings.slice(0, 20).map((ranking) => ({
      description: `총 ${ranking.totalPoint.toLocaleString()} 포인트`,
      name: ranking.nickname || ranking.name,
      path: "/ranking",
    })),
    name: "전체 랭킹",
  });

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} id="ranking-breadcrumb-jsonld" />
      <JsonLdScript data={rankingListJsonLd} id="ranking-list-jsonld" />
      <RankingClient
        initialMyRanking={initialMyRanking}
        initialRankings={initialRankings}
      />
    </>
  );
}
