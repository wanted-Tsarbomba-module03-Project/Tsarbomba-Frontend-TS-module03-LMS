"use client";

// CSR - 랭킹 전환: 최초 SSR 데이터 이후 주간/전체 버튼 전환에 따라 목록과 내 랭킹을 함께 다시 조회함
// 데이터 패칭은 TanStack Query(useQuery)가 담당 — 모드별 캐싱·중복요청 제거·재시도 자동.
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import {
  ListSkeleton,
  OneButtonModal,
  Pagination,
} from "@/components/common";
import { handleClientError } from "@/lib/errorHandling";

import { getMyPointRankingByMode, getPointRankingsByMode } from "../actions";
import {
  RANKING_LIST_SKELETON_COLUMNS,
  RANKING_PAGE_SIZE,
} from "../constants";
import { rankingClasses } from "../styles";
import type { RankingMode, RankingUser } from "../types";
import MyRankingCard from "./MyRankingCard";
import RankingList from "./RankingList";
import RankingModeToggle from "./RankingModeToggle";

interface RankingClientProps {
  initialMyRanking: RankingUser | null;
  initialRankings: RankingUser[];
}

interface RankingSnapshot {
  rankings: RankingUser[];
  myRanking: RankingUser | null;
}

export default function RankingClient({
  initialMyRanking,
  initialRankings,
}: RankingClientProps) {
  const router = useRouter();
  const [mode, setMode] = useState<RankingMode>("total");
  const [page, setPage] = useState(0);
  const [modal, setModal] = useState({
    open: false,
    title: "",
    content: "",
  });

  // 모드(전체/주간)별로 목록 + 내 랭킹을 함께 조회. 전체 모드는 SSR 초기 데이터로 시드해
  // 마운트 직후 재요청을 막고, 한 번 본 모드는 캐시되어 재전환 시 즉시 표시된다.
  const { data, isFetching, isError, error } = useQuery<RankingSnapshot>({
    queryKey: ["rankings", mode],
    queryFn: async () => {
      const [rankings, myRanking] = await Promise.all([
        getPointRankingsByMode(mode),
        getMyPointRankingByMode(mode),
      ]);

      return { rankings, myRanking };
    },
    initialData:
      mode === "total"
        ? { rankings: initialRankings, myRanking: initialMyRanking }
        : undefined,
  });

  // 조회 실패 시 기존 에러 처리(모달/리다이렉트) 재사용.
  useEffect(() => {
    if (!isError || !error) return;

    handleClientError(error, {
      router,
      fallbackTitle: "랭킹 조회 실패",
      fallbackMessage:
        "랭킹 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
      showModal: (title, content) => setModal({ open: true, title, content }),
    });
  }, [isError, error, router]);

  const rankings = useMemo(() => data?.rankings ?? [], [data]);
  const myRanking = data?.myRanking ?? null;
  const loading = isFetching;

  const totalPages = Math.max(
    Math.ceil(rankings.length / RANKING_PAGE_SIZE),
    1,
  );
  const currentPage = Math.min(page, totalPages - 1);
  const pagedRankings = useMemo(() => {
    const start = currentPage * RANKING_PAGE_SIZE;

    return rankings.slice(start, start + RANKING_PAGE_SIZE);
  }, [currentPage, rankings]);

  const handleModeChange = (nextMode: RankingMode) => {
    if (nextMode === mode || loading) {
      return;
    }

    setPage(0);
    setMode(nextMode);
  };

  return (
    <section className={rankingClasses.page}>
      <div className={rankingClasses.header}>
        <div className={rankingClasses.titleGroup}>
          <h1 className={rankingClasses.title}>랭킹</h1>
          <p className={rankingClasses.description}>
            포인트 기준으로 주간 랭킹과 전체 랭킹을 확인할 수 있습니다.
          </p>
        </div>

        <RankingModeToggle
          disabled={loading}
          mode={mode}
          onChange={handleModeChange}
        />
      </div>

      <div className={rankingClasses.listShell}>
        {loading ? (
          <ListSkeleton
            columns={[...RANKING_LIST_SKELETON_COLUMNS]}
            rowCount={RANKING_PAGE_SIZE}
            statusMessage="랭킹을 불러오는 중입니다."
          />
        ) : (
          <RankingList
            myRanking={myRanking}
            pagination={
              <Pagination
                currentPage={currentPage}
                disabled={loading}
                onPageChange={setPage}
                totalPages={totalPages}
              />
            }
            rankings={pagedRankings}
          />
        )}
      </div>

      <MyRankingCard myRanking={myRanking} />

      <OneButtonModal
        isOpen={modal.open}
        modalContent={modal.content}
        modalTitle={modal.title}
        onClose={() => setModal((prev) => ({ ...prev, open: false }))}
      />
    </section>
  );
}
