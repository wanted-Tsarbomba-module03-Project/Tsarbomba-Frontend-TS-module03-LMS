import { Skeleton } from "primereact/skeleton";

function CourseCardSkeleton() {
  return (
    <div className="w-[78%] shrink-0 sm:w-auto sm:shrink overflow-hidden rounded-lg border border-border-light bg-bg-box">
      <Skeleton borderRadius="0" height="144px" width="100%" />
      <div className="p-4">
        {/* 제목 (1줄) — 카테고리 뱃지·강사명은 데이터에 따라 없을 수 있어 스켈레톤에서 제외(과대 높이 방지) */}
        <Skeleton borderRadius="8px" height="20px" width="78%" />
        {/* 설명 (2줄, min-h-9) */}
        <Skeleton borderRadius="8px" className="mt-1" height="16px" width="92%" />
        <Skeleton borderRadius="8px" className="mt-1" height="16px" width="68%" />
        {/* 하단 액션(수강 취소 버튼 / 수강 완료 배지) — 두 섹션 모두 동일 높이 */}
        <Skeleton
          borderRadius="8px"
          className="mt-3"
          height="36px"
          width="100%"
        />
      </div>
    </div>
  );
}

function ClassroomSectionSkeleton({ title }: { title: string }) {
  return (
    <section className="rounded-lg border border-border-light p-6">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-bold text-text-primary">{title}</h2>
        <Skeleton borderRadius="999px" height="22px" width="38px" />
      </div>

      <div
        aria-hidden="true"
        className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 md:grid-cols-4 sm:gap-4 sm:overflow-x-hidden sm:overflow-y-auto sm:max-h-[300px] sm:pb-0 sm:pr-1"
      >
        {Array.from({ length: 4 }, (_, index) => (
          <CourseCardSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}

export default function MyClassroomSkeleton() {
  return (
    <div aria-busy="true" className="mx-auto max-w-6xl space-y-6 px-6">
      <p aria-live="polite" className="sr-only" role="status">
        내 강의실 정보를 불러오는 중입니다.
      </p>

      <ClassroomSectionSkeleton title="진행 중인 강의" />
      <ClassroomSectionSkeleton title="완료한 강의" />
    </div>
  );
}
