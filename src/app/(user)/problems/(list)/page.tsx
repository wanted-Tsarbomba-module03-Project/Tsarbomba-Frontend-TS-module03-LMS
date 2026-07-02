// SSR(30초 데이터 재검증)+CSR - 회원 문제 전체조회: 세션 기반 목록을 서버에서 갱신하고 행 클릭은 클라이언트에서 처리함
import { cookies } from "next/headers";

import JsonLdScript from "@/components/common/JsonLdScript";
import { getProblemSetPage } from "@/features/problems/actions";
import UserProblemListClient from "@/features/problems/components/UserProblemListClient";
import { PROBLEM_SET_PAGE_SIZE } from "@/features/problems/constants";
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
    page?: string;
  }>;
}

export default async function ProblemsPage({ searchParams }: ProblemsPageProps) {
  const { categoryId, page } = await searchParams;
  const currentPage = getPageParam(page);
  const cookieHeader = (await cookies()).toString();
  const problemSetPage = await getProblemSetPage({
    categoryId,
    page: currentPage,
    size: PROBLEM_SET_PAGE_SIZE,
    revalidateSeconds: 30,
    init: {
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
        currentPage={currentPage}
        initialProblemSets={problemSetPage.problemSets}
        pageSize={PROBLEM_SET_PAGE_SIZE}
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
