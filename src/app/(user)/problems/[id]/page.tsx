// SSR+CSR - 회원 문제풀이: 문제 기본 정보는 서버에서 먼저 조회하고, 코드 입력/실행/제출/채팅은 클라이언트에서 처리함
import { cookies } from "next/headers";

import JsonLdScript from "@/components/common/JsonLdScript";
import {
  getProblemSetDetail,
  getProblemSetResult,
} from "@/features/problems/actions";
import UserProblemDetailClient from "@/features/problems/components/UserProblemDetailClient";
import { createBreadcrumbJsonLd, createPageMetadata } from "@/lib/seo";

interface ProblemDetailPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    userId?: string;
  }>;
}

export async function generateMetadata({ params }: ProblemDetailPageProps) {
  const { id } = await params;

  return createPageMetadata({
    description:
      "codebomba 문제 상세 페이지에서 문제 설명, 풀이 영역, 결과와 추천 강의를 확인하세요.",
    path: `/problems/${id}`,
    title: "문제 상세",
  });
}

export default async function ProblemDetailPage({
  params,
  searchParams,
}: ProblemDetailPageProps) {
  const { id } = await params;
  const { userId } = await searchParams;
  const cookieHeader = (await cookies()).toString();
  const requestInit = {
    cache: "no-store",
    ...(cookieHeader ? { headers: { Cookie: cookieHeader } } : {}),
  } as const;
  const problemSet = await getProblemSetDetail(id, userId ?? "", requestInit);
  const problemSetResult = await getProblemSetResult(id, requestInit).catch(
    () => null,
  );
  const problemTitle = problemSet.title || "문제 상세";
  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: "홈", path: "/" },
    { name: "문제풀이", path: "/problems" },
    { name: problemTitle, path: `/problems/${id}` },
  ]);

  return (
    <>
      <JsonLdScript
        data={breadcrumbJsonLd}
        id="problem-detail-breadcrumb-jsonld"
      />
      <UserProblemDetailClient
        initialProblemSet={problemSet}
        initialProblemSetResult={problemSetResult}
        initialUserId={userId ?? ""}
        problemSetId={id}
      />
    </>
  );
}
