import type { Course, CourseStatusFilter } from "./types";

export const ALL_COURSE_CATEGORY = "전체";
export const COURSE_SEARCH_PARAM = "keyword";

// 화면에서 숨길 카테고리 (BE 목록에 남아있어도 프론트에서 제외).
// SQL/시각화/파이썬 제거 → 데이터 분석·머신러닝·통계·빅데이터 4개만 노출.
const HIDDEN_CATEGORY_NAMES = new Set(["python", "파이썬", "sql", "시각화"]);

export function isVisibleCategory(name?: string | null): boolean {
  if (!name) return false;
  return !HIDDEN_CATEGORY_NAMES.has(name.trim().toLowerCase());
}

interface CourseFilterOptions {
  category?: string;
  keyword?: string;
  statusFilter?: CourseStatusFilter;
}

function normalizeKeyword(keyword?: string) {
  return keyword?.trim().toLowerCase() ?? "";
}

export function buildCourseSearchHref(
  searchParams: Pick<URLSearchParams, "toString">,
  keyword: string,
) {
  const params = new URLSearchParams(searchParams.toString());
  const nextKeyword = keyword.trim();

  if (nextKeyword) {
    params.set(COURSE_SEARCH_PARAM, nextKeyword);
  } else {
    params.delete(COURSE_SEARCH_PARAM);
  }

  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export function matchesCourseTitle(course: Course, keyword?: string) {
  const normalizedKeyword = normalizeKeyword(keyword);

  if (!normalizedKeyword) {
    return true;
  }

  return course.title.toLowerCase().includes(normalizedKeyword);
}

export function matchesCourseCategory(course: Course, category?: string) {
  return (
    !category ||
    category === ALL_COURSE_CATEGORY ||
    course.courseCategoryName === category
  );
}

export function matchesCourseStatus(
  course: Course,
  statusFilter: CourseStatusFilter = "all",
) {
  if (statusFilter === "open") {
    return course.status === "ACTIVE";
  }

  if (statusFilter === "hidden") {
    return course.status === "DRAFT" || course.status === "DELETED";
  }

  return true;
}

export function filterCourses(
  courses: Course[],
  { category, keyword, statusFilter = "all" }: CourseFilterOptions,
) {
  return courses.filter(
    (course) =>
      matchesCourseCategory(course, category) &&
      matchesCourseTitle(course, keyword) &&
      matchesCourseStatus(course, statusFilter),
  );
}
