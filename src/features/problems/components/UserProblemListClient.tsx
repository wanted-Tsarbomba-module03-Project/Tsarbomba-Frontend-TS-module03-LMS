"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  List,
  ListSkeleton,
  OneButtonModal,
  Pagination,
  Searchbar,
  listCellClasses,
  type ListColumn,
} from "@/components/common";
import { handleClientError } from "@/lib/errorHandling";

import {
  DIFFICULTY_MAP,
  getAllProblemSets,
  getMyProblemSetRecommendations,
  hideProblemSetRecommendationsToday,
} from "../actions";
import {
  PROBLEM_LIST_COLUMN_LABELS,
  PROBLEM_SET_PAGE_SIZE,
} from "../constants";
import { matchesProblemSetKeyword } from "../search";
import type { ProblemSetRecommendation, ProblemSetSummary } from "../types";
import ProblemRecommendationModal from "./ProblemRecommendationModal";

const userProblemListClasses = {
  container: "min-h-screen bg-bg-main py-[30px] max-md:py-6",
  header:
    "mb-5 flex items-center justify-between gap-4 max-md:flex-col max-md:items-stretch",
  pageTitle: "m-0 text-title-lg font-bold text-text-primary",
  searchWrap: "flex flex-wrap items-center justify-end gap-3 max-md:justify-start",
} as const;

interface UserProblemListClientProps {
  categoryId?: string;
  currentPage: number;
  initialProblemSets: ProblemSetSummary[];
  pageSize: number;
  totalPages: number;
}

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}.${month}.${day}`;
}

export default function UserProblemListClient({
  categoryId,
  currentPage,
  initialProblemSets,
  pageSize,
  totalPages,
}: UserProblemListClientProps) {
  const router = useRouter();

  const [modal, setModal] = useState({
    open: false,
    title: "",
    content: "",
  });
  const [recommendations, setRecommendations] = useState<
    ProblemSetRecommendation[]
  >([]);
  const [recommendationOpen, setRecommendationOpen] = useState(false);
  const [recommendationHidingToday, setRecommendationHidingToday] =
    useState(false);
  const [searchProblemSets, setSearchProblemSets] = useState<
    ProblemSetSummary[] | null
  >(null);
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [searchPage, setSearchPage] = useState(0);
  const [searchTotalPages, setSearchTotalPages] = useState(1);
  const [searchLoading, setSearchLoading] = useState(false);
  const isSearchMode = keyword.trim().length > 0;
  const activePage = isSearchMode ? searchPage : currentPage;

  useEffect(() => {
    let isMounted = true;

    const loadRecommendations = async () => {
      try {
        const result = await getMyProblemSetRecommendations();
        const nextRecommendations = result?.hidden
          ? []
          : [...(result?.problemSets ?? [])]
              .sort((prev, next) => prev.rankNo - next.rankNo)
              .slice(0, 3);

        if (!isMounted || nextRecommendations.length === 0) {
          return;
        }

        setRecommendations(nextRecommendations);
        setRecommendationOpen(true);
      } catch (error) {
        console.error("추천 문제 조회 실패:", error);
      }
    };

    void loadRecommendations();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!recommendationOpen) {
      return;
    }

    const preventScroll = (event: Event) => {
      event.preventDefault();
    };
    const preventScrollKey = (event: KeyboardEvent) => {
      const target = event.target;
      const isInteractiveTarget =
        target instanceof HTMLElement &&
        Boolean(
          target.closest(
            'button, a, input, textarea, select, [role="button"], [tabindex]:not([tabindex="-1"])',
          ),
        );

      if (isInteractiveTarget) {
        return;
      }

      if (
        [
          "ArrowUp",
          "ArrowDown",
          "PageUp",
          "PageDown",
          "Home",
          "End",
          " ",
        ].includes(event.key)
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener("wheel", preventScroll, { passive: false });
    window.addEventListener("touchmove", preventScroll, { passive: false });
    window.addEventListener("keydown", preventScrollKey);

    return () => {
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
      window.removeEventListener("keydown", preventScrollKey);
    };
  }, [recommendationOpen]);

  const columns = useMemo<ListColumn<ProblemSetSummary>[]>(
    () => [
      {
        key: "problemNumber",
        isRowNumber: true,
        label: PROBLEM_LIST_COLUMN_LABELS[0],
        render: (item, index) =>
          item.problemNumber ?? activePage * pageSize + index + 1,
      },
      {
        key: "title",
        label: PROBLEM_LIST_COLUMN_LABELS[1],
        cellClassName: listCellClasses.twoLine,
      },
      {
        key: "description",
        label: PROBLEM_LIST_COLUMN_LABELS[2],
        cellClassName: listCellClasses.twoLine,
      },
      {
        key: "difficulty",
        label: PROBLEM_LIST_COLUMN_LABELS[3],
        render: (item) =>
          DIFFICULTY_MAP[item.difficulty as keyof typeof DIFFICULTY_MAP] ??
          item.difficulty,
      },
      {
        key: "accuracyRate",
        label: PROBLEM_LIST_COLUMN_LABELS[4],
        render: (item) =>
          typeof item.accuracyRate === "number" ? `${item.accuracyRate}%` : "-",
      },
      {
        key: "createdAt",
        label: PROBLEM_LIST_COLUMN_LABELS[5],
        render: (item) => formatDate(item.createdAt),
      },
    ],
    [activePage, pageSize],
  );

  useEffect(() => {
    const normalizedKeyword = keyword.trim();

    if (!normalizedKeyword) {
      return;
    }

    const controller = new AbortController();

    const fetchProblemSets = async () => {
      setSearchLoading(true);
      setSearchProblemSets([]);
      setSearchTotalPages(1);

      try {
        const allProblemSets = await getAllProblemSets({
          categoryId,
          size: PROBLEM_SET_PAGE_SIZE,
          init: {
            signal: controller.signal,
          },
        });

        if (controller.signal.aborted) {
          return;
        }

        const filteredProblemSets = allProblemSets.filter((problemSet) =>
          matchesProblemSetKeyword(problemSet, normalizedKeyword),
        );

        setSearchProblemSets(filteredProblemSets);
        setSearchTotalPages(
          Math.max(Math.ceil(filteredProblemSets.length / pageSize), 1),
        );
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setSearchProblemSets([]);
        setSearchTotalPages(1);
        handleClientError(error, {
          router,
          fallbackTitle: "문제 목록 조회 실패",
          fallbackMessage:
            "문제 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
          showModal: (title, content) => setModal({ open: true, title, content }),
        });
      } finally {
        if (!controller.signal.aborted) {
          setSearchLoading(false);
        }
      }
    };

    void fetchProblemSets();

    return () => {
      controller.abort();
    };
  }, [categoryId, keyword, pageSize, router]);

  const visibleProblemSets = useMemo(() => {
    if (!isSearchMode) {
      return initialProblemSets;
    }

    const start = searchPage * pageSize;

    return (searchProblemSets ?? []).slice(start, start + pageSize);
  }, [
    initialProblemSets,
    isSearchMode,
    pageSize,
    searchPage,
    searchProblemSets,
  ]);

  const handlePageChange = (nextPage: number) => {
    const params = new URLSearchParams(window.location.search);

    if (nextPage <= 0) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }

    const query = params.toString();
    router.push(`/problems${query ? `?${query}` : ""}`);
  };

  const handleSearch = (nextKeyword: string) => {
    const normalizedKeyword = nextKeyword.trim();

    setSearchPage(0);
    setKeyword(normalizedKeyword);

    if (!normalizedKeyword) {
      setSearchProblemSets(null);
      setSearchTotalPages(1);
      setSearchLoading(false);
    }
  };

  const handleRecommendationSelect = (targetProblemSetId: number) => {
    setRecommendationOpen(false);
    router.push(`/problems/${targetProblemSetId}`);
  };

  const handleHideRecommendationsToday = async () => {
    if (recommendationHidingToday) {
      return;
    }

    setRecommendationHidingToday(true);

    try {
      await hideProblemSetRecommendationsToday();
      setRecommendationOpen(false);
      setRecommendations([]);
    } catch (error) {
      handleClientError(error, {
        router,
        fallbackTitle: "추천 숨김 실패",
        fallbackMessage:
          "추천 문제를 오늘 하루 숨기지 못했습니다. 잠시 후 다시 시도해 주세요.",
        showModal: (title, content) => setModal({ open: true, title, content }),
      });
    } finally {
      setRecommendationHidingToday(false);
    }
  };

  return (
    <main className={userProblemListClasses.container}>
      <div className={userProblemListClasses.header}>
        <h1 className={userProblemListClasses.pageTitle}>문제풀이</h1>

        <div className={userProblemListClasses.searchWrap}>
          <Searchbar
            className="max-w-[260px]"
            onChange={setSearchInput}
            onSearch={handleSearch}
            placeholder="문제 제목 검색"
            value={searchInput}
          />
        </div>
      </div>

      {searchLoading ? (
        <ListSkeleton
          columns={[...PROBLEM_LIST_COLUMN_LABELS]}
          rowCount={PROBLEM_SET_PAGE_SIZE}
          statusMessage="문제 목록을 불러오는 중입니다."
        />
      ) : (
        <List
          columns={columns}
          data={visibleProblemSets}
          emptyMessage={
            isSearchMode
              ? "검색 조건에 맞는 문제가 없습니다."
              : "등록된 문제가 없습니다."
          }
          onRowClick={(item) => router.push(`/problems/${item.problemSetId}`)}
          pagination={
            <Pagination
              currentPage={isSearchMode ? searchPage : currentPage}
              onPageChange={isSearchMode ? setSearchPage : handlePageChange}
              totalPages={isSearchMode ? searchTotalPages : totalPages}
            />
          }
          rowHref={(item) => `/problems/${item.problemSetId}`}
          rowKey={(item) => item.problemSetId}
        />
      )}

      <OneButtonModal
        isOpen={modal.open}
        modalContent={modal.content}
        modalTitle={modal.title}
        onClose={() => setModal((prev) => ({ ...prev, open: false }))}
      />

      {recommendationOpen && recommendations.length > 0 && (
        <ProblemRecommendationModal
          isHidingToday={recommendationHidingToday}
          onClose={() => setRecommendationOpen(false)}
          onHideToday={handleHideRecommendationsToday}
          onSelect={handleRecommendationSelect}
          recommendations={recommendations}
        />
      )}
    </main>
  );
}
