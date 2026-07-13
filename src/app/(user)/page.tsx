import { getUserCoursesServer } from "@/features/course/server";
import { getMyProfileServer } from "@/features/user/server";
import CourseListClient from "@/features/course/components/CourseListClient";
import HomeLandingGuide from "@/features/home/components/HomeLandingGuide";

export default async function StudentCourseListPage() {
  // 로그인 여부를 보호된 엔드포인트(/users/me)로 확인한다.
  // /courses 는 공개 API라 비로그인에도 200을 주므로 로그인 판별에 쓸 수 없다.
  // 미인증(401)뿐 아니라 백엔드 접속 실패 등 어떤 이유로든 로그인 확인이 안 되면
  // 홈이 크래시(화이트스크린)하지 않도록 공개 가이드 랜딩으로 폴백한다.
  try {
    await getMyProfileServer();
  } catch {
    return <HomeLandingGuide />;
  }

  // 로그인 상태 → 강좌 목록 (조회 실패 시에도 크래시 대신 빈 목록으로 표시)
  try {
    const courses = await getUserCoursesServer();
    const activeCourses = courses.filter(
      (course) => course.status === "ACTIVE",
    );
    return <CourseListClient initialCourses={activeCourses} />;
  } catch {
    return <CourseListClient initialCourses={[]} />;
  }
}
