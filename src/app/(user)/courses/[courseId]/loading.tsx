import CourseDetailSkeleton from "@/features/course/components/CourseDetailSkeleton";

// 강좌 상세 서버 데이터(getCourseServer 등) 로딩 중 Suspense 폴백으로 표시된다.
export default function Loading() {
  return <CourseDetailSkeleton />;
}
