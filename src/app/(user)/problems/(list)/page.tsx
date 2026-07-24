// SSR(no-store)+CSR - 회원 문제 전체조회: 세션 기반 풀이 상태를 서버에서 갱신하고 행 클릭은 클라이언트에서 처리함
import { cookies } from "next/headers";

import JsonLdScript from "@/components/common/JsonLdScript";
import { getProblemSetPage } from "@/features/problems/actions";
import UserProblemListClient from "@/features/problems/components/UserProblemListClient";
import { PROBLEM_SET_PAGE_SIZE } from "@/features/problems/constants";
import type {
  ProblemCompletionStatus,
  ProblemDifficulty,
  ProblemSetSort,
  SortDirection,
} from "@/features/problems/types";
import {
  createBreadcrumbJsonLd,
  createItemListJsonLd,
  createPageMetadata,
} from "@/lib/seo";

export const metadata = createPageMetadata({
  description:
    "codebomba에서 다양한 문제를 난이도, 정답률, 카테고리 기준으로 탐색하고 풀이를 시작하세요.",
  path: "/problems",
  title: "문제풀이",
});

interface ProblemsPageProps {
  searchParams: Promise<{
    categoryId?: string;
    completionStatus?: string;
    difficulty?: string;
    direction?: string;
    page?: string;
    sort?: string;
  }>;
}

export default async function ProblemsPage({ searchParams }: ProblemsPageProps) {
  const { categoryId, completionStatus, difficulty, direction, page, sort } =
    await searchParams;
  const currentPage = getPageParam(page);
  const currentCompletionStatus = getCompletionStatusParam(completionStatus);
  const currentDifficulty = getDifficultyParam(difficulty);
  const currentSort = getSortParam(sort);
  const currentDirection = getDirectionParam(direction);
  const cookieHeader = (await cookies()).toString();
  const problemSetPage = await getProblemSetPage({
    categoryId,
    completionStatus: currentCompletionStatus,
    difficulty: currentDifficulty,
    direction: currentDirection,
    page: currentPage,
    size: PROBLEM_SET_PAGE_SIZE,
    sort: currentSort,
    init: {
      cache: "no-store",
      ...(cookieHeader ? { headers: { Cookie: cookieHeader } } : {}),
    },
  });
  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: "홈", path: "/" },
    { name: "문제풀이", path: "/problems" },
  ]);
  const problemListJsonLd = createItemListJsonLd({
    description:
      "codebomba에서 풀이할 수 있는 문제 목록과 각 문제 상세 페이지입니다.",
    items: problemSetPage.problemSets.map((problemSet) => ({
      description: problemSet.description,
      name: problemSet.title,
      path: `/problems/${problemSet.problemSetId}`,
    })),
    name: "문제풀이 목록",
  });

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} id="problem-list-breadcrumb-jsonld" />
      <JsonLdScript data={problemListJsonLd} id="problem-list-jsonld" />
      <UserProblemListClient
        categoryId={categoryId}
        completionStatus={currentCompletionStatus}
        currentPage={currentPage}
        difficulty={currentDifficulty}
        direction={currentDirection}
        initialProblemSets={problemSetPage.problemSets}
        pageSize={PROBLEM_SET_PAGE_SIZE}
        sort={currentSort}
        totalPages={problemSetPage.totalPages}
      />
    </>
  );
}

function getPageParam(value?: string) {
  const page = Number(value ?? 0);

  if (!Number.isInteger(page) || page < 0) {
    return 0;
  }

  return page;
}

function getDifficultyParam(value?: string): ProblemDifficulty | null {
  return value === "EASY" || value === "MEDIUM" || value === "HARD"
    ? value
    : null;
}

function getCompletionStatusParam(
  value?: string,
): ProblemCompletionStatus | null {
  return value === "NOT_STARTED" ||
    value === "IN_PROGRESS" ||
    value === "COMPLETED"
    ? value
    : null;
}

function getSortParam(value?: string): ProblemSetSort {
  return value === "POPULAR" ? "POPULAR" : "DEFAULT";
}

function getDirectionParam(value?: string): SortDirection {
  return value === "DESC" ? "DESC" : "ASC";
}
