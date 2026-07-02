"use client";

import Image from "next/image";
import Link from "next/link";
import { optimizedImageProps } from "@/components/common/imageOptimization";
import { resolveThumbnailUrl } from "@/features/course/http";
import type { Course } from "@/features/course/types";

interface CourseItemProps {
  course: Course;
}

function CourseItem({ course }: CourseItemProps) {
  const { courseId, title, courseCategoryName, thumbnailUrl, description } =
    course;
  const resolvedThumbnailUrl = resolveThumbnailUrl(thumbnailUrl);

  return (
    <Link
      className="border border-[#e8e8e8] rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition cursor-pointer"
      href={`/courses/${courseId}`}
    >
      {/* 강좌 썸네일 */}
      <div className="relative h-48 w-full bg-bg-navbar">
        <Image
          src={resolvedThumbnailUrl || "/assets/img/bluebomb-Icon.svg"}
        alt={title || "강좌 이미지"}
          className="object-cover"
          fill
          sizes="(max-width: 768px) 100vw, 320px"
          {...optimizedImageProps}
        />
      </div>

      <div className="p-4">
        {/* 카테고리 태그 */}
        <span className="text-xs font-semibold text-[#1a237e] bg-[#e8e8e8] px-2 py-1 rounded">
          {courseCategoryName || "미지정"}
        </span>

        {/* 강좌 제목 */}
        <h3 className="text-lg font-bold text-[#1F2937] mt-2 line-clamp-1">
          {title}
        </h3>

        {/* 강좌 설명 */}
        <p className="text-sm text-[#6B7280] mt-1 line-clamp-2">
          {description || "등록된 강좌 설명이 없습니다."}
        </p>
      </div>
    </Link>
  );
}

export default CourseItem;
