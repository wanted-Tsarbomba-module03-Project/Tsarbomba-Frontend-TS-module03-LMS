import { ApiClientError, type BackendErrorPayload } from "@/lib/errorHandling";
import type {
  ProblemSetDetail,
  ProblemSetDetailProblem,
  ProblemStatus,
  SubmissionResult,
} from "@/features/problems/types";

// 빈값이어도 상대경로(/api/...)로 호출되어 next.config rewrites 가 가로채도록 throw 대신 "" 폴백
// 서버 컴포넌트에서도 호출되므로 API_PROXY_TARGET 우선 (없으면 NEXT_PUBLIC_API_URL, 그래도 없으면 상대경로).
// 빈값이면 서버 런타임에서 상대경로 fetch 가 "Failed to parse URL" 로 실패하므로 서버 전용 절대주소 폴백 필요.
const API_BASE_URL =
  process.env.API_PROXY_TARGET ?? process.env.NEXT_PUBLIC_API_URL ?? "";

interface ApiResponse<T> {
  data?: T;
}

type NextRequestInit = RequestInit & {
  next?: { revalidate?: number };
};

async function requestJson<T>(
  path: string,
  fallbackMessage: string,
  init: NextRequestInit = {},
): Promise<ApiResponse<T>> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(init.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...init.headers,
      },
    });
  } catch (error) {
    throw new ApiClientError(
      {
        message:
          error instanceof Error
            ? error.message
            : "서버와 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        path,
      },
      fallbackMessage,
    );
  }

  const text = await response.text();

  if (!response.ok) {
    throw createApiError(response, text, path, fallbackMessage);
  }

  if (!text) {
    return { data: undefined as T };
  }

  return JSON.parse(text) as ApiResponse<T>;
}

function createApiError(
  response: Response,
  text: string,
  requestPath: string,
  fallbackMessage: string,
) {
  if (!text) {
    return new ApiClientError(
      { status: response.status, message: fallbackMessage, path: requestPath },
      fallbackMessage,
    );
  }
  try {
    const payload = JSON.parse(text) as BackendErrorPayload;
    return new ApiClientError(
      {
        ...payload,
        status: payload.status ?? response.status,
        path: payload.path ?? requestPath,
      },
      fallbackMessage,
    );
  } catch {
    return new ApiClientError(
      {
        status: response.status,
        message: text || fallbackMessage,
        path: requestPath,
      },
      fallbackMessage,
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────────
// 진행 상태 (전체 문제 수 / 현재 문제 번호 / 완료 수 / 문제별 상태)
// ────────────────────────────────────────────────────────────────────────────────

interface LectureProblemProgress {
  totalCount?: number;
  currentProblemNumber?: number;
  currentProblemId?: number;
  solvedCount?: number;
  // BE lecture_problem_progress.is_completed — 완료 권위 플래그 (네이밍 대비 둘 다 수용)
  completed?: boolean;
  isCompleted?: boolean;
  problems?: Array<{
    problemId?: number;
    problemNumber?: number;
    status?: ProblemStatus;
  }>;
}

// ────────────────────────────────────────────────────────────────────────────────
// 강의 문제세트 입장 — GET /api/v1/lecture-problem-sets/{lectureProblemSetId}
// ────────────────────────────────────────────────────────────────────────────────

export async function getLectureProblemSet(
  lectureProblemSetId: string,
  init: NextRequestInit = {},
): Promise<ProblemSetDetail> {
  const enterRes = await requestJson<unknown>(
    `/api/v1/lecture-problem-sets/${lectureProblemSetId}`,
    "문제 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    init,
  );

  const progressRes = await requestJson<LectureProblemProgress>(
    `/api/v1/lecture-problem-sets/${lectureProblemSetId}/progress`,
    "진행 상태를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    init,
  ).catch(() => ({ data: undefined }) as ApiResponse<LectureProblemProgress>);

  return normalizeLectureProblemSet(
    lectureProblemSetId,
    enterRes,
    progressRes.data,
  );
}

// 진행 상태 단독 조회
export async function getLectureProblemProgress(
  lectureProblemSetId: string,
  init: NextRequestInit = {},
): Promise<LectureProblemProgress> {
  const result = await requestJson<LectureProblemProgress>(
    `/api/v1/lecture-problem-sets/${lectureProblemSetId}/progress`,
    "진행 상태를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    init,
  );
  return result.data ?? {};
}

// 강의 문제 제출 — POST /api/v1/lecture-problem-sets/{lectureProblemSetId}/problems/{problemId}/submissions
export async function submitLectureProblem(
  lectureProblemSetId: string,
  problemId: number,
  code: string,
): Promise<SubmissionResult> {
  const result = await requestJson<SubmissionResult>(
    `/api/v1/lecture-problem-sets/${lectureProblemSetId}/problems/${problemId}/submissions`,
    "답안을 제출하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    {
      method: "POST",
      body: JSON.stringify({ code }),
    },
  );
  return result.data ?? {};
}

// ────────────────────────────────────────────────────────────────────────────────
// 정규화 — 입장 응답 + 진행 상태 → ProblemSetDetail
// ────────────────────────────────────────────────────────────────────────────────

function normalizeLectureProblemSet(
  lectureProblemSetId: string,
  response: unknown,
  progress?: LectureProblemProgress,
): ProblemSetDetail {
  const payload = response as
    | { data?: Record<string, unknown> }
    | Record<string, unknown>;
  const data =
    payload && "data" in payload && payload.data ? payload.data : payload;
  const rawData = (data ?? {}) as {
    id?: number;
    problemSetId?: number;
    lectureProblemSetId?: number;
    title?: string;
    currentProblemId?: number;
    currentProblemNumber?: number;
    problem?: ProblemSetDetailProblem;
    problems?: ProblemSetDetailProblem[];
  };

  const problemList = Array.isArray(rawData.problems)
    ? rawData.problems
    : rawData.problem
      ? [rawData.problem]
      : [];

  // 진행 상태의 problemId → status 매핑
  const statusByProblemId = new Map<number, ProblemStatus>();
  progress?.problems?.forEach((p) => {
    if (p.problemId != null && p.status) {
      statusByProblemId.set(p.problemId, p.status);
    }
  });

  const problems = problemList.map((problem, index) => {
    const merged =
      rawData.problem?.problemId === problem.problemId
        ? { ...problem, ...rawData.problem }
        : problem;
    return {
      problemId: merged.problemId,
      problemNumber: merged.problemNumber ?? index + 1,
      title: merged.title ?? `문제 ${index + 1}`,
      content: merged.content ?? "",
      point: merged.point,
      startCode: merged.startCode ?? "",
      answer: merged.answer,
      explanation: merged.explanation ?? merged.solution,
      status: (statusByProblemId.get(merged.problemId) ??
        merged.status ??
        "UNSOLVED") as ProblemStatus,
    };
  });

  return {
    id: rawData.problemSetId ?? rawData.id ?? Number(lectureProblemSetId),
    problemSetId: rawData.problemSetId,
    title: rawData.title,
    currentProblemId: progress?.currentProblemId ?? rawData.currentProblemId,
    currentProblemNumber:
      progress?.currentProblemNumber ?? rawData.currentProblemNumber,
    problems,
  };
}
