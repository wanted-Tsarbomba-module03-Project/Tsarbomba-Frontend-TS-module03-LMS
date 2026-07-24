"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  PROBLEM_LIST_COLUMN_WIDTHS,
  PROBLEM_COMPLETION_STATUS_LABELS,
  PROBLEM_SET_SORT_LABELS,
  PROBLEM_SET_PAGE_SIZE,
  SORT_DIRECTION_LABELS,
} from "../constants";
import { matchesProblemSetKeyword } from "../search";
import type {
  ProblemCompletionStatus,
  ProblemDifficulty,
  ProblemSetRecommendation,
  ProblemSetSort,
  ProblemSetSummary,
  SortDirection,
} from "../types";
import ProblemRecommendationModal from "./ProblemRecommendationModal";

const userProblemListClasses = {
  container: "min-h-screen bg-bg-main py-[30px] max-md:py-6",
  header:
    "mb-5 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 max-lg:grid-cols-1",
  pageTitle: "m-0 text-title-lg font-bold text-text-primary",
  searchWrap:
    "flex min-w-0 flex-nowrap items-center justify-end gap-1.5 max-md:flex-wrap max-md:justify-start",
  filterWrap: "relative min-w-0",
  filterButton:
    "mx-auto flex h-9 min-w-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-base border border-border-light bg-bg-box px-3 text-description font-semibold text-text-primary transition hover:border-[#1a237e] hover:bg-[#eef2ff] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1a237e]",
  filterMenu:
    "fixed z-50 overflow-y-auto rounded-base border border-border-light bg-white p-1.5 text-left shadow-[0_14px_32px_rgba(15,23,42,0.18)]",
  filterOption:
    "flex w-full cursor-pointer items-center gap-2 rounded-base px-2.5 py-2 text-left text-description font-semibold text-text-primary transition hover:bg-[#eef2ff] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1a237e]",
  filterOptionActive: "bg-[#eef2ff] text-[#1a237e]",
  filterSwatch: "h-2.5 w-2.5 shrink-0 rounded-full",
  filterLabel: "truncate min-w-0",
  filterCaret: "ml-0.5 text-[10px] leading-none text-text-secondary",
  toolbarFilter:
    "mx-0 w-auto shrink-0 [&_button]:mx-0 [&_button]:h-[clamp(40px,3.7vh,56px)]",
  tableHeaderFilter:
    "w-full min-w-0 [&_button]:mx-auto [&_button]:h-auto [&_button]:max-w-full [&_button]:border-0 [&_button]:bg-transparent [&_button]:px-2 [&_button]:py-1 [&_button:hover]:bg-[#e5e7eb] [&_button:hover]:shadow-none",
  difficultyBadge:
    "inline-flex h-8 min-w-[58px] items-center justify-center rounded-full px-3 text-description font-semibold",
} as const;

interface UserProblemListClientProps {
  categoryId?: string;
  completionStatus: ProblemCompletionStatus | null;
  currentPage: number;
  difficulty: ProblemDifficulty | null;
  direction: SortDirection;
  initialProblemSets: ProblemSetSummary[];
  pageSize: number;
  sort: ProblemSetSort;
  totalPages: number;
}

type FilterValue = string;
type FilterMenuPosition = {
  left: number;
  top: number;
  minWidth: number;
  maxHeight: number;
};

interface FilterOption<T extends FilterValue> {
  label: string;
  value: T;
  swatchClassName?: string;
}

type SortDirectionValue = `${ProblemSetSort}:${SortDirection}`;

const difficultyOptions: Array<FilterOption<ProblemDifficulty>> = [
  { label: DIFFICULTY_MAP.EASY, value: "EASY", swatchClassName: "bg-[#22c55e]" },
  {
    label: DIFFICULTY_MAP.MEDIUM,
    value: "MEDIUM",
    swatchClassName: "bg-[#eab308]",
  },
  { label: DIFFICULTY_MAP.HARD, value: "HARD", swatchClassName: "bg-[#ef4444]" },
];

const completionStatusOptions: Array<FilterOption<ProblemCompletionStatus>> = [
  {
    label: PROBLEM_COMPLETION_STATUS_LABELS.NOT_STARTED,
    value: "NOT_STARTED",
    swatchClassName: "bg-[#94a3b8]",
  },
  {
    label: PROBLEM_COMPLETION_STATUS_LABELS.IN_PROGRESS,
    value: "IN_PROGRESS",
    swatchClassName: "bg-[#f97316]",
  },
  {
    label: PROBLEM_COMPLETION_STATUS_LABELS.COMPLETED,
    value: "COMPLETED",
    swatchClassName: "bg-[#10b981]",
  },
];

const sortDirectionOptions: Array<FilterOption<SortDirectionValue>> = [
  {
    label: `${PROBLEM_SET_SORT_LABELS.DEFAULT} · ${SORT_DIRECTION_LABELS.ASC}`,
    value: "DEFAULT:ASC",
  },
  {
    label: `${PROBLEM_SET_SORT_LABELS.DEFAULT} · ${SORT_DIRECTION_LABELS.DESC}`,
    value: "DEFAULT:DESC",
  },
  {
    label: `${PROBLEM_SET_SORT_LABELS.POPULAR} · ${SORT_DIRECTION_LABELS.ASC}`,
    value: "POPULAR:ASC",
  },
  {
    label: `${PROBLEM_SET_SORT_LABELS.POPULAR} · ${SORT_DIRECTION_LABELS.DESC}`,
    value: "POPULAR:DESC",
  },
];

const difficultyClassNames: Record<ProblemDifficulty, string> = {
  EASY: "bg-[#dcfce7] text-[#15803d]",
  MEDIUM: "bg-[#fef9c3] text-[#854d0e]",
  HARD: "bg-[#fee2e2] text-[#b91c1c]",
};

const completionStatusClassNames: Record<ProblemCompletionStatus, string> = {
  NOT_STARTED: "bg-[#f1f5f9] text-[#475569]",
  IN_PROGRESS: "bg-[#ffedd5] text-[#c2410c]",
  COMPLETED: "bg-[#dcfce7] text-[#15803d]",
};

function FilterDropdown<T extends FilterValue>({
  className = "",
  compactTrigger = false,
  includeAll = true,
  label,
  onChange,
  options,
  value,
}: {
  className?: string;
  compactTrigger?: boolean;
  includeAll?: boolean;
  label: string;
  onChange: (value: T | "") => void;
  options: Array<FilterOption<T>>;
  value: T | "";
}) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<FilterMenuPosition | null>(
    null,
  );
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value);
  const dropdownOptions = includeAll
    ? [
        {
          label: "전체",
          value: "" as const,
          swatchClassName: undefined,
        },
        ...options,
      ]
    : options;

  const updateMenuPosition = useCallback(() => {
    const button = buttonRef.current;

    if (!button) {
      return;
    }

    const rect = button.getBoundingClientRect();
    const minWidth = Math.max(144, rect.width);
    const horizontalPadding = 8;
    const menuMaxHeight = 256;
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const opensUp = spaceBelow < 140 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(
      120,
      Math.min(menuMaxHeight, opensUp ? spaceAbove : spaceBelow),
    );
    const unclampedLeft = rect.left + rect.width / 2;
    const minLeft = horizontalPadding + minWidth / 2;
    const maxLeft = window.innerWidth - horizontalPadding - minWidth / 2;

    setMenuPosition({
      left: Math.min(Math.max(unclampedLeft, minLeft), maxLeft),
      top: opensUp ? Math.max(8, rect.top - maxHeight - 6) : rect.bottom + 6,
      minWidth,
      maxHeight,
    });
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (
        !wrapRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    updateMenuPosition();

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open, updateMenuPosition]);

  const filterMenu =
    open && menuPosition && typeof document !== "undefined"
      ? createPortal(
          <div
            className={userProblemListClasses.filterMenu}
            ref={menuRef}
            role="listbox"
            style={{
              left: menuPosition.left,
              top: menuPosition.top,
              minWidth: menuPosition.minWidth,
              maxHeight: menuPosition.maxHeight,
              transform: "translateX(-50%)",
            }}
          >
            {dropdownOptions.map((option) => {
              const selected = option.value === value;

              return (
                <button
                  aria-selected={selected}
                  className={`${userProblemListClasses.filterOption} ${
                    selected ? userProblemListClasses.filterOptionActive : ""
                  }`}
                  key={String(option.value)}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  role="option"
                  type="button"
                >
                  {option.swatchClassName && (
                    <span
                      aria-hidden="true"
                      className={`${userProblemListClasses.filterSwatch} ${option.swatchClassName}`}
                    />
                  )}
                  {option.label}
                </button>
              );
            })}
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      className={`${userProblemListClasses.filterWrap} ${className}`}
      ref={wrapRef}
    >
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`${label} 선택`}
        className={userProblemListClasses.filterButton}
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        ref={buttonRef}
        type="button"
      >
        {selectedOption?.swatchClassName && (
          <span
            aria-hidden="true"
            className={`${userProblemListClasses.filterSwatch} ${selectedOption.swatchClassName}`}
          />
        )}
        <span className={userProblemListClasses.filterLabel}>
          {compactTrigger
            ? (selectedOption?.label ?? label)
            : `${label}: ${selectedOption?.label ?? "전체"}`}
        </span>
        <span aria-hidden="true" className={userProblemListClasses.filterCaret}>
          ▼
        </span>
      </button>
      {filterMenu}
    </div>
  );
}

export default function UserProblemListClient({
  categoryId,
  completionStatus,
  currentPage,
  difficulty,
  direction,
  initialProblemSets,
  pageSize,
  sort,
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

  const updateListQuery = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(window.location.search);

      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      params.delete("page");

      const query = params.toString();
      router.push(`/problems${query ? `?${query}` : ""}`);
    },
    [router],
  );

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
        width: PROBLEM_LIST_COLUMN_WIDTHS[0],
        label: PROBLEM_LIST_COLUMN_LABELS[0],
        render: (item, index) =>
          item.problemNumber ?? activePage * pageSize + index + 1,
      },
      {
        key: "title",
        label: PROBLEM_LIST_COLUMN_LABELS[1],
        cellClassName: listCellClasses.twoLineKeepAll,
        width: PROBLEM_LIST_COLUMN_WIDTHS[1],
      },
      {
        key: "description",
        label: PROBLEM_LIST_COLUMN_LABELS[2],
        cellClassName: listCellClasses.twoLine,
        width: PROBLEM_LIST_COLUMN_WIDTHS[2],
        render: (item) => (
          <span className={listCellClasses.twoLine}>{item.description}</span>
        ),
      },
      {
        key: "difficulty",
        width: PROBLEM_LIST_COLUMN_WIDTHS[3],
        label: (
          <FilterDropdown
            className={userProblemListClasses.tableHeaderFilter}
            compactTrigger
            label={PROBLEM_LIST_COLUMN_LABELS[3]}
            onChange={(nextDifficulty) =>
              updateListQuery({ difficulty: nextDifficulty || null })
            }
            options={difficultyOptions}
            value={difficulty ?? ""}
          />
        ),
        title: () => undefined,
        render: (item) => {
          const knownDifficulty =
            item.difficulty === "EASY" ||
            item.difficulty === "MEDIUM" ||
            item.difficulty === "HARD"
              ? item.difficulty
              : null;

          if (!knownDifficulty) {
            return item.difficulty || "-";
          }

          return (
            <span
              className={`${userProblemListClasses.difficultyBadge} ${
                difficultyClassNames[knownDifficulty]
              }`}
            >
              {DIFFICULTY_MAP[knownDifficulty]}
            </span>
          );
        },
      },
      {
        key: "accuracyRate",
        width: PROBLEM_LIST_COLUMN_WIDTHS[4],
        label: PROBLEM_LIST_COLUMN_LABELS[4],
        render: (item) =>
          typeof item.accuracyRate === "number" ? `${item.accuracyRate}%` : "-",
      },
      {
        key: "completionStatus",
        width: PROBLEM_LIST_COLUMN_WIDTHS[5],
        label: (
          <FilterDropdown
            className={userProblemListClasses.tableHeaderFilter}
            compactTrigger
            label={PROBLEM_LIST_COLUMN_LABELS[5]}
            onChange={(nextCompletionStatus) =>
              updateListQuery({
                completionStatus: nextCompletionStatus || null,
              })
            }
            options={completionStatusOptions}
            value={completionStatus ?? ""}
          />
        ),
        title: () => undefined,
        render: (item) => {
          const knownStatus =
            item.completionStatus === "NOT_STARTED" ||
            item.completionStatus === "IN_PROGRESS" ||
            item.completionStatus === "COMPLETED"
              ? item.completionStatus
              : null;

          if (!knownStatus) {
            return "-";
          }

          return (
            <span
              className={`${userProblemListClasses.difficultyBadge} ${
                completionStatusClassNames[knownStatus]
              }`}
            >
              {PROBLEM_COMPLETION_STATUS_LABELS[knownStatus]}
            </span>
          );
        },
      },
    ],
    [activePage, completionStatus, difficulty, pageSize, updateListQuery],
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
          completionStatus,
          difficulty,
          direction,
          sort,
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
  }, [
    categoryId,
    completionStatus,
    difficulty,
    direction,
    keyword,
    pageSize,
    router,
    sort,
  ]);

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
            className="min-w-[220px] max-w-[360px] max-md:!w-full max-md:max-w-none"
            onChange={setSearchInput}
            onSearch={handleSearch}
            placeholder="문제 제목 검색"
            value={searchInput}
          />
          <FilterDropdown
            className={userProblemListClasses.toolbarFilter}
            includeAll={false}
            label="정렬"
            onChange={(nextSortDirection) => {
              const [nextSort, nextDirection] = (
                nextSortDirection || "DEFAULT:ASC"
              ).split(":") as [ProblemSetSort, SortDirection];

              updateListQuery({
                direction: nextDirection,
                sort: nextSort,
              });
            }}
            options={sortDirectionOptions}
            value={`${sort}:${direction}`}
          />
        </div>
      </div>

      {searchLoading ? (
        <ListSkeleton
          colWidths={PROBLEM_LIST_COLUMN_WIDTHS}
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
