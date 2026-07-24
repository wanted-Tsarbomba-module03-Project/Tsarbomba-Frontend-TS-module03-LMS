export const PROBLEM_LIST_COLUMN_LABELS = [
  "No.",
  "문제명",
  "문제 설명",
  "난이도",
  "정답률",
  "풀이 여부",
] as const;

export const ADMIN_PROBLEM_LIST_COLUMN_LABELS = [
  "No.",
  "문제명",
  "문제 설명",
  "난이도",
  "정답률",
  "등록일",
] as const;

// 문제 목록 컬럼 가로 비율 (실제 목록과 스켈레톤이 동일하게 사용) - No./문제명/문제 설명/난이도/정답률/풀이 여부(등록일)
export const PROBLEM_LIST_COLUMN_WIDTHS = [
  "8%",
  "20%",
  "32%",
  "13%",
  "11%",
  "16%",
] as const;

export const PROBLEM_SET_PAGE_SIZE = 20;

export const PROBLEM_COMPLETION_STATUS_LABELS = {
  NOT_STARTED: "미풀이",
  IN_PROGRESS: "풀이중",
  COMPLETED: "풀이 완료",
} as const;

export const PROBLEM_SET_SORT_LABELS = {
  DEFAULT: "기본순",
  POPULAR: "인기순",
} as const;

export const SORT_DIRECTION_LABELS = {
  ASC: "오름차순",
  DESC: "내림차순",
} as const;
