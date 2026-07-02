import { ListSkeleton } from "@/components/common";
import {
  RANKING_LIST_SKELETON_COLUMNS,
  RANKING_PAGE_SIZE,
} from "@/features/ranking/constants";

export default function RankingLoading() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-220px)] w-full max-w-[1080px] flex-col px-5 py-14">
      <div className="mb-6 flex items-center justify-between gap-4 max-md:flex-col max-md:items-stretch">
        <div className="space-y-2">
          <h1 className="text-title-lg font-bold text-text-primary">랭킹</h1>
          <p className="text-description text-text-secondary">
            포인트 기준으로 주간 랭킹과 전체 랭킹을 확인할 수 있습니다.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-base border border-border-light bg-bg-box [&_tbody_td]:h-[86px] [&_thead_th]:h-[52px]">
        <ListSkeleton
          columns={[...RANKING_LIST_SKELETON_COLUMNS]}
          rowCount={RANKING_PAGE_SIZE}
          statusMessage="랭킹을 불러오는 중입니다."
        />
      </div>
    </main>
  );
}
