"use client";

// 문제풀이 코어(문제집 상태·소문제 이동·코드·실행/제출·힌트·해설) 로직.
// UserProblemDetailClient 의 강결합 상태를 응집도 있게 캡슐화한다.
// chat/모바일 사이드바 순환결합은 resetChat/closeMobileSidebar 콜백 주입으로 끊는다.
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { handleClientError } from "@/lib/errorHandling";

import {
  getProblemDatasetDownloadUrl,
  getProblemHints,
  getProblemSetDetailWithProgress,
  getProblemSetProgress,
  getProblemSetResult,
  runProblem,
  submitProblem,
  viewProblemExplanation,
} from "../actions";
import type {
  ExecutionResult,
  ProblemHint,
  ProblemResultTab,
  ProblemSetDetail,
  ProblemSetResult,
  ProblemStatus,
  SubmissionResult,
} from "../types";

const updateArrayItem = <T,>(items: T[], index: number, value: T) =>
  items.map((item, itemIndex) => (itemIndex === index ? value : item));

const isExplanationViewedStatus = (status?: ProblemStatus) =>
  status === "EXPLANATION_VIEWED";

const isCorrectLikeStatus = (status?: ProblemStatus) =>
  status === "CORRECT" || isExplanationViewedStatus(status);

// 서버 진행상태 문자열을 알려진 ProblemStatus 로만 안전하게 변환 (미확인 값은 무시).
const KNOWN_PROBLEM_STATUSES = new Set<ProblemStatus>([
  "LOCKED",
  "UNSOLVED",
  "CORRECT",
  "WRONG",
  "EXPLANATION_VIEWED",
]);
const toKnownProblemStatus = (status?: string | null): ProblemStatus | null => {
  if (!status) return null;
  // BE 가 ANSWER_VIEWED 로 줄 수 있어 EXPLANATION_VIEWED 로 정규화
  const normalized = status === "ANSWER_VIEWED" ? "EXPLANATION_VIEWED" : status;
  return KNOWN_PROBLEM_STATUSES.has(normalized as ProblemStatus)
    ? (normalized as ProblemStatus)
    : null;
};

function normalizeId(value?: number | string | null) {
  return value == null ? "" : String(value);
}

function getInitialProblemIndex(
  problemSet: ProblemSetDetail,
  targetProblemId = "",
) {
  if (targetProblemId) {
    const targetProblemIndex = problemSet.problems.findIndex(
      (problem) => normalizeId(problem.problemId) === targetProblemId,
    );

    if (targetProblemIndex >= 0) {
      return targetProblemIndex;
    }
  }

  return Math.max(
    problemSet.problems.findIndex((problem) =>
      problemSet.currentProblemId
        ? problem.problemId === problemSet.currentProblemId
        : problem.problemNumber === problemSet.currentProblemNumber,
    ),
    0,
  );
}

function getCorrectSubmissionMap(problemSetResult: ProblemSetResult | null) {
  return new Map(
    (problemSetResult?.submissions ?? [])
      .filter((submission) => submission.isCorrect)
      .map((submission) => [submission.problemId, submission]),
  );
}

function getInitialProblemCode(
  problem: ProblemSetDetail["problems"][number] | undefined,
  correctSubmissionMap: Map<number, ProblemSetResult["submissions"][number]>,
) {
  if (!problem) {
    return "";
  }

  return (
    problem.submittedCode ??
    problem.latestSubmission?.submittedCode ??
    correctSubmissionMap.get(problem.problemId)?.submittedAnswer ??
    problem.startCode ??
    ""
  );
}

function getInitialProblemState(
  problemSet: ProblemSetDetail,
  problemSetResult: ProblemSetResult | null,
  targetProblemId = "",
) {
  const initialIndex = getInitialProblemIndex(problemSet, targetProblemId);
  const correctSubmissionMap = getCorrectSubmissionMap(problemSetResult);
  const submissionResults = problemSet.problems.map((problem) => {
    if (problem.latestSubmission) {
      return {
        isCorrect: problem.latestSubmission.isCorrect,
        passedTestCount: problem.latestSubmission.passedTestCount,
        totalTestCount: problem.latestSubmission.totalTestCount,
        executionStatus: problem.latestSubmission.executionStatus,
        errorMessage: problem.latestSubmission.errorMessage ?? undefined,
        explanation: problem.explanation,
        submittedAt: problem.latestSubmission.submittedAt,
      } satisfies SubmissionResult;
    }

    const submission = correctSubmissionMap.get(problem.problemId);

    if (!submission) {
      return null;
    }

    return {
      isCorrect: submission.isCorrect,
      explanation: submission.explanation ?? problem.explanation,
      submittedAt: submission.submittedAt,
    } satisfies SubmissionResult;
  });

  return {
    currentIndex: initialIndex,
    problemStates: problemSet.problems.map((problem) =>
      problem.latestSubmission?.isCorrect ||
      correctSubmissionMap.has(problem.problemId)
        ? "CORRECT"
        : (problem.status ?? "UNSOLVED"),
    ),
    hintEnabled: problemSet.problems.map(
      (problem) =>
        correctSubmissionMap.has(problem.problemId) ||
        problem.status === "WRONG" ||
        isCorrectLikeStatus(problem.status),
    ),
    solutionEnabled: problemSet.problems.map(
      (problem) =>
        correctSubmissionMap.has(problem.problemId) ||
        isCorrectLikeStatus(problem.status),
    ),
    hints: problemSet.problems.map(() => [] as ProblemHint[]),
    userCodes: problemSet.problems.map((problem) =>
      getInitialProblemCode(problem, correctSubmissionMap),
    ),
    submissionResults,
    code: getInitialProblemCode(
      problemSet.problems[initialIndex],
      correctSubmissionMap,
    ),
  };
}

function getInitialLoadedExplanationIds(
  problemSet: ProblemSetDetail,
  submissionResults: Array<SubmissionResult | null>,
) {
  return new Set(
    problemSet.problems
      .filter(
        (problem, index) =>
          Boolean(problem.explanation) ||
          Boolean(submissionResults[index]?.explanation),
      )
      .map((problem) => problem.problemId),
  );
}

interface UseProblemWorkspaceParams {
  problemSetId: string;
  initialProblemSet: ProblemSetDetail;
  initialProblemSetResult: ProblemSetResult | null;
  initialUserId: string;
  /** 소문제 이동 시 채팅 초기화 (chat 훅의 resetChatState) */
  resetChat: () => void;
  /** 소문제 이동 시 모바일 사이드바 닫기 */
  closeMobileSidebar: () => void;
  /** 오류 표시 (공용 alert modal 등) */
  showError: (title: string, content: string) => void;
}

export function useProblemWorkspace({
  problemSetId,
  initialProblemSet,
  initialProblemSetResult,
  initialUserId,
  resetChat,
  closeMobileSidebar,
  showError,
}: UseProblemWorkspaceParams) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetProblemId = normalizeId(searchParams.get("problemId"));
  const initialState = useMemo(
    () =>
      getInitialProblemState(
        initialProblemSet,
        initialProblemSetResult,
        targetProblemId,
      ),
    [initialProblemSet, initialProblemSetResult, targetProblemId],
  );

  const [problemSet, setProblemSet] =
    useState<ProblemSetDetail>(initialProblemSet);
  const [currentIndex, setCurrentIndex] = useState(initialState.currentIndex);
  const [code, setCode] = useState(initialState.code);
  const [userCodes, setUserCodes] = useState<string[]>(initialState.userCodes);
  const [problemStates, setProblemStates] = useState<ProblemStatus[]>(
    initialState.problemStates,
  );
  const [hintEnabled, setHintEnabled] = useState<boolean[]>(
    initialState.hintEnabled,
  );
  const [solutionEnabled, setSolutionEnabled] = useState<boolean[]>(
    initialState.solutionEnabled,
  );
  const [hints, setHints] = useState<ProblemHint[][]>(initialState.hints);
  const [activeTab, setActiveTab] = useState<ProblemResultTab>("result");
  const [executionResult, setExecutionResult] =
    useState<ExecutionResult | null>(null);
  const [submissionResults, setSubmissionResults] = useState<
    Array<SubmissionResult | null>
  >(initialState.submissionResults);
  const [submissionResult, setSubmissionResult] =
    useState<SubmissionResult | null>(
      initialState.submissionResults[initialState.currentIndex],
    );
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDatasetDownloading, setIsDatasetDownloading] = useState(false);
  const [showHintToast, setShowHintToast] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [problemCompleteModalOpen, setProblemCompleteModalOpen] =
    useState(false);
  const [emptySubmitModalOpen, setEmptySubmitModalOpen] = useState(false);
  const [explanationViewConfirmOpen, setExplanationViewConfirmOpen] =
    useState(false);
  const [isViewingExplanation, setIsViewingExplanation] = useState(false);
  const [loadedExplanationProblemIds, setLoadedExplanationProblemIds] =
    useState<Set<number>>(() =>
      getInitialLoadedExplanationIds(
        initialProblemSet,
        initialState.submissionResults,
      ),
    );
  const appliedTargetProblemIdRef = useRef(targetProblemId);

  const userId = useMemo(() => {
    if (typeof window === "undefined") {
      return searchParams.get("userId") ?? "";
    }

    return searchParams.get("userId") ?? localStorage.getItem("userId") ?? "";
  }, [searchParams]);

  // 재진입 시 SSR 스냅샷/캐시가 stale 하면 해설 열람·정답으로 잠금 해제됐던 소문제가 다시
  // LOCKED 로 보이는 문제(배포 전용) → 마운트 직후 진행상태를 재조회해 LOCKED 인 소문제만 해제한다.
  useEffect(() => {
    // 다른 사용자 조회(관리자)는 아래 fetchProblemSet 이 전체 재조회하므로 중복 실행 방지
    if (userId && userId !== initialUserId) {
      return;
    }

    let cancelled = false;
    const syncLockStatus = async () => {
      try {
        const progress = await getProblemSetProgress(problemSetId, userId, {
          cache: "no-store",
        });
        if (cancelled || !progress?.problems?.length) return;

        const statusById = new Map<number, ProblemStatus>();
        progress.problems.forEach((p) => {
          if (p.problemId == null) return;
          const status = toKnownProblemStatus(p.status);
          if (status) statusById.set(p.problemId, status);
        });
        const freshOf = (index: number) => {
          const problemId = initialProblemSet.problems[index]?.problemId;
          return problemId != null ? statusById.get(problemId) : undefined;
        };

        // 잠긴(LOCKED) 소문제만 서버 최신값으로 해제한다. 그 외 로컬 상태(정답/오답/해설열람,
        // 동기화 요청 도중 LOCKED→UNSOLVED 로 바뀐 다음 문제 등)는 stale 응답이 덮어쓰지 않게 보존.
        setProblemStates((prev) =>
          prev.map((state, index) => {
            if (state !== "LOCKED") return state;
            const fresh = freshOf(index);
            return fresh && fresh !== "LOCKED" ? fresh : state;
          }),
        );
        setHintEnabled((prev) =>
          prev.map((enabled, index) => {
            const fresh = freshOf(index);
            if (!fresh) return enabled;
            return enabled || fresh === "WRONG" || isCorrectLikeStatus(fresh);
          }),
        );
        setSolutionEnabled((prev) =>
          prev.map((enabled, index) => {
            const fresh = freshOf(index);
            if (!fresh) return enabled;
            return enabled || isCorrectLikeStatus(fresh);
          }),
        );
      } catch {
        /* 재조회 실패 시 SSR 초기 상태 유지 */
      }
    };
    void syncLockStatus();
    return () => {
      cancelled = true;
    };
  }, [problemSetId, userId, initialUserId, initialProblemSet]);

  const currentProblem = problemSet.problems[currentIndex];
  const currentHints = hints[currentIndex] ?? [];
  const isCurrentProblemCorrect = isCorrectLikeStatus(
    problemStates[currentIndex],
  );

  useEffect(() => {
    let isMounted = true;

    const fetchProblemSet = async () => {
      try {
        if (!userId || userId === initialUserId) {
          return;
        }

        const [data, result] = await Promise.all([
          getProblemSetDetailWithProgress(problemSetId, userId, {
            cache: "no-store",
          }),
          getProblemSetResult(problemSetId, { cache: "no-store" }).catch(
            () => null,
          ),
        ]);
        const nextState = getInitialProblemState(data, result, targetProblemId);

        if (!isMounted) {
          return;
        }

        setProblemSet(data);
        setCurrentIndex(nextState.currentIndex);
        setProblemStates(nextState.problemStates);
        setHintEnabled(nextState.hintEnabled);
        setSolutionEnabled(nextState.solutionEnabled);
        setHints(nextState.hints);
        setUserCodes(nextState.userCodes);
        setSubmissionResults(nextState.submissionResults);
        setSubmissionResult(nextState.submissionResults[nextState.currentIndex]);
        setCode(nextState.code);
        setLoadedExplanationProblemIds(
          getInitialLoadedExplanationIds(data, nextState.submissionResults),
        );
      } catch (error) {
        if (!isMounted) {
          return;
        }

        handleClientError(error, {
          router,
          fallbackTitle: "문제 조회 실패",
          fallbackMessage: "문제 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
          showModal: showError,
        });
      }
    };

    fetchProblemSet();

    return () => {
      isMounted = false;
    };
  }, [initialUserId, problemSetId, router, targetProblemId, userId, showError]);

  useEffect(() => {
    if (appliedTargetProblemIdRef.current === targetProblemId) {
      return;
    }

    appliedTargetProblemIdRef.current = targetProblemId;

    if (!targetProblemId) {
      return;
    }

    const nextIndex = problemSet.problems.findIndex(
      (problem) => normalizeId(problem.problemId) === targetProblemId,
    );

    if (nextIndex < 0 || nextIndex === currentIndex) {
      return;
    }

    const nextCodes = updateArrayItem(userCodes, currentIndex, code);

    const syncTimer = window.setTimeout(() => {
      setUserCodes(nextCodes);
      setCurrentIndex(nextIndex);
      setCode(nextCodes[nextIndex] ?? "");
      setSubmissionResult(submissionResults[nextIndex] ?? null);
      setActiveTab("result");
      setExecutionResult(null);
      resetChat();
    }, 0);

    return () => window.clearTimeout(syncTimer);
  }, [
    code,
    currentIndex,
    problemSet.problems,
    resetChat,
    submissionResults,
    targetProblemId,
    userCodes,
  ]);

  const canMoveProblem = (index: number) => problemStates[index] !== "LOCKED";

  const getProblemButtonClass = (
    state: ProblemStatus | undefined,
    isCurrent: boolean,
  ) => {
    if (isCurrent) {
      return "bg-[#1a237e] text-white";
    }

    if (isCorrectLikeStatus(state)) {
      return "border border-[#1a237e] text-[#1a237e] bg-white";
    }

    if (state === "WRONG") {
      return "border border-[#fb2c36] text-[#fb2c36] bg-white";
    }

    return "border border-[#e8e8e8] text-[#1f2937] bg-white hover:bg-[#f3f4f6]";
  };

  const moveProblem = (index: number) => {
    if (!canMoveProblem(index)) {
      return;
    }

    const nextCodes = updateArrayItem(userCodes, currentIndex, code);

    setUserCodes(nextCodes);
    setCurrentIndex(index);
    setCode(nextCodes[index] ?? "");
    setActiveTab("result");
    setExecutionResult(null);
    setSubmissionResult(submissionResults[index] ?? null);
    resetChat();
    closeMobileSidebar();
  };

  const handleCodeChange = (nextCode: string) => {
    setCode(nextCode);
    setUserCodes((prev) => updateArrayItem(prev, currentIndex, nextCode));
  };

  const fetchHints = async (problemId: number, index: number) => {
    try {
      const hintList = await getProblemHints(problemId);
      setHints((prev) => updateArrayItem(prev, index, hintList));
      return hintList;
    } catch (error) {
      handleClientError(error, {
        router,
        fallbackTitle: "힌트 조회 실패",
        fallbackMessage: "힌트를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
        showModal: showError,
      });
      return [];
    }
  };

  const handleTabChange = (tab: ProblemResultTab) => {
    if (
      tab === "solution" &&
      isCorrectLikeStatus(problemStates[currentIndex])
    ) {
      if (
        currentProblem?.problemId &&
        loadedExplanationProblemIds.has(currentProblem.problemId)
      ) {
        setActiveTab("solution");
        return;
      }

      void handleExplanationViewConfirm();
      return;
    }

    if (tab === "solution" && !solutionEnabled[currentIndex]) {
      setExplanationViewConfirmOpen(true);
      return;
    }

    setActiveTab(tab);

    if (
      tab === "hint" &&
      currentProblem?.problemId &&
      !hints[currentIndex]?.length
    ) {
      void fetchHints(currentProblem.problemId, currentIndex);
    }
  };

  const handleExplanationViewConfirm = async () => {
    if (!currentProblem?.problemId || isViewingExplanation) {
      return;
    }

    setIsViewingExplanation(true);

    try {
      const result = await viewProblemExplanation(currentProblem.problemId);

      if (!result) {
        return;
      }

      setLoadedExplanationProblemIds((prev) => {
        const next = new Set(prev);
        next.add(result.problemId);
        return next;
      });

      const currentProblemState = problemStates[currentIndex];
      const nextCurrentProblemState =
        currentProblemState === "CORRECT" ? "CORRECT" : "EXPLANATION_VIEWED";
      const nextProblemStates = problemStates.map((state, index) => {
        const problemId = problemSet.problems[index]?.problemId;

        if (index === currentIndex) {
          return nextCurrentProblemState;
        }

        if (
          result.nextProblemId &&
          problemId === result.nextProblemId &&
          state === "LOCKED"
        ) {
          return "UNSOLVED";
        }

        return state;
      });

      setProblemStates(nextProblemStates);
      setProblemSet((prev) => ({
        ...prev,
        isCompleted: result.problemSetCompleted ?? prev.isCompleted,
        problems: prev.problems.map((problem) =>
          problem.problemId === result.problemId
            ? {
                ...problem,
                explanation: result.explanation ?? problem.explanation,
                status: nextCurrentProblemState,
              }
            : problem,
        ),
      }));
      setExecutionResult(null);
      setSubmissionResult({
        isCorrect: true,
        explanation: result.explanation ?? currentProblem.explanation,
        nextProblemId: result.nextProblemId ?? undefined,
      });
      setSubmissionResults((prev) =>
        updateArrayItem(prev, currentIndex, {
          isCorrect: true,
          explanation: result.explanation ?? currentProblem.explanation,
          nextProblemId: result.nextProblemId ?? undefined,
        }),
      );
      setHintEnabled((prev) => updateArrayItem(prev, currentIndex, true));
      setSolutionEnabled((prev) => updateArrayItem(prev, currentIndex, true));

      // 해설 열람으로 다음 소문제가 잠금 해제된 상태를 서버가 persist 했으므로,
      // 클라이언트 Router Cache(soft navigation 캐시)를 무효화해 재진입 시 stale 상태
      // (사이드바 비활성)로 되돌아가지 않게 한다. 배포 환경에서만 재현되던 문제.
      // 힌트 조회(fetchHints) 완료 여부와 무관하게 성공 직후 호출해 캐시 갱신 지연을 방지.
      router.refresh();

      if (!hints[currentIndex]?.length) {
        await fetchHints(currentProblem.problemId, currentIndex);
      }

      setExplanationViewConfirmOpen(false);
      setActiveTab("solution");
    } catch (error) {
      handleClientError(error, {
        router,
        fallbackTitle: "해설 조회 실패",
        fallbackMessage: "해설을 조회하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        showModal: showError,
      });
    } finally {
      setIsViewingExplanation(false);
    }
  };

  const handleRun = async () => {
    if (!currentProblem?.problemId || isRunning) {
      return;
    }

    if (!code.trim()) {
      setEmptySubmitModalOpen(true);
      return;
    }

    setIsRunning(true);

    try {
      const result = await runProblem(currentProblem.problemId, userId, code);
      setSubmissionResult(null);
      setExecutionResult(result);
      setActiveTab("result");
    } catch (error) {
      handleClientError(error, {
        router,
        fallbackTitle: "코드 실행 실패",
        fallbackMessage: "코드를 실행하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        showModal: showError,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentProblem?.problemId || isSubmitting || isCurrentProblemCorrect) {
      return;
    }

    if (!code.trim()) {
      setEmptySubmitModalOpen(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitProblem(currentProblem.problemId, userId, code);

      setExecutionResult(null);
      setSubmissionResult(result);
      setSubmissionResults((prev) => updateArrayItem(prev, currentIndex, result));
      setActiveTab("result");

      if (result.isCorrect) {
        const nextProblemStates = problemStates.map((state, index) => {
          const problemId = problemSet?.problems[index]?.problemId;

          if (index === currentIndex) {
            return "CORRECT";
          }

          if (
            result.nextProblemId &&
            problemId === result.nextProblemId &&
            state === "LOCKED"
          ) {
            return "UNSOLVED";
          }

          return state;
        });
        setProblemStates(nextProblemStates);
        setHintEnabled((prev) => updateArrayItem(prev, currentIndex, true));
        setSolutionEnabled((prev) => updateArrayItem(prev, currentIndex, true));

        // 정답 처리로 다음 소문제가 잠금 해제됐으므로 재진입 stale 방지를 위해 Router Cache 무효화.
        // 힌트 조회(fetchHints) 완료 여부와 무관하게 성공 직후 호출한다.
        router.refresh();

        if (!hints[currentIndex]?.length) {
          await fetchHints(currentProblem.problemId, currentIndex);
        }

        const totalProblemCount =
          problemSet.totalProblemCount ?? problemSet.problems.length;
        const isLastProblem =
          currentIndex === problemSet.problems.length - 1 ||
          (currentProblem.problemNumber ?? currentIndex + 1) >= totalProblemCount;
        const isAllCorrect = nextProblemStates.every((state) =>
          isCorrectLikeStatus(state),
        );

        if (isLastProblem || isAllCorrect || problemSet.isCompleted) {
          setProblemCompleteModalOpen(true);
        } else {
          setSuccessModalOpen(true);
        }
      } else {
        setProblemStates((prev) => updateArrayItem(prev, currentIndex, "WRONG"));
        setHintEnabled((prev) => updateArrayItem(prev, currentIndex, true));

        if (!hints[currentIndex]?.length) {
          await fetchHints(currentProblem.problemId, currentIndex);
        }

        setShowHintToast(true);
        window.setTimeout(() => setShowHintToast(false), 2000);
      }
    } catch (error) {
      handleClientError(error, {
        router,
        fallbackTitle: "답안 제출 실패",
        fallbackMessage: "답안을 제출하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        showModal: showError,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDatasetDownload = async () => {
    if (isDatasetDownloading) {
      return;
    }

    setIsDatasetDownloading(true);

    try {
      const dataset = await getProblemDatasetDownloadUrl(problemSetId);

      if (!dataset?.downloadUrl) {
        showError("CSV 다운로드 실패", "다운로드할 데이터셋을 찾지 못했습니다.");
        return;
      }

      const parsedUrl = new URL(dataset.downloadUrl, window.location.origin);

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        showError("CSV 다운로드 실패", "유효하지 않은 다운로드 주소입니다.");
        return;
      }

      const link = document.createElement("a");
      link.href = parsedUrl.toString();
      link.download = dataset.fileName || "dataset.csv";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      handleClientError(error, {
        router,
        fallbackTitle: "CSV 다운로드 실패",
        fallbackMessage:
          "CSV 다운로드 URL을 발급받지 못했습니다. 잠시 후 다시 시도해 주세요.",
        showModal: showError,
      });
    } finally {
      setIsDatasetDownloading(false);
    }
  };

  return {
    problemSet,
    currentProblem,
    currentIndex,
    currentHints,
    isCurrentProblemCorrect,
    code,
    userCodes,
    problemStates,
    hintEnabled,
    solutionEnabled,
    hints,
    activeTab,
    executionResult,
    submissionResult,
    isRunning,
    isSubmitting,
    isViewingExplanation,
    isDatasetDownloading,
    showHintToast,
    successModalOpen,
    setSuccessModalOpen,
    problemCompleteModalOpen,
    emptySubmitModalOpen,
    setEmptySubmitModalOpen,
    explanationViewConfirmOpen,
    setExplanationViewConfirmOpen,
    canMoveProblem,
    getProblemButtonClass,
    moveProblem,
    handleCodeChange,
    handleTabChange,
    handleExplanationViewConfirm,
    handleRun,
    handleSubmit,
    handleDatasetDownload,
  };
}
