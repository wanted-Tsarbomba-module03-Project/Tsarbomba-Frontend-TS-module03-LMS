/* 강좌 목록 아이템 */
export interface Course {
  courseId: number;
  instructorId: number;
  courseCategoryId: number | null;
  courseCategoryName: string | null;
  title: string;
  description: string;
  thumbnailUrl: string;
  status: "ACTIVE" | "DRAFT" | "DELETED";
}

export type CourseStatusFilter = "all" | "open" | "hidden";

/* 강좌 상세 */
export interface CourseDetail {
  courseId: number;
  instructorId?: number;
  instructorName?: string | null;
  courseCategoryId: number | null;
  courseCategoryName: string | null;
  title: string;
  description: string;
  thumbnailUrl: string;
  status: string;
}

/* 강좌 카테고리 (드롭다운) */
export interface CourseCategory {
  courseCategoryId: number;
  name: string;
}

/* 강좌 생성·수정 요청 바디 */
export interface CourseUpsertBody {
  title: string;
  courseCategoryId: number;
  description: string;
  thumbnailUrl: string;
}

/* 강의 요약 (목록 / 상세 공용) */
export interface LectureSummary {
  lectureId: number;
  courseId?: number;
  title: string;
  description: string;
  lectureOrder: number;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
}

/* 강의 생성·수정 요청 바디 */
export interface LectureUpsertBody {
  title: string;
  description: string | null;
  videoUrl?: string | null;
  lectureOrder: number;
}

/* 내 수강 강좌 (enrollment 기준) */
export interface Enrollment {
  enrollmentId?: number;
  courseId?: number;
  courseTitle?: string | null;
  courseDescription?: string | null;
  courseThumbnailUrl?: string | null;
  courseCategoryName?: string | null;
  instructorName?: string | null;
  status?: string | null;
  enrolledAt?: string | null;
}

/* 수강생 학습 현황 (강사·OPERATOR 용) — 강의 수강률 + 문제 풀이 진도 */
export interface StudentLearningProgress {
  userId: number;
  studentName: string;
  completedLectureCount: number;
  totalLectureCount: number;
  lectureProgressRate: number;
  completedProblemCount: number;
  totalProblemCount: number;
}

/* 학습 현황 페이지네이션 응답 */
export interface StudentLearningProgressPage {
  content: StudentLearningProgress[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

/* 어드민 — 특정 수강생의 문제 풀이 현황 */
export interface StudentProblemItem {
  problemId: number;
  title: string;
  status: "UNSOLVED" | "CORRECT" | "WRONG";
}

export interface StudentProblemEntry {
  title?: string;
  problems: StudentProblemItem[];
}

/* 강좌 - 문제세트 연결 요청 (configure용) */
export interface ProblemSetConnection {
  problemSetId: number;
  lectureId: number | null;
  role: string;
  displayOrder: number;
}

/* 강좌에 연결된 문제세트 (조회 응답) */
export interface CourseProblemSetLink {
  // 신 응답(lecture-problem-sets)은 lectureProblemSetId 를 줌. courseProblemSetId 는 구 모델 호환용.
  lectureProblemSetId?: number;
  courseProblemSetId?: number;
  courseId: number;
  lectureId: number;
  problemSetId: number;
  role: string;
  displayOrder: number;
}
