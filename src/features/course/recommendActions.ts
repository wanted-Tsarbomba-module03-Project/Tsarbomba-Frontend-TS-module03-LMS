import type { ProblemSetSummary } from "@/features/problems/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

/** 추천 사유 분류 코드 (모달 배지 등 선택 표시용) */
export type RecommendationReasonCode =
  | "COURSE_RELATED" // 강좌·강의 내용과 연관된 문제
  | "REVIEW_WEAK_AREA" // 해설 의존 또는 부족한 숙련도 보강
  | "LEVEL_MATCHED" // 현재 학습 수준에 적합
  | "NEXT_DIFFICULTY"; // 한 단계 높은 난이도 도전

/**
 * FINAL 추천 문제세트 후보 — 기존 문제세트 응답에 AI 추천 필드가 추가된 형태.
 * score/reasonCode 는 화면 필수 아님. recommendationReason 은 모달에 표시(최대 300자).
 * Python/LLM 실패 시 기본 문구가 recommendationReason 으로 오고 score 는 null 일 수 있음.
 */
export interface FinalProblemSetCandidate extends ProblemSetSummary {
  entryPath?: string;
  score: number | null;
  reasonCode: RecommendationReasonCode;
  recommendationReason: string;
}

/** 추천 조회 결과 — 미완료(403)와 일반 실패를 UI가 구분할 수 있도록 상태로 반환 */
export type FinalProblemSetResult =
  | { status: "ok"; problemSets: FinalProblemSetCandidate[] }
  | { status: "notCompleted" } // 강의 미완료 / 마지막 강의 아님 (BE 403)
  | { status: "error" };

/**
 * FINAL 추천 문제세트 조회 — GET /api/v1/lectures/{lectureId}/final-problem-set-candidates
 *
 * 강의 완료 여부(이전+현재 강의 모두 수강)는 BE 가 검증한다.
 * 미완료이거나 마지막 강의가 아니면 BE 가 403 을 반환하므로, FE 는 이를 "notCompleted" 로 구분한다.
 */
export const getFinalProblemSetCandidates = async (
  lectureId: number | string,
): Promise<FinalProblemSetResult> => {
  try {
    const res = await fetch(
      `${BASE_URL}/api/v1/lectures/${lectureId}/final-problem-set-candidates`,
      { credentials: "include", headers: { Accept: "application/json" } },
    );

    if (res.status === 403) return { status: "notCompleted" };
    if (!res.ok) return { status: "error" };

    const json = await res.json().catch(() => null);
    // 응답이 배열이 아니면 빈 목록으로 — 모달의 .length/.map 런타임 오류 방지
    const data = Array.isArray(json?.data)
      ? (json.data as FinalProblemSetCandidate[])
      : [];
    return { status: "ok", problemSets: data };
  } catch {
    return { status: "error" };
  }
};
