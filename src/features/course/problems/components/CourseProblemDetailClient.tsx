"use client";

// 강좌 문제풀이 — 문제풀이 UI 재사용, 데이터만 lecture-problem-sets 전용 actions 로 처리.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import CategoryNav from "@/components/layout/CategoryNav";
import Sidebar from "@/components/layout/Sidebar";
import { OneButtonModal, TwoButtonModal, WarningModal } from "@/components/common";
import { createClientMessageId } from "@/features/chat/clientMessageId";
import { streamChat } from "@/features/chat/stream";
import { createChatTypewriter } from "@/features/chat/typewriter";
import { ApiClientError, handleClientError } from "@/lib/errorHandling";

// 강좌 전용: 입장/제출/해설조회 (해설조회는 LectureProgress 를 완료 처리하는 강의 전용 엔드포인트)
import {
  getLectureProblemProgress,
  getLectureProblemSet,
  submitLectureProblem,
  viewLectureProblemExplanation,
} from "../actions";
import { getCourseLectures } from "@/features/course/lectureActions";
import { getCourseProblemSets } from "@/features/course/problemSetActions";
// 공통 재사용: 실행/힌트/챗봇
import {
  getProblemDatasetDownloadUrl,
  getProblemChatMessages,
  getProblemHints,
  runProblem,
} from "@/features/problems/actions";
import type {
  ChatMessage,
  ExecutionResult,
  ProblemHint,
  ProblemResultTab,
  ProblemSetDetail,
  ProblemStatus,
  SubmissionResult,
} from "@/features/problems/types";
import ProblemChatPanel from "@/features/problems/components/ProblemChatPanel";
import ProblemCodeEditor from "@/features/problems/components/ProblemCodeEditor";
import ProblemResultPanel from "@/features/problems/components/ProblemResultPanel";
import { useProblemChatFeedback } from "@/features/problems/hooks/useProblemChatFeedback";
import { useProblemSuggestedQuestions } from "@/features/problems/hooks/useProblemSuggestedQuestions";
import { useResizableProblemPanel } from "@/features/problems/hooks/useResizableProblemPanel";

// 스타일은 문제풀이 화면과 동일하게 공유하되, 클라이언트 컴포넌트 의존 없이 스타일 파일만 참조함
import { problemDetailClasses as styles } from "@/features/problems/problemDetailStyles";

interface CourseProblemDetailClientProps {
  courseId: string;
  lectureProblemSetId: string;
  initialProblemSet: ProblemSetDetail;
}

const updateArrayItem = <T,>(items: T[], index: number, value: T) =>
  items.map((item, itemIndex) => (itemIndex === index ? value : item));

// 문제세트별 작성 중 답안 임시 저장 (localStorage). 정답 처리되면 클리어.
const draftKey = (lpsId: string) => `lps-draft-${lpsId}`;

const loadDrafts = (lpsId: string): Record<number, string> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(draftKey(lpsId));
    return raw ? (JSON.parse(raw) as Record<number, string>) : {};
  } catch {
    return {};
  }
};

const saveDrafts = (lpsId: string, drafts: Record<number, string>) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(draftKey(lpsId), JSON.stringify(drafts));
  } catch {
    /* quota 초과 등 무시 */
  }
};

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

const isExplanationViewedStatus = (status?: ProblemStatus) =>
  status === "EXPLANATION_VIEWED";

const isCorrectLikeStatus = (status?: ProblemStatus) =>
  status === "CORRECT" || isExplanationViewedStatus(status);

function getInitialProblemIndex(problemSet: ProblemSetDetail) {
  return Math.max(
    problemSet.problems.findIndex((problem) =>
      problemSet.currentProblemId
        ? problem.problemId === problemSet.currentProblemId
        : problem.problemNumber === problemSet.currentProblemNumber,
    ),
    0,
  );
}

function getInitialProblemState(problemSet: ProblemSetDetail, lpsId: string) {
  const initialIndex = getInitialProblemIndex(problemSet);
  const drafts = loadDrafts(lpsId);

  // 저장된 작성 중 답안이 있으면 startCode 대신 그것을 사용 (정답 처리되면 클리어됨).
  const codeFor = (problem: {
    problemId?: number;
    startCode?: string | null;
  }) => {
    const draft =
      problem.problemId != null ? drafts[problem.problemId] : undefined;
    return draft ?? problem.startCode ?? "";
  };

  return {
    currentIndex: initialIndex,
    problemStates: problemSet.problems.map(
      (problem) => problem.status ?? "UNSOLVED",
    ),
    hintEnabled: problemSet.problems.map(
      (problem) =>
        problem.status === "WRONG" || isCorrectLikeStatus(problem.status),
    ),
    solutionEnabled: problemSet.problems.map(
      (problem) => isCorrectLikeStatus(problem.status),
    ),
    hints: problemSet.problems.map(() => [] as ProblemHint[]),
    userCodes: problemSet.problems.map((problem) => codeFor(problem)),
    code: codeFor(problemSet.problems[initialIndex] ?? {}),
  };
}

function getInitialLoadedExplanationIds(problemSet: ProblemSetDetail) {
  return new Set(
    problemSet.problems
      .filter((problem) => Boolean(problem.explanation))
      .map((problem) => problem.problemId),
  );
}

export default function CourseProblemDetailClient({
  courseId,
  lectureProblemSetId,
  initialProblemSet,
}: CourseProblemDetailClientProps) {
  const router = useRouter();
  const activeChatRoomIdRef = useRef<number | null>(null);
  const chatStreamAbortRef = useRef<AbortController | null>(null);
  const initialState = useMemo(
    () => getInitialProblemState(initialProblemSet, lectureProblemSetId),
    [initialProblemSet, lectureProblemSetId],
  );

  // 좌우 패널 드래그 리사이즈 (문제풀이방과 동일)
  const {
    contentAreaRef,
    isPanelSplitAvailable,
    problemPanelStyle,
    handlePanelResizeStart,
  } = useResizableProblemPanel();

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
  const [submissionResult, setSubmissionResult] =
    useState<SubmissionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHintToast, setShowHintToast] = useState(false);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [emptySubmitModalOpen, setEmptySubmitModalOpen] = useState(false);
  const [explanationViewConfirmOpen, setExplanationViewConfirmOpen] =
    useState(false);
  const [isViewingExplanation, setIsViewingExplanation] = useState(false);
  const [loadedExplanationProblemIds, setLoadedExplanationProblemIds] =
    useState<Set<number>>(() =>
      getInitialLoadedExplanationIds(initialProblemSet),
    );
  // 마지막 문제까지 모두 정답 시 강의 완료 + 강좌 페이지 이동 안내.
  const [lectureCompleteModalOpen, setLectureCompleteModalOpen] =
    useState(false);
  const [alertModal, setAlertModal] = useState({
    open: false,
    title: "",
    content: "",
  });
  const [isDatasetDownloading, setIsDatasetDownloading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [chatRoomId, setChatRoomId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [feedbackPendingIds, setFeedbackPendingIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [showChatResponsePending, setShowChatResponsePending] = useState(false);

  // 이 문제 풀이가 속한 강의 + 다음 강의 정보 — 나가기/완료 시 정확한 lecture 페이지로 이동.
  const [currentLectureId, setCurrentLectureId] = useState<number | null>(null);
  const [nextLectureId, setNextLectureId] = useState<number | null>(null);

  useEffect(() => {
    activeChatRoomIdRef.current = chatRoomId;
  }, [chatRoomId]);

  useEffect(() => {
    return () => {
      chatStreamAbortRef.current?.abort();
    };
  }, []);

  // 재진입 시 stale 캐시로 잠금 해제됐던 소문제가 다시 LOCKED 로 보이는 문제(배포 전용) 대비 —
  // 마운트 직후 진행상태를 재조회해 LOCKED 인 소문제만 해제한다.
  useEffect(() => {
    let cancelled = false;
    const syncProgress = async () => {
      try {
        const progress = await getLectureProblemProgress(lectureProblemSetId, {
          cache: "no-store",
        });
        if (cancelled || !progress.problems?.length) return;

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

        // LOCKED 소문제만 서버 최신값으로 해제 — 나머지 로컬 상태는 stale 응답이 덮어쓰지 않게 유지.
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
    void syncProgress();
    return () => {
      cancelled = true;
    };
  }, [lectureProblemSetId, initialProblemSet]);

  useEffect(() => {
    const loadNavTargets = async () => {
      try {
        const [links, lectures] = await Promise.all([
          getCourseProblemSets(courseId),
          getCourseLectures(courseId),
        ]);
        const link = links.find(
          (l) => String(l.lectureProblemSetId) === String(lectureProblemSetId),
        );
        if (!link) return;
        setCurrentLectureId(link.lectureId);
        const idx = lectures.findIndex((l) => l.lectureId === link.lectureId);
        if (idx >= 0 && idx < lectures.length - 1) {
          setNextLectureId(lectures[idx + 1].lectureId);
        }
      } catch {
        /* 실패해도 fallback 라우팅 동작 */
      }
    };
    void loadNavTargets();
  }, [courseId, lectureProblemSetId]);

  // 나가기/완료 모달의 라우팅 — 알 수 있으면 lecture 페이지, 아니면 강좌 페이지로 fallback.
  const exitToLecturePath = currentLectureId
    ? `/courses/${courseId}/lectures/${currentLectureId}`
    : `/courses/${courseId}`;
  const nextLecturePath = nextLectureId
    ? `/courses/${courseId}/lectures/${nextLectureId}`
    : `/courses/${courseId}`;

  const currentProblem = problemSet.problems[currentIndex];
  const currentHints = hints[currentIndex] ?? [];
  const isCurrentProblemCorrect = isCorrectLikeStatus(
    problemStates[currentIndex],
  );

  const suggestedQuestions = useProblemSuggestedQuestions(
    problemSet.problemSetId ?? problemSet.id,
    currentProblem?.problemId,
  );

  // 데이터셋(CSV) 다운로드 — 문제세트 단위 (문제풀이방과 동일). 서버가 서명 URL 발급.
  const handleDatasetDownload = async () => {
    if (isDatasetDownloading) return;
    // 데이터셋은 문제세트 단위 — problemSetId 없으면 정규화된 id 사용 (lectureProblemSetId 로 fallback 금지).
    const datasetKey = String(problemSet.problemSetId ?? problemSet.id);
    setIsDatasetDownloading(true);
    try {
      const dataset = await getProblemDatasetDownloadUrl(datasetKey);
      if (!dataset?.downloadUrl) {
        setAlertModal({
          open: true,
          title: "CSV 다운로드 실패",
          content: "다운로드할 데이터셋을 찾지 못했습니다.",
        });
        return;
      }
      const parsedUrl = new URL(dataset.downloadUrl, window.location.origin);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        setAlertModal({
          open: true,
          title: "CSV 다운로드 실패",
          content: "유효하지 않은 다운로드 주소입니다.",
        });
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
        showModal: (title, content) =>
          setAlertModal({ open: true, title, content }),
      });
    } finally {
      setIsDatasetDownloading(false);
    }
  };

  const canMoveProblem = (index: number) => problemStates[index] !== "LOCKED";

  const getProblemButtonClass = (
    state: ProblemStatus | undefined,
    isCurrent: boolean,
  ) => {
    if (isCurrent) return "bg-[#1a237e] text-white";
    if (isCorrectLikeStatus(state))
      return "border border-[#1a237e] text-[#1a237e] bg-white";
    if (state === "WRONG")
      return "border border-[#fb2c36] text-[#fb2c36] bg-white";
    return "border border-[#e8e8e8] text-[#1f2937] bg-white hover:bg-[#f3f4f6]";
  };

  const resetChat = () => {
    chatStreamAbortRef.current?.abort();
    chatStreamAbortRef.current = null;
    setChatRoomId(null);
    setChatMessages([]);
    setChatInput("");
    setChatSending(false);
    setShowChatResponsePending(false);
  };

  const moveProblem = (index: number) => {
    if (!canMoveProblem(index)) return;

    const nextCodes = updateArrayItem(userCodes, currentIndex, code);
    setUserCodes(nextCodes);
    setCurrentIndex(index);
    setCode(nextCodes[index] ?? "");
    setActiveTab("result");
    setExecutionResult(null);
    setSubmissionResult(null);
    resetChat();
    setMobileSidebarOpen(false);
  };

  const handleCodeChange = (nextCode: string) => {
    setCode(nextCode);
    setUserCodes((prev) => updateArrayItem(prev, currentIndex, nextCode));
    // 작성 중 답안 localStorage 에 저장 — 페이지 이탈 후 재진입 시 복원.
    const problemId = currentProblem?.problemId;
    if (problemId != null) {
      const drafts = loadDrafts(lectureProblemSetId);
      drafts[problemId] = nextCode;
      saveDrafts(lectureProblemSetId, drafts);
    }
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
        fallbackMessage:
          "힌트를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
        showModal: (title, content) =>
          setAlertModal({ open: true, title, content }),
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

      void handleExplanationViewConfirm({ showCompletionModal: false });
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

  const handleExplanationViewConfirm = async ({
    showCompletionModal = true,
  }: { showCompletionModal?: boolean } = {}) => {
    if (!currentProblem?.problemId || isViewingExplanation) {
      return;
    }

    setIsViewingExplanation(true);

    try {
      const result = await viewLectureProblemExplanation(
        lectureProblemSetId,
        currentProblem.problemId,
      );

      if (!result) {
        return;
      }

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
      setHintEnabled((prev) => updateArrayItem(prev, currentIndex, true));
      setSolutionEnabled((prev) => updateArrayItem(prev, currentIndex, true));

      // 해설 텍스트가 응답에 비면 서버에서 재조회해 채운다 (진행도 처리와 분리 — 해설이 비어도 잠금 해제/완료는 반영됨).
      // router.refresh()로는 이 클라이언트 state 가 안 채워져 직접 재조회가 필요.
      let freshExplanation: string | undefined;
      if (!(result.explanation ?? currentProblem.explanation)) {
        try {
          const fresh = await getLectureProblemSet(lectureProblemSetId, {
            cache: "no-store",
          });
          freshExplanation = fresh.problems.find(
            (problem) => problem.problemId === result.problemId,
          )?.explanation;
          if (freshExplanation) {
            setProblemSet((prev) => ({
              ...prev,
              problems: prev.problems.map((problem) =>
                problem.problemId === result.problemId
                  ? { ...problem, explanation: freshExplanation }
                  : problem,
              ),
            }));
            setSubmissionResult((prev) =>
              prev ? { ...prev, explanation: freshExplanation } : prev,
            );
          }
        } catch {
          /* 재조회 실패 시 기존 값 유지 — 이후 재진입/새로고침으로 복구 가능 */
        }
      }

      // 해설 텍스트를 확정했을 때만 loaded 로 기록 — 비어 있으면 다음 해설 탭 진입 시 재조회되도록 남긴다.
      if (result.explanation ?? currentProblem.explanation ?? freshExplanation) {
        setLoadedExplanationProblemIds((prev) => {
          const next = new Set(prev);
          next.add(result.problemId);
          return next;
        });
      }

      // 잠금 해제가 persist 됐으므로 Router Cache 를 무효화해 재진입 시 stale 상태 방지 (배포 전용 재현).
      router.refresh();

      if (!hints[currentIndex]?.length) {
        await fetchHints(currentProblem.problemId, currentIndex);
      }

      setExplanationViewConfirmOpen(false);
      setActiveTab("solution");

      const isCompleted =
        result.problemSetCompleted ??
        nextProblemStates.every((state) => isCorrectLikeStatus(state));

      if (showCompletionModal && isCompleted) {
        setLectureCompleteModalOpen(true);
      }
    } catch (error) {
      handleClientError(error, {
        router,
        fallbackTitle: "해설 조회 실패",
        fallbackMessage: "해설을 조회하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        showModal: (title, content) =>
          setAlertModal({ open: true, title, content }),
      });
    } finally {
      setIsViewingExplanation(false);
    }
  };

  const handleRun = async () => {
    if (!currentProblem?.problemId || isRunning) return;
    if (!code.trim()) {
      setEmptySubmitModalOpen(true);
      return;
    }

    setIsRunning(true);
    try {
      const result = await runProblem(currentProblem.problemId, "", code);
      setSubmissionResult(null);
      setExecutionResult(result);
      setActiveTab("result");
    } catch (error) {
      handleClientError(error, {
        router,
        fallbackTitle: "코드 실행 실패",
        fallbackMessage:
          "코드를 실행하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        showModal: (title, content) =>
          setAlertModal({ open: true, title, content }),
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
      // 강좌 전용 제출 URL 사용
      const result = await submitLectureProblem(
        lectureProblemSetId,
        currentProblem.problemId,
        code,
      );

      setExecutionResult(null);
      setSubmissionResult(result);
      setActiveTab("result");

      if (result.isCorrect) {
        // 정답 처리된 문제의 draft 는 더 이상 보관할 필요 없음.
        const solvedProblemId = currentProblem.problemId;
        if (solvedProblemId != null) {
          const drafts = loadDrafts(lectureProblemSetId);
          delete drafts[solvedProblemId];
          saveDrafts(lectureProblemSetId, drafts);
        }

        const updatedStates = problemStates.map((state, index) => {
          const problemId = problemSet?.problems[index]?.problemId;
          if (index === currentIndex) return "CORRECT" as ProblemStatus;
          if (
            result.nextProblemId &&
            problemId === result.nextProblemId &&
            state === "LOCKED"
          ) {
            return "UNSOLVED" as ProblemStatus;
          }
          return state;
        });
        setProblemStates(updatedStates);
        setHintEnabled((prev) => updateArrayItem(prev, currentIndex, true));
        setSolutionEnabled((prev) => updateArrayItem(prev, currentIndex, true));

        // 잠금 해제 persist 반영 — 재진입 stale 방지를 위해 Router Cache 무효화.
        router.refresh();

        if (!hints[currentIndex]?.length) {
          await fetchHints(currentProblem.problemId, currentIndex);
        }

        // 모든 문제 정답이면 강의 완료 모달로, 아니면 일반 정답 모달.
        const allCorrect = updatedStates.every((state) =>
          isCorrectLikeStatus(state),
        );
        if (allCorrect) {
          setLectureCompleteModalOpen(true);
        } else {
          setSuccessModalOpen(true);
        }
      } else {
        setProblemStates((prev) =>
          updateArrayItem(prev, currentIndex, "WRONG"),
        );
        setHintEnabled((prev) => updateArrayItem(prev, currentIndex, true));

        if (!hints[currentIndex]?.length) {
          await fetchHints(currentProblem.problemId, currentIndex);
        }

        setShowHintToast(true);
        window.setTimeout(() => setShowHintToast(false), 2000);
      }
    } catch (error) {
      // 이미 완료한 문제세트 재제출(LRN-009)은 완료로 보고 다음 강의 안내 (ApiClientError 일 때만).
      if (
        error instanceof ApiClientError &&
        (error.code === "LRN-009" || /already completed/i.test(error.message))
      ) {
        setLectureCompleteModalOpen(true);
        return;
      }
      handleClientError(error, {
        router,
        fallbackTitle: "답안 제출 실패",
        fallbackMessage:
          "답안을 제출하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        showModal: (title, content) =>
          setAlertModal({ open: true, title, content }),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshProblemChatMessages = useCallback(async (roomId: number) => {
    const refreshed = await getProblemChatMessages(roomId);
    if (activeChatRoomIdRef.current === roomId) {
      setChatMessages(refreshed);
    }
  }, []);

  const showError = useCallback(
    (title: string, content: string) =>
      setAlertModal({ open: true, title, content }),
    [],
  );

  const handleChatFeedback = useProblemChatFeedback({
    chatMessages,
    setChatMessages,
    feedbackPendingIds,
    setFeedbackPendingIds,
    showError,
  });

  const sendChat = async (overrideMessage?: string) => {
    const userMessage =
      typeof overrideMessage === "string" ? overrideMessage.trim() : chatInput.trim();

    if (
      !userMessage ||
      chatSending ||
      !problemSet.id ||
      !currentProblem?.problemId
    ) {
      return;
    }

    const targetRoomId = chatRoomId;
    const targetProblemId = currentProblem.problemId;
    const targetProblemSetId = problemSet.problemSetId ?? problemSet.id;
    const controller = new AbortController();
    let newRoomId: number | undefined;
    let streamErrorReceived = false;
    let syncMessagesPromise: Promise<void> | null = null;
    const userMessageId = createClientMessageId();
    const assistantMessageId = createClientMessageId();

    setChatMessages((prev) => [
      ...prev,
      { role: "USER", content: userMessage, clientId: userMessageId },
      { role: "ASSISTANT", content: "", clientId: assistantMessageId },
    ]);
    setChatInput("");
    setChatSending(true);
    setShowChatResponsePending(true);
    chatStreamAbortRef.current?.abort();
    chatStreamAbortRef.current = controller;

    const setLastAssistant = (content: string, error = false) => {
      setChatMessages((prev) => {
        const next = [...prev];
        const messageIndex = next.findIndex(
          (message) => message.clientId === assistantMessageId,
        );

        if (messageIndex < 0) {
          return prev;
        }

        next[messageIndex] = {
          ...next[messageIndex],
          content,
          error,
        };

        return next;
      });
    };
    const typewriter = createChatTypewriter({
      onUpdate: setLastAssistant,
      signal: controller.signal,
    });

    try {
      const path = targetRoomId
        ? `/api/v1/chat/${targetRoomId}/messages`
        : "/api/v1/chat/messages";

      await streamChat(
        path,
        targetRoomId
          ? { userMessage }
          : {
              userMessage,
              problemSetId: targetProblemSetId,
              problemId: targetProblemId,
            },
        {
          onToken: (token) => {
            setShowChatResponsePending(false);
            typewriter.push(token);
          },
          onRoom: (roomId) => {
            newRoomId = roomId;
            activeChatRoomIdRef.current = roomId;
            setChatRoomId(roomId);
          },
          onError: (error) => {
            streamErrorReceived = true;
            setShowChatResponsePending(false);
            typewriter.stop();
            setLastAssistant(error.message, true);
          },
          onDone: () => {
            const refreshRoomId = newRoomId ?? activeChatRoomIdRef.current;

            if (refreshRoomId) {
              syncMessagesPromise = refreshProblemChatMessages(
                refreshRoomId,
              ).catch(() => {
                // 동기화 실패 시 스트리밍으로 받은 응답을 유지한다.
              });
            }
          },
        },
        controller.signal,
      );

      await typewriter.flush();
      await syncMessagesPromise;

      if (streamErrorReceived) {
        return;
      }

      window.dispatchEvent(new Event("chatRoomUpdated"));
    } catch {
      if (controller.signal.aborted) {
        typewriter.stop();
        return;
      }

      typewriter.stop();
      setLastAssistant(
        "AI 답변을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
        true,
      );
      setShowChatResponsePending(false);

    } finally {
      if (chatStreamAbortRef.current === controller) {
        chatStreamAbortRef.current = null;
      }

      typewriter.stop();

      if (!controller.signal.aborted) {
        setChatSending(false);
        setShowChatResponsePending(false);
      }
    }
  };

  const handleSelectSuggestedQuestion = (question: string) => {
    if (!chatOpen) {
      setChatOpen(true);
    }

    setChatInput(question);
  };

  return (
    <>
      <main className={styles.container}>
        <CategoryNav
          isProblemChatOpen={chatOpen}
          isRunning={isRunning}
          onBack={() => setWarningModalOpen(true)}
          onRun={handleRun}
          onToggleProblemChat={() => {
            setMobileSidebarOpen(false);
            setChatOpen((prev) => !prev);
          }}
          variant="problem-detail"
        />

        <div className={styles.mainArea}>
          <section className={styles.contentArea} ref={contentAreaRef}>
            <article
              className={`${styles.problemBox} ${
                isPanelSplitAvailable
                  ? styles.problemResizablePane
                  : styles.problemStackedPane
              }`}
              style={isPanelSplitAvailable ? problemPanelStyle : undefined}
            >
              <Sidebar
                canMoveProblem={canMoveProblem}
                currentIndex={currentIndex}
                getProblemButtonClass={getProblemButtonClass}
                isOpen={mobileSidebarOpen}
                moveProblem={moveProblem}
                onToggleProblemList={() =>
                  setMobileSidebarOpen((prev) => !prev)
                }
                problemSet={problemSet}
                problemStates={problemStates}
                variant="problem-detail"
              />
              <div className={styles.problemHeader}>
                <h2>문제 내용</h2>
                <button
                  aria-label="CSV 다운로드"
                  className={styles.datasetDownloadButton}
                  disabled={isDatasetDownloading}
                  onClick={handleDatasetDownload}
                  title="CSV 다운로드"
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    className={styles.datasetDownloadIcon}
                  >
                    <Image
                      alt=""
                      height={18}
                      src="/assets/img/download-Icon.svg"
                      width={18}
                    />
                  </span>
                  <span className={styles.datasetDownloadText}>
                    CSV파일 다운로드
                  </span>
                </button>
              </div>
              <div className={styles.problemContent}>
                {currentProblem?.content}
              </div>
            </article>

            {isPanelSplitAvailable && (
              <button
                aria-label="문제 내용과 문제풀이 영역 너비 조절"
                aria-orientation="vertical"
                className={styles.resizeHandle}
                onPointerDown={handlePanelResizeStart}
                role="separator"
                type="button"
              />
            )}

            <section
              className={`${styles.solveBox} ${
                isPanelSplitAvailable
                  ? styles.solveResizablePane
                  : styles.solveStackedPane
              }`}
            >
              <div className={styles.editorSection}>
                <h2>문제풀이 영역</h2>
                {showHintToast && (
                  <div className={styles.hintToast}>
                    힌트를 확인할 수 있습니다.
                  </div>
                )}
                <ProblemCodeEditor code={code} onCodeChange={handleCodeChange} />
              </div>

              <div className={styles.tabs}>
                <button
                  className={activeTab === "result" ? styles.activeTab : ""}
                  onClick={() => handleTabChange("result")}
                  type="button"
                >
                  실행결과
                </button>
                <button
                  className={activeTab === "hint" ? styles.activeTab : ""}
                  disabled={!hintEnabled[currentIndex]}
                  onClick={() => handleTabChange("hint")}
                  type="button"
                >
                  힌트
                </button>
                <button
                  className={activeTab === "solution" ? styles.activeTab : ""}
                  disabled={isViewingExplanation}
                  onClick={() => handleTabChange("solution")}
                  type="button"
                >
                  {isViewingExplanation ? "해설 조회 중" : "해설보기"}
                </button>
              </div>

              <ProblemResultPanel
                activeTab={activeTab}
                currentHints={currentHints}
                currentProblemExplanation={currentProblem?.explanation}
                executionResult={executionResult}
                submissionResult={submissionResult}
              />

              <div className={styles.submitWrap}>
                <button
                  className={styles.submitButton}
                  disabled={isSubmitting || isCurrentProblemCorrect}
                  onClick={handleSubmit}
                  type="button"
                >
                  {isSubmitting ? "제출 중" : "제출하기"}
                </button>
              </div>
            </section>
          </section>

          <ProblemChatPanel
            chatInput={chatInput}
            chatMessages={chatMessages}
            chatOpen={chatOpen}
            feedbackPendingIds={feedbackPendingIds}
            chatSending={chatSending}
            showChatSendingIndicator={showChatResponsePending}
            suggestedQuestions={suggestedQuestions}
            onChatInputChange={setChatInput}
            onClose={() => setChatOpen(false)}
            onFeedback={handleChatFeedback}
            onSelectSuggestedQuestion={handleSelectSuggestedQuestion}
            onSendChat={sendChat}
          />
        </div>
      </main>

      <OneButtonModal
        isOpen={successModalOpen}
        modalContent="해당 문제의 해설을 확인할 수 있습니다."
        modalTitle="정답입니다"
        onClose={() => setSuccessModalOpen(false)}
      />
      <OneButtonModal
        isOpen={lectureCompleteModalOpen}
        modalContent="모든 문제를 풀었습니다! 다음 강의로 이동합니다."
        modalTitle="강의 완료"
        onClose={() => {
          setLectureCompleteModalOpen(false);
          router.push(nextLecturePath);
        }}
      />
      <OneButtonModal
        isOpen={emptySubmitModalOpen}
        modalContent="실행하거나 제출할 코드를 입력해 주세요."
        modalTitle="내용을 입력해 주세요"
        onClose={() => setEmptySubmitModalOpen(false)}
      />
      <TwoButtonModal
        cancelDisabled={isViewingExplanation}
        confirmDisabled={isViewingExplanation}
        isOpen={explanationViewConfirmOpen}
        modalContent={
          "해설을 확인하면\n이후 해설과 힌트를 확인할 수 있습니다."
        }
        modalTitle="해설을 확인하시겠습니까?"
        onClose={() => {
          if (!isViewingExplanation) {
            setExplanationViewConfirmOpen(false);
          }
        }}
        onConfirm={handleExplanationViewConfirm}
      />
      <OneButtonModal
        isOpen={alertModal.open}
        modalContent={alertModal.content}
        modalTitle={alertModal.title}
        onClose={() => setAlertModal((prev) => ({ ...prev, open: false }))}
      />
      <WarningModal
        isOpen={warningModalOpen}
        modalContent="작성한 내용은 저장되지 않습니다."
        modalTitle="정말 나가시겠습니까?"
        onClose={() => setWarningModalOpen(false)}
        onConfirm={() => router.push(exitToLecturePath)}
      />
    </>
  );
}
