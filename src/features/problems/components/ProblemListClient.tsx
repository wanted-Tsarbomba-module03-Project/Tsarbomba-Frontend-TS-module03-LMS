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

import { getAllProblemSets, getProblemSetPage } from "../actions";
import {
  ADMIN_PROBLEM_LIST_COLUMN_LABELS,
  PROBLEM_LIST_COLUMN_LABELS,
  PROBLEM_LIST_COLUMN_WIDTHS,
  PROBLEM_SET_PAGE_SIZE,
} from "../constants";
import { matchesProblemSetKeyword } from "../search";
import type { ProblemSetSummary } from "../types";
import DifficultyBadge from "./DifficultyBadge";

const problemListClasses = {
  container: "min-h-screen bg-bg-main p-[30px]",
  header:
    "mb-5 flex items-center justify-between gap-4 max-md:flex-col max-md:items-stretch",
  pageTitle: "m-0 text-title-lg font-bold text-text-primary",
  headerActions:
    "flex flex-wrap items-center justify-end gap-3 max-md:justify-start",
  registerButton:
    "cursor-pointer rounded-base border border-button-blue-bg bg-button-blue-bg px-[18px] py-2.5 text-description font-semibold text-text-white hover:bg-button-blue-hover-bg max-md:w-full",
} as const;

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

export default function ProblemListClient() {
  const router = useRouter();

  const [problemSets, setProblemSets] = useState<ProblemSetSummary[]>([]);
  const [searchProblemSets, setSearchProblemSets] = useState<
    ProblemSetSummary[] | null
  >(null);
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal] = useState({
    open: false,
    title: "",
    content: "",
  });
  const isSearchMode = keyword.trim().length > 0;

  const columns = useMemo<ListColumn<ProblemSetSummary>[]>(
    () => [
      {
        key: "problemNumber",
        isRowNumber: true,
        width: PROBLEM_LIST_COLUMN_WIDTHS[0],
        label: PROBLEM_LIST_COLUMN_LABELS[0],
        render: (item, index) =>
          item.problemNumber ?? page * PROBLEM_SET_PAGE_SIZE + index + 1,
      },
      {
        key: "title",
        label: PROBLEM_LIST_COLUMN_LABELS[1],
        cellClassName: listCellClasses.twoLine,
        width: PROBLEM_LIST_COLUMN_WIDTHS[1],
        mobilePrimary: true,
      },
      {
        key: "description",
        label: PROBLEM_LIST_COLUMN_LABELS[2],
        cellClassName: listCellClasses.twoLine,
        width: PROBLEM_LIST_COLUMN_WIDTHS[2],
        mobileSecondary: true,
      },
      {
        key: "difficulty",
        width: PROBLEM_LIST_COLUMN_WIDTHS[3],
        label: PROBLEM_LIST_COLUMN_LABELS[3],
        title: () => undefined,
        render: (item) => <DifficultyBadge difficulty={item.difficulty} />,
      },
      {
        key: "accuracyRate",
        width: PROBLEM_LIST_COLUMN_WIDTHS[4],
        label: PROBLEM_LIST_COLUMN_LABELS[4],
        render: (item) =>
          typeof item.accuracyRate === "number" ? `${item.accuracyRate}%` : "-",
      },
      {
        key: "createdAt",
        width: PROBLEM_LIST_COLUMN_WIDTHS[5],
        label: ADMIN_PROBLEM_LIST_COLUMN_LABELS[5],
        render: (item) => formatDate(item.createdAt),
      },
    ],
    [page],
  );

  useEffect(() => {
    if (isSearchMode) {
      return;
    }

    const controller = new AbortController();

    const fetchProblemSets = async () => {
      setIsLoading(true);

      try {
        const data = await getProblemSetPage({
          page,
          size: PROBLEM_SET_PAGE_SIZE,
          init: {
            signal: controller.signal,
          },
        });

        if (controller.signal.aborted) {
          return;
        }

        setProblemSets(data.problemSets);
        setTotalPages(data.totalPages);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        handleClientError(error, {
          router,
          fallbackTitle: "문제 목록 조회 실패",
          fallbackMessage:
            "문제 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
          showModal: (title, content) => {
            setModal({ open: true, title, content });
          },
        });
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void fetchProblemSets();

    return () => {
      controller.abort();
    };
  }, [isSearchMode, page, router]);

  useEffect(() => {
    const normalizedKeyword = keyword.trim();

    if (!normalizedKeyword) {
      return;
    }

    const controller = new AbortController();

    const fetchProblemSets = async () => {
      setIsLoading(true);
      setSearchProblemSets([]);
      setTotalPages(1);

      try {
        const allProblemSets = await getAllProblemSets({
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
        setTotalPages(
          Math.max(
            Math.ceil(filteredProblemSets.length / PROBLEM_SET_PAGE_SIZE),
            1,
          ),
        );
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setSearchProblemSets([]);
        setTotalPages(1);
        handleClientError(error, {
          router,
          fallbackTitle: "문제 목록 조회 실패",
          fallbackMessage:
            "문제 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
          showModal: (title, content) => {
            setModal({ open: true, title, content });
          },
        });
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void fetchProblemSets();

    return () => {
      controller.abort();
    };
  }, [keyword, router]);

  const visibleProblemSets = useMemo(() => {
    if (!isSearchMode) {
      return problemSets;
    }

    const start = page * PROBLEM_SET_PAGE_SIZE;

    return (searchProblemSets ?? []).slice(
      start,
      start + PROBLEM_SET_PAGE_SIZE,
    );
  }, [isSearchMode, page, problemSets, searchProblemSets]);

  const handleSearch = (nextKeyword: string) => {
    const normalizedKeyword = nextKeyword.trim();

    setPage(0);
    setKeyword(normalizedKeyword);

    if (!normalizedKeyword) {
      setSearchProblemSets(null);
    }
  };

  return (
    <main className={problemListClasses.container}>
      <div className={problemListClasses.header}>
        <h1 className={problemListClasses.pageTitle}>문제 관리</h1>

        <div className={problemListClasses.headerActions}>
          <Searchbar
            className="max-w-[260px]"
            onChange={setSearchInput}
            onSearch={handleSearch}
            placeholder="문제 제목 검색"
            value={searchInput}
          />

          <button
            className={problemListClasses.registerButton}
            onClick={() => router.push("/admin/problems/new")}
            type="button"
          >
            등록하기
          </button>
        </div>
      </div>

      {isLoading ? (
        <ListSkeleton
          colWidths={PROBLEM_LIST_COLUMN_WIDTHS}
          columns={[...ADMIN_PROBLEM_LIST_COLUMN_LABELS]}
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
          onRowClick={(item) =>
            router.push(`/admin/problems/${item.problemSetId}/edit`)
          }
          pagination={
            <Pagination
              currentPage={page}
              disabled={isLoading}
              onPageChange={setPage}
              totalPages={totalPages}
            />
          }
          rowKey={(item) => item.problemSetId}
        />
      )}

      <OneButtonModal
        isOpen={modal.open}
        modalContent={modal.content}
        modalTitle={modal.title}
        onClose={() => setModal((prev) => ({ ...prev, open: false }))}
      />
    </main>
  );
}
