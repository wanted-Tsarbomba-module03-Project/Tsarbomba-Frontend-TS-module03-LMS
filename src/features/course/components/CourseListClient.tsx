"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import CategoryNav from "@/components/layout/CategoryNav";
import CourseItem from "@/features/admin/operations/components/CourseItem";
import {
  ALL_COURSE_CATEGORY,
  COURSE_SEARCH_PARAM,
  filterCourses,
} from "@/features/course/search";
import type { Course } from "@/features/course/types";

interface CourseListClientProps {
  initialCourses: Course[];
}

function CourseListContent({ initialCourses }: CourseListClientProps) {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || ALL_COURSE_CATEGORY;
  const keyword = searchParams.get(COURSE_SEARCH_PARAM) ?? "";

  const filteredCourses = useMemo(
    () => filterCourses(initialCourses, { category, keyword }),
    [category, initialCourses, keyword],
  );

  return (
    <div className="mx-auto w-full max-w-7xl">
      {filteredCourses.length === 0 ? (
        <div className="py-24 text-center text-[14px] text-[#C8C8C8]">
          {keyword.trim()
            ? "검색 조건에 맞는 강좌가 없습니다."
            : category === ALL_COURSE_CATEGORY
              ? "등록된 강좌가 없습니다."
              : `'${category}' 카테고리의 강좌가 없습니다.`}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
          {filteredCourses.map((course) => (
            <CourseItem key={course.courseId} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CourseListClient({
  initialCourses,
}: CourseListClientProps) {
  return (
    <Suspense fallback={null}>
      <CategoryNav />
      <CourseListContent initialCourses={initialCourses} />
    </Suspense>
  );
}
