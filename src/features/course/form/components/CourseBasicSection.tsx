"use client";

import React from "react";
import Image from "next/image";
import { optimizedImageProps } from "@/components/common/imageOptimization";
import type { CourseCategory } from "../types";

interface CourseBasicSectionProps {
  thumbnailPreview: string;
  onThumbnailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  title: string;
  onTitleChange: (value: string) => void;
  categoryId: string;
  onCategoryChange: (value: string) => void;
  categories: CourseCategory[];
  description: string;
  onDescriptionChange: (value: string) => void;
  thumbnailInputId?: string;
}

export default function CourseBasicSection({
  thumbnailPreview,
  onThumbnailChange,
  title,
  onTitleChange,
  categoryId,
  onCategoryChange,
  categories,
  description,
  onDescriptionChange,
  thumbnailInputId = "thumbnail-input",
}: CourseBasicSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-base font-medium text-gray-800 mb-1.5">
          강의 썸네일 이미지 *
        </label>
        <div
          className="w-full h-56 border border-gray-200 rounded-lg bg-gray-100 flex items-center justify-center cursor-pointer overflow-hidden hover:bg-gray-200 transition-colors relative"
          onClick={() => document.getElementById(thumbnailInputId)?.click()}
        >
          {thumbnailPreview ? (
            <Image
              src={thumbnailPreview}
              alt="썸네일 미리보기"
              className="w-full h-full object-cover"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              unoptimized
              {...optimizedImageProps}
            />
          ) : (
            <svg
              width="56"
              height="56"
              viewBox="0 0 56 56"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="4"
                y="10"
                width="48"
                height="36"
                rx="4"
                stroke="#C8C8C8"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M4 38l13-14 10 10 8-8 17 18"
                stroke="#C8C8C8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <circle cx="18" cy="24" r="4" fill="#C8C8C8" />
            </svg>
          )}
          <input
            id={thumbnailInputId}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onThumbnailChange}
          />
        </div>
      </div>

      <div>
        <label className="block text-base font-medium text-gray-800 mb-1.5">
          제목명 *
        </label>
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="강좌 제목을 적어주세요."
          className="w-full h-11 px-4 border border-gray-200 rounded-lg text-base text-gray-800 placeholder-gray-400 outline-none focus:border-blue-900 transition-colors"
        />
      </div>

      <div>
        <label className="block text-base font-medium text-gray-800 mb-1.5">
          카테고리 *
        </label>
        <select
          value={categoryId}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="w-full h-11 px-4 border border-gray-200 rounded-lg text-base text-gray-800 outline-none focus:border-blue-900 bg-white transition-colors cursor-pointer"
        >
          <option value="">카테고리 선택</option>
          {categories.map((c) => (
            <option key={c.courseCategoryId} value={c.courseCategoryId}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-base font-medium text-gray-800 mb-1.5">
          강의 상세내용 *
        </label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="강좌 내용을 적어주세요."
          rows={6}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg text-base text-gray-800 placeholder-gray-400 outline-none focus:border-blue-900 resize-none transition-colors"
        />
      </div>
    </div>
  );
}
