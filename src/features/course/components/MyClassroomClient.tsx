"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { optimizedImageProps } from "@/components/common/imageOptimization";
import { cancelEnrollment } from "@/features/course/enrollmentActions";
import { resolveThumbnailUrl } from "@/features/course/http";
import type { Enrollment } from "@/features/course/types";
import TwoButtonModal from "@/components/common/TwoButtonModal";

interface MyClassroomClientProps {
  initialEnrollments: Enrollment[];
}

const isCompleted = (status?: string | null) =>
  (status ?? "").toUpperCase() === "COMPLETED";

export default function MyClassroomClient({
  initialEnrollments,
}: MyClassroomClientProps) {
  const router = useRouter();

  const [cancelTarget, setCancelTarget] = useState<Enrollment | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const inProgress = initialEnrollments.filter((e) => !isCompleted(e.status));
  const completed = initialEnrollments.filter((e) => isCompleted(e.status));

  const handleCancelConfirm = async () => {
    if (cancelTarget?.enrollmentId == null) return;
    setIsCancelling(true);
    try {
      await cancelEnrollment(cancelTarget.enrollmentId);
      setCancelTarget(null);
      router.refresh();
    } catch {
      setCancelTarget(null);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 space-y-6">
      <Section
        title="진행 중인 강의"
        count={inProgress.length}
        emptyText="진행 중인 강의가 없습니다."
        items={inProgress}
        onCancel={setCancelTarget}
      />

      <Section
        title="완료한 강의"
        count={completed.length}
        emptyText="완료한 강의가 없습니다."
        items={completed}
        onCancel={setCancelTarget}
      />

      <TwoButtonModal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelConfirm}
        confirmDisabled={isCancelling}
        modalTitle="수강 취소"
        modalContent={`'${cancelTarget?.courseTitle ?? "이 강좌"}' 수강을 취소하시겠습니까?`}
      />
    </div>
  );
}

interface SectionProps {
  title: string;
  count: number;
  emptyText: string;
  items: Enrollment[];
  onCancel: (enrollment: Enrollment) => void;
}

function Section({
  title,
  count,
  emptyText,
  items,
  onCancel,
}: SectionProps) {
  return (
    <section className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        <span className="text-sm font-medium text-blue-900 bg-gray-100 px-2 py-0.5 rounded-full">
          {count}개
        </span>
      </div>

      {items.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-400">
          {emptyText}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((e) => (
            <CourseCard
              key={e.enrollmentId ?? e.courseId}
              enrollment={e}
              onCancel={() => onCancel(e)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CourseCard({
  enrollment,
  onCancel,
}: {
  enrollment: Enrollment;
  onCancel: () => void;
}) {
  const thumb = resolveThumbnailUrl(enrollment.courseThumbnailUrl);
  const courseHref = enrollment.courseId
    ? `/courses/${enrollment.courseId}`
    : undefined;

  return (
    <article className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow">
      <CourseCardLink
        className="relative flex w-full h-36 bg-gray-100 items-center justify-center overflow-hidden"
        href={courseHref}
      >
        {thumb ? (
          <Image
            src={thumb}
            alt={enrollment.courseTitle ?? "강좌"}
            className="w-full h-full object-cover"
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            {...optimizedImageProps}
          />
        ) : (
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path
              d="M6 10c4-2 8-2 14 0 6-2 10-2 14 0v20c-4-2-8-2-14 0-6-2-10-2-14 0V10z"
              stroke="#9CA3AF"
              strokeWidth="2"
              strokeLinejoin="round"
              fill="none"
            />
            <path d="M20 10v20" stroke="#9CA3AF" strokeWidth="2" />
          </svg>
        )}
      </CourseCardLink>

      <div className="p-4">
        {enrollment.courseCategoryName && (
          <span className="inline-block text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded mb-2">
            {enrollment.courseCategoryName}
          </span>
        )}
        <CourseCardLink
          className="block text-inherit no-underline"
          href={courseHref}
        >
          <h3 className="text-base font-semibold text-gray-800 line-clamp-1">
            {enrollment.courseTitle ?? "제목 없음"}
          </h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2 min-h-9">
            {enrollment.courseDescription ?? ""}
          </p>
        </CourseCardLink>
        {enrollment.instructorName && (
          <p className="text-xs text-gray-500 mt-3">
            {enrollment.instructorName} 강사
          </p>
        )}

        <button
          type="button"
          onClick={() => {
            onCancel();
          }}
          className="mt-3 w-full py-2 text-sm font-medium text-red-500 border border-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
        >
          수강 취소
        </button>
      </div>
    </article>
  );
}

function CourseCardLink({
  children,
  className,
  href,
}: {
  children: ReactNode;
  className: string;
  href?: string;
}) {
  if (!href) {
    return <div className={className}>{children}</div>;
  }

  return (
    <Link className={className} href={href}>
      {children}
    </Link>
  );
}
