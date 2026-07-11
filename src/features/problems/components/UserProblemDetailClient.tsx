"use client";

// CSR - 문제풀이 상호작용: 서버 초기 문제 데이터를 상태로 받아 코드 입력, 실행, 제출, 문제 이동을 즉시 처리함
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
} from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import CategoryNav from "@/components/layout/CategoryNav";
import Sidebar from "@/components/layout/Sidebar";
import { mobileSidebarClasses } from "@/components/layout/mobileSidebarClasses";
import { streamChat } from "@/features/chat/stream";
import { createChatTypewriter } from "@/features/chat/typewriter";
import { handleClientError } from "@/lib/errorHandling";

import {
  getProblemDatasetDownloadUrl,
  getProblemChatMessages,
  getProblemChatRooms,
  getProblemHints,
  getProblemRecommendedCourses,
  getProblemSetDetailWithProgress,
  getProblemSetResult,
  runProblem,
  submitProblem,
  updateProblemChatRoomTitle,
  viewProblemExplanation,
} from "../actions";
import { problemDetailClasses } from "../problemDetailStyles";
import type {
  ChatMessage,
  ExecutionResult,
  ProblemHint,
  ProblemResultTab,
  RecommendedCourse,
  ProblemSetDetail,
  ProblemSetResult,
  ProblemChatRoom,
  ProblemStatus,
  SubmissionResult,
} from "../types";
import ProblemDetailModals from "./ProblemDetailModals";
import ProblemSolveSection from "./ProblemSolveSection";
import ProblemStatementCard from "./ProblemStatementCard";

const LazyProblemChatPanel = dynamic(() => import("./ProblemChatPanel"), {
  loading: () => null,
  ssr: false,
});

interface UserProblemDetailClientProps {
  problemSetId: string;
  initialProblemSet: ProblemSetDetail;
  initialProblemSetResult: ProblemSetResult | null;
  initialUserId: string;
}

const updateArrayItem = <T,>(items: T[], index: number, value: T) =>
  items.map((item, itemIndex) => (itemIndex === index ? value : item));

function createClientMessageId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

const MIN_PROBLEM_PANEL_WIDTH = 260;
const MIN_SOLVE_PANEL_WIDTH = 400;
const RESIZE_HANDLE_RESERVED_WIDTH = 32;
const DEFAULT_PROBLEM_PANEL_PERCENT = 50;

const isExplanationViewedStatus = (status?: ProblemStatus) =>
  status === "EXPLANATION_VIEWED";

const isCorrectLikeStatus = (status?: ProblemStatus) =>
  status === "CORRECT" || isExplanationViewedStatus(status);

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

function normalizeId(value?: number | string | null) {
  return value == null ? "" : String(value);
}

function getRoomProblemSetId(room: ProblemChatRoom) {
  return (
    room.problemSetId ??
    room.problemSet?.problemSetId ??
    room.problemSet?.id ??
    null
  );
}

function getRoomProblemId(room: ProblemChatRoom) {
  return room.problemId ?? room.problem?.problemId ?? room.problem?.id ?? null;
}

function findProblemChatRoom(
  rooms: ProblemChatRoom[],
  problemSetId: number,
  problemId: number,
) {
  const targetProblemSetId = normalizeId(problemSetId);
  const targetProblemId = normalizeId(problemId);

  return rooms.find(
    (room) =>
      normalizeId(getRoomProblemSetId(room)) === targetProblemSetId &&
      normalizeId(getRoomProblemId(room)) === targetProblemId,
  );
}

function findProblemChatRoomById(rooms: ProblemChatRoom[], roomId: number) {
  return rooms.find((room) => room.roomId === roomId);
}

export default function UserProblemDetailClient({
  problemSetId,
  initialProblemSet,
  initialProblemSetResult,
  initialUserId,
}: UserProblemDetailClientProps) {
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

  const [problemSet, setProblemSet] = useState<ProblemSetDetail>(initialProblemSet);
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
  const [recommendedCourses, setRecommendedCourses] = useState<
    Record<number, RecommendedCourse[]>
  >({});
  const [activeTab, setActiveTab] = useState<ProblemResultTab>("result");
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
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
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [problemCompleteModalOpen, setProblemCompleteModalOpen] =
    useState(false);
  const [emptySubmitModalOpen, setEmptySubmitModalOpen] = useState(false);
  const [explanationViewConfirmOpen, setExplanationViewConfirmOpen] =
    useState(false);
  const [isViewingExplanation, setIsViewingExplanation] = useState(false);
  const [pendingRecommendedCourseId, setPendingRecommendedCourseId] =
    useState<number | null>(null);
  const [alertModal, setAlertModal] = useState({
    open: false,
    title: "",
    content: "",
  });
  const [chatOpen, setChatOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [hasOpenedChatPanel, setHasOpenedChatPanel] = useState(false);
  const [chatRoomId, setChatRoomId] = useState<number | null>(null);
  const [chatRoomTitle, setChatRoomTitle] = useState<string | null>(null);
  const [chatRoomTitleInput, setChatRoomTitleInput] = useState("");
  const [chatRoomTitleEditing, setChatRoomTitleEditing] = useState(false);
  const [chatRoomTitleConfirmOpen, setChatRoomTitleConfirmOpen] = useState(false);
  const [chatRoomTitleUpdating, setChatRoomTitleUpdating] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [showChatResponsePending, setShowChatResponsePending] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [problemPanelPercent, setProblemPanelPercent] = useState(
    DEFAULT_PROBLEM_PANEL_PERCENT,
  );
  const [isPanelSplitAvailable, setIsPanelSplitAvailable] = useState(false);
  const contentAreaRef = useRef<HTMLElement | null>(null);
  const activeChatRoomIdRef = useRef<number | null>(null);
  const chatStreamAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    activeChatRoomIdRef.current = chatRoomId;
  }, [chatRoomId]);

  useEffect(() => {
    return () => {
      chatStreamAbortRef.current?.abort();
    };
  }, []);

  const userId = useMemo(() => {
    if (typeof window === "undefined") {
      return searchParams.get("userId") ?? "";
    }

    return searchParams.get("userId") ?? localStorage.getItem("userId") ?? "";
  }, [searchParams]);

  const currentProblem = problemSet.problems[currentIndex];
  const currentHints = hints[currentIndex] ?? [];
  const isCurrentProblemCorrect = isCorrectLikeStatus(
    problemStates[currentIndex],
  );

  const problemPanelStyle = useMemo(
    () =>
      ({
        "--problem-panel-percent": `${problemPanelPercent}%`,
      }) as CSSProperties & Record<"--problem-panel-percent", string>,
    [problemPanelPercent],
  );

  useEffect(() => {
    const container = contentAreaRef.current;

    if (!container) {
      return;
    }

    const updateSplitAvailability = () => {
      const width = container.getBoundingClientRect().width;
      const canSplit =
        width >=
        MIN_PROBLEM_PANEL_WIDTH +
          MIN_SOLVE_PANEL_WIDTH +
          RESIZE_HANDLE_RESERVED_WIDTH;

      setIsPanelSplitAvailable(canSplit);

      if (!canSplit) {
        setProblemPanelPercent(DEFAULT_PROBLEM_PANEL_PERCENT);
        return;
      }

      const minPercent = (MIN_PROBLEM_PANEL_WIDTH / width) * 100;
      const maxPercent =
        ((width - MIN_SOLVE_PANEL_WIDTH - RESIZE_HANDLE_RESERVED_WIDTH) /
          width) *
        100;

      setProblemPanelPercent((prev) =>
        Math.min(Math.max(prev, minPercent), maxPercent),
      );
    };

    updateSplitAvailability();

    const resizeObserver = new ResizeObserver(updateSplitAvailability);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  const handlePanelResizeStart = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault();

      if (!isPanelSplitAvailable) {
        return;
      }

      const container = contentAreaRef.current;

      if (!container) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const maxProblemWidth =
        rect.width - MIN_SOLVE_PANEL_WIDTH - RESIZE_HANDLE_RESERVED_WIDTH;

      if (maxProblemWidth < MIN_PROBLEM_PANEL_WIDTH) {
        return;
      }

      const updatePanelWidth = (clientX: number) => {
        const nextWidth = Math.min(
          Math.max(clientX - rect.left, MIN_PROBLEM_PANEL_WIDTH),
          maxProblemWidth,
        );

        setProblemPanelPercent((nextWidth / rect.width) * 100);
      };

      const handlePointerMove = (pointerEvent: PointerEvent) => {
        updatePanelWidth(pointerEvent.clientX);
      };
      const handlePointerUp = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      updatePanelWidth(event.clientX);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp, { once: true });
    },
    [isPanelSplitAvailable],
  );

  const toggleProblemChat = useCallback(() => {
    setHasOpenedChatPanel(true);
    setMobileSidebarOpen(false);
    setChatOpen((prev) => !prev);
  }, []);

  const resetChatState = useCallback(() => {
    chatStreamAbortRef.current?.abort();
    chatStreamAbortRef.current = null;
    setChatRoomId(null);
    setChatRoomTitle(null);
    setChatRoomTitleInput("");
    setChatRoomTitleEditing(false);
    setChatRoomTitleConfirmOpen(false);
    setChatMessages([]);
    setChatInput("");
    setChatSending(false);
    setShowChatResponsePending(false);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchProblemSet = async () => {
      try {
        if (!userId || userId === initialUserId) {
          return;
        }

        const [data, result] = await Promise.all([
          getProblemSetDetailWithProgress(problemSetId, userId),
          getProblemSetResult(problemSetId).catch(() => null),
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
      } catch (error) {
        if (!isMounted) {
          return;
        }

        handleClientError(error, {
          router,
          fallbackTitle: "문제 조회 실패",
          fallbackMessage: "문제 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
          showModal: (title, content) =>
            setAlertModal({ open: true, title, content }),
        });
      }
    };

    fetchProblemSet();

    return () => {
      isMounted = false;
    };
  }, [initialUserId, problemSetId, router, targetProblemId, userId]);

  useEffect(() => {
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

    setUserCodes(nextCodes);
    setCurrentIndex(nextIndex);
    setCode(nextCodes[nextIndex] ?? "");
    setSubmissionResult(submissionResults[nextIndex] ?? null);
    setActiveTab("result");
    setExecutionResult(null);
    resetChatState();
  }, [
    code,
    currentIndex,
    problemSet.problems,
    resetChatState,
    submissionResults,
    targetProblemId,
    userCodes,
  ]);

  useEffect(() => {
    let isMounted = true;

    const loadRecommendedCourses = async () => {
      if (!currentProblem?.problemId || recommendedCourses[currentProblem.problemId]) {
        return;
      }

      try {
        const courses = await getProblemRecommendedCourses(currentProblem.problemId);

        if (isMounted) {
          setRecommendedCourses((prev) => ({
            ...prev,
            [currentProblem.problemId]: courses,
          }));
        }
      } catch (error) {
        console.error("추천 강좌 조회 실패:", error);

        if (isMounted) {
          setRecommendedCourses((prev) => ({
            ...prev,
            [currentProblem.problemId]: [],
          }));
        }
      }
    };

    void loadRecommendedCourses();

    return () => {
      isMounted = false;
    };
  }, [currentProblem?.problemId, recommendedCourses]);

  useEffect(() => {
    let isMounted = true;

    const loadProblemChatRoom = async () => {
      if (!hasOpenedChatPanel) {
        return;
      }

      if (!problemSet.id || !currentProblem?.problemId) {
        resetChatState();
        return;
      }

      resetChatState();
      setChatLoading(true);

      try {
        const rooms = await getProblemChatRooms();
        const room = findProblemChatRoom(
          rooms,
          problemSet.id,
          currentProblem.problemId,
        );

        if (!isMounted || !room) {
          return;
        }

        setChatRoomId(room.roomId);
        setChatRoomTitle(room.title || null);
        setChatRoomTitleInput(room.title || "");

        const messages = await getProblemChatMessages(room.roomId);

        if (!isMounted) {
          return;
        }

        setChatMessages(messages);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        handleClientError(error, {
          router,
          fallbackTitle: "채팅방 조회 실패",
          fallbackMessage:
            "문제 전용 채팅방을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
          showModal: (title, content) =>
            setAlertModal({ open: true, title, content }),
        });
      } finally {
        if (isMounted) {
          setChatLoading(false);
        }
      }
    };

    loadProblemChatRoom();

    return () => {
      isMounted = false;
    };
  }, [
    currentProblem?.problemId,
    hasOpenedChatPanel,
    problemSet.id,
    resetChatState,
    router,
  ]);

  const canMoveProblem = (index: number) => problemStates[index] !== "LOCKED";

  const getProblemButtonClass = (state: ProblemStatus | undefined, isCurrent: boolean) => {
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
    resetChatState();
    setMobileSidebarOpen(false);
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
      setActiveTab("solution");
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
        showModal: (title, content) =>
          setAlertModal({ open: true, title, content }),
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

        if (!hints[currentIndex]?.length) {
          await fetchHints(currentProblem.problemId, currentIndex);
        }

        const totalProblemCount =
          problemSet.totalProblemCount ?? problemSet.problems.length;
        const isLastProblem =
          currentIndex === problemSet.problems.length - 1 ||
          (currentProblem.problemNumber ?? currentIndex + 1) >= totalProblemCount;
        const isAllCorrect = nextProblemStates.every(
          (state) => isCorrectLikeStatus(state),
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
        showModal: (title, content) =>
          setAlertModal({ open: true, title, content }),
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

  const handleRecommendedCourseSelect = (courseId: number) => {
    setPendingRecommendedCourseId(courseId);
  };

  const handleRecommendedCourseMove = () => {
    if (pendingRecommendedCourseId === null) {
      return;
    }

    const targetCourseId = pendingRecommendedCourseId;
    setPendingRecommendedCourseId(null);
    router.push(`/courses/${targetCourseId}`);
  };

  const startChatRoomTitleEdit = () => {
    setChatRoomTitleInput(chatRoomTitle ?? "");
    setChatRoomTitleEditing(true);
  };

  const cancelChatRoomTitleEdit = () => {
    setChatRoomTitleInput(chatRoomTitle ?? "");
    setChatRoomTitleEditing(false);
    setChatRoomTitleConfirmOpen(false);
  };

  const requestChatRoomTitleUpdate = () => {
    const nextTitle = chatRoomTitleInput.trim();

    if (!nextTitle || nextTitle === (chatRoomTitle ?? "")) {
      cancelChatRoomTitleEdit();
      return;
    }

    setChatRoomTitleConfirmOpen(true);
  };

  const handleChatRoomTitleUpdate = async () => {
    if (!chatRoomId || chatRoomTitleUpdating) {
      return;
    }

    const targetRoomId = chatRoomId;
    const nextTitle = chatRoomTitleInput.trim();

    if (!nextTitle) {
      return;
    }

    setChatRoomTitleUpdating(true);

    try {
      const updatedRoom = await updateProblemChatRoomTitle(targetRoomId, nextTitle);

      if (activeChatRoomIdRef.current !== targetRoomId) {
        return;
      }

      const updatedTitle = updatedRoom?.title ?? nextTitle;

      setChatRoomTitle(updatedTitle);
      setChatRoomTitleInput(updatedTitle);
      setChatRoomTitleEditing(false);
      setChatRoomTitleConfirmOpen(false);
      window.dispatchEvent(new Event("chatRoomUpdated"));
    } catch (error) {
      setChatRoomTitleConfirmOpen(false);
      handleClientError(error, {
        router,
        fallbackTitle: "채팅방 이름 수정 실패",
        fallbackMessage:
          "채팅방 이름을 수정하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        showModal: (title, content) =>
          setAlertModal({ open: true, title, content }),
      });
    } finally {
      setChatRoomTitleUpdating(false);
    }
  };

  const sendChat = async () => {
    if (
      !chatInput.trim() ||
      chatSending ||
      chatLoading ||
      !problemSet.id ||
      !currentProblem?.problemId
    ) {
      return;
    }

    const userMessage = chatInput;
    const targetRoomId = chatRoomId;
    const targetProblemId = currentProblem.problemId;
    const controller = new AbortController();
    let newRoomId: number | undefined;
    let streamErrorReceived = false;
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
    const refreshNewChatRoomTitle = async (roomId: number) => {
      try {
        const rooms = await getProblemChatRooms();

        if (
          controller.signal.aborted ||
          activeChatRoomIdRef.current !== roomId
        ) {
          return;
        }

        const room = findProblemChatRoomById(rooms, roomId);
        const nextTitle = room?.title || null;

        setChatRoomTitle(nextTitle);
        setChatRoomTitleInput(nextTitle ?? "");
      } catch {
        // 채팅방 이름 갱신 실패는 메시지 스트림을 방해하지 않는다.
      }
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
              problemSetId: problemSet.id,
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
            void refreshNewChatRoomTitle(roomId);
          },
          onError: (error) => {
            streamErrorReceived = true;
            setShowChatResponsePending(false);
            typewriter.stop();
            setLastAssistant(error.message, true);
          },
        },
        controller.signal,
      );

      await typewriter.flush();

      if (streamErrorReceived) {
        return;
      }

      if (!targetRoomId && newRoomId) {
        setChatRoomId(newRoomId);
      }

      window.dispatchEvent(new Event("chatRoomUpdated"));
    } catch (error) {
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

      handleClientError(error, {
        router,
        fallbackTitle: "메시지 전송 실패",
        fallbackMessage:
          "메시지를 전송하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        showModal: (title, content) =>
          setAlertModal({ open: true, title, content }),
      });
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

  return (
    <>
      <main className={problemDetailClasses.container}>
        <CategoryNav
          isProblemChatOpen={chatOpen}
          isRunning={isRunning}
          onBack={() => setWarningModalOpen(true)}
          onRun={handleRun}
          onToggleProblemChat={toggleProblemChat}
          variant="problem-detail"
        />

        <div className={problemDetailClasses.mainArea}>
          <Sidebar
            canMoveProblem={canMoveProblem}
            currentIndex={currentIndex}
            getProblemButtonClass={getProblemButtonClass}
            isOpen={mobileSidebarOpen}
            moveProblem={moveProblem}
            problemSet={problemSet}
            problemStates={problemStates}
            variant="problem-detail"
          />

          {!chatOpen && (
            <button
              aria-label={mobileSidebarOpen ? "문제 목록 닫기" : "문제 목록 열기"}
              aria-pressed={mobileSidebarOpen}
              className={problemDetailClasses.mobileSidebarToggle}
              onClick={() => setMobileSidebarOpen((prev) => !prev)}
              type="button"
            >
              <Image
                alt=""
                className={problemDetailClasses.mobileSidebarIcon}
                height={56}
                src="/assets/img/sidebar.svg"
                width={56}
              />
            </button>
          )}

          {mobileSidebarOpen && !chatOpen && (
            <button
              aria-label="문제 목록 닫기"
              className={mobileSidebarClasses.backdrop}
              onClick={() => setMobileSidebarOpen(false)}
              type="button"
            />
          )}

          <section
            className={`${problemDetailClasses.contentArea} ${
              isPanelSplitAvailable
                ? ""
                : problemDetailClasses.contentAreaStacked
            }`}
            ref={contentAreaRef}
          >
            <ProblemStatementCard
              className={
                isPanelSplitAvailable
                  ? problemDetailClasses.problemResizablePane
                  : problemDetailClasses.problemStackedPane
              }
              content={currentProblem.content}
              isDownloadingDataset={isDatasetDownloading}
              onDownloadDataset={handleDatasetDownload}
              problemSetDescription={problemSet.description}
              problemSetTitle={problemSet.title}
              style={isPanelSplitAvailable ? problemPanelStyle : undefined}
            />

            {isPanelSplitAvailable && (
              <button
                aria-label="문제 내용과 문제풀이 영역 너비 조절"
                aria-orientation="vertical"
                className={problemDetailClasses.resizeHandle}
                onPointerDown={handlePanelResizeStart}
                role="separator"
                type="button"
              />
            )}

            <ProblemSolveSection
              activeTab={activeTab}
              className={
                isPanelSplitAvailable
                  ? problemDetailClasses.solveResizablePane
                  : problemDetailClasses.solveStackedPane
              }
              code={code}
              currentHints={currentHints}
              currentProblemExplanation={currentProblem.explanation}
              executionResult={executionResult}
              hintEnabled={hintEnabled[currentIndex]}
              isCurrentProblemCorrect={isCurrentProblemCorrect}
              isSubmitting={isSubmitting}
              isViewingExplanation={isViewingExplanation}
              onCodeChange={handleCodeChange}
              onRecommendedCourseSelect={handleRecommendedCourseSelect}
              onSubmit={handleSubmit}
              onTabChange={handleTabChange}
              recommendedCourses={
                currentProblem?.problemId
                  ? (recommendedCourses[currentProblem.problemId] ?? [])
                  : []
              }
              showHintToast={showHintToast}
              solutionEnabled={solutionEnabled[currentIndex]}
              submissionResult={submissionResult}
            />
          </section>

          {hasOpenedChatPanel && (
            <LazyProblemChatPanel
              canEditChatRoomTitle={Boolean(chatRoomId)}
              chatInput={chatInput}
              chatMessages={chatMessages}
              chatOpen={chatOpen}
              chatRoomTitleEditing={chatRoomTitleEditing}
              chatRoomTitleInput={chatRoomTitleInput}
              chatRoomTitle={chatRoomTitle}
              chatSending={chatSending || chatLoading}
              showChatSendingIndicator={showChatResponsePending}
              onChatInputChange={setChatInput}
              onChatRoomTitleCancel={cancelChatRoomTitleEdit}
              onChatRoomTitleChange={setChatRoomTitleInput}
              onChatRoomTitleEdit={startChatRoomTitleEdit}
              onChatRoomTitleSubmit={requestChatRoomTitleUpdate}
              onClose={() => setChatOpen(false)}
              onSendChat={sendChat}
            />
          )}
        </div>
      </main>

      <ProblemDetailModals
        alertModal={alertModal}
        chatRoomTitleConfirmOpen={chatRoomTitleConfirmOpen}
        chatRoomTitleInput={chatRoomTitleInput}
        chatRoomTitleUpdating={chatRoomTitleUpdating}
        emptySubmitModalOpen={emptySubmitModalOpen}
        explanationViewConfirmOpen={explanationViewConfirmOpen}
        explanationViewConfirming={isViewingExplanation}
        onAlertClose={() =>
          setAlertModal((prev) => ({ ...prev, open: false }))
        }
        onBackCancel={() => setWarningModalOpen(false)}
        onBackConfirm={() => router.push("/problems")}
        onChatRoomTitleConfirm={handleChatRoomTitleUpdate}
        onChatRoomTitleConfirmClose={() => {
          if (!chatRoomTitleUpdating) {
            setChatRoomTitleConfirmOpen(false);
          }
        }}
        onEmptySubmitClose={() => setEmptySubmitModalOpen(false)}
        onExplanationViewCancel={() => {
          if (!isViewingExplanation) {
            setExplanationViewConfirmOpen(false);
          }
        }}
        onExplanationViewConfirm={handleExplanationViewConfirm}
        onProblemCompleteConfirm={() => router.push("/problems")}
        onRecommendedCourseCancel={() => setPendingRecommendedCourseId(null)}
        onRecommendedCourseConfirm={handleRecommendedCourseMove}
        onSuccessClose={() => setSuccessModalOpen(false)}
        problemCompleteModalOpen={problemCompleteModalOpen}
        recommendedCourseModalOpen={pendingRecommendedCourseId !== null}
        successModalOpen={successModalOpen}
        warningModalOpen={warningModalOpen}
      />

    </>
  );
}

