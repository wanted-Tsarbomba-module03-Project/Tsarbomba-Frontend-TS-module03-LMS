// 강좌 등록/수정 폼 전용 타입 (도메인 타입은 ../types 참조)
export type { CourseCategory } from "../types";
import type { LectureMaterial } from "../materialActions";

/* 문제 카테고리 (우측 패널 드롭다운) */
export interface ProblemCategory {
  categoryId: string | number;
  categoryName: string;
}

/* 문제 세트 요약 (우측 패널 목록) */
export interface ProblemSetSummary {
  problemSetId: number;
  title: string;
}

/* 강의 목록 아이템 — 영상 타입 */
export interface VideoLecture {
  id: string;
  lectureId?: number;
  type: "video";
  title: string;
  videoUrl: string;
  description: string;
  files: File[];
  /** 이미 업로드된 기존 첨부(수정 화면에서 표시/삭제용). 신규 강의는 없음 */
  existingMaterials?: LectureMaterial[];
  lectureOrder?: number;
}

/* 강의 목록 아이템 — 문제 타입 */
export interface ProblemLecture {
  id: string;
  lectureId?: number;
  type: "problem";
  problemSetId: number | null;
  problemTitle?: string;
  dropdownOpen: boolean;
  lectureOrder?: number;
}

/* 강의 목록 아이템 (영상 | 문제) */
export type LectureItem = VideoLecture | ProblemLecture;
