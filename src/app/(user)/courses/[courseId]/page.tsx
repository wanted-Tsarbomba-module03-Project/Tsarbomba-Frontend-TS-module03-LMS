import { redirect } from "next/navigation";
import {
  getCourseLecturesServer,
  getCourseServer,
  getMyEnrollmentsServer,
  UnauthorizedError,
} from "@/features/course/server";
import CourseDetailClient from "@/features/course/components/CourseDetailClient";
import ErrorPageView from "@/components/common/ErrorPageView";
import type {
  CourseDetail,
  Enrollment,
  LectureSummary,
} from "@/features/course/types";

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { courseId } = await params;

  // 수강여부는 서버에서 미리 확인 → 클라 로딩/깜빡임/스켈레톤 제거.
  // 비로그인·교사·조회 실패 시 빈 배열(수강 안 함으로 처리).
  const enrollmentsPromise = getMyEnrollmentsServer().catch(
    () => [] as Enrollment[],
  );

  let course: CourseDetail;
  let lectures: LectureSummary[];
  try {
    [course, lectures] = await Promise.all([
      getCourseServer(courseId),
      getCourseLecturesServer(courseId),
    ]);
  } catch (error) {
    if (error instanceof UnauthorizedError) redirect("/auth/login");
    return <ErrorPageView status={404} message="강좌를 찾을 수 없습니다." />;
  }

  const enrollments = await enrollmentsPromise;
  const initialEnrollment =
    enrollments.find((e) => String(e.courseId) === String(courseId)) ?? null;

  return (
    <CourseDetailClient
      courseId={courseId}
      course={course}
      lectures={lectures}
      initialEnrollment={initialEnrollment}
    />
  );
}
