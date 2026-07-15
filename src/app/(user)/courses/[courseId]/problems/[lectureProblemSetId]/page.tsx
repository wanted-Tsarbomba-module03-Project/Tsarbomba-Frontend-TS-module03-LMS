import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getLectureProblemSet } from "@/features/course/problems/actions";
import { getMyEnrollmentsServer } from "@/features/course/server";
import CourseProblemDetailClient from "@/features/course/problems/components/CourseProblemDetailClient";
import ErrorPageView from "@/components/common/ErrorPageView";
import { ApiClientError } from "@/lib/errorHandling";
import type { ProblemSetDetail } from "@/features/problems/types";

// 진행 상태(잠금 해제 등)가 매 진입마다 최신이어야 하므로 정적 캐시를 강제로 끈다.
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface CourseProblemPageProps {
  params: Promise<{
    courseId: string;
    lectureProblemSetId: string;
  }>;
}

export default async function CourseProblemPage({
  params,
}: CourseProblemPageProps) {
  const { courseId, lectureProblemSetId } = await params;
  const cookieHeader = (await cookies()).toString();

  // null = 조회 실패(401 등), [] = 등록 0건. 실패만 건너뛰고 0건은 정상 차단
  const enrollments = await getMyEnrollmentsServer().catch(() => null);
  if (enrollments !== null) {
    const enrolled = enrollments.some(
      (e) => String(e.courseId) === String(courseId),
    );
    if (!enrolled) {
      redirect(`/courses/${courseId}`);
    }
  }

  let problemSet: ProblemSetDetail;
  try {
    problemSet = await getLectureProblemSet(lectureProblemSetId, {
      cache: "no-store",
      ...(cookieHeader ? { headers: { Cookie: cookieHeader } } : {}),
    });
  } catch (error) {
    const status = error instanceof ApiClientError ? error.status : undefined;
    // 미수강·미해금(잠금) 등 접근 권한 문제(404/403)는 죽은 에러 화면 대신 강좌 페이지로 안내.
    // (수강 신청 버튼·잠금 안내가 있는 곳 — 서버 컴포넌트라 모달을 띄울 수 없어 리다이렉트로 처리)
    if (status === 404 || status === 403) {
      redirect(`/courses/${courseId}`);
    }
    const message =
      error instanceof Error
        ? error.message
        : "문제 정보를 불러오지 못했습니다.";
    return (
      <ErrorPageView
        status={status ?? 500}
        message={message}
        returnTo={`/courses/${courseId}`}
      />
    );
  }

  return (
    <CourseProblemDetailClient
      courseId={courseId}
      lectureProblemSetId={lectureProblemSetId}
      initialProblemSet={problemSet}
    />
  );
}
