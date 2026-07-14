"use client";

// ê°•ì¢Œ(ê°•ì˜) ë¬¸ì œ?€????ê¸°ì¡´ ë¬¸ì œ?€??UIë¥?ê·¸ë?ë¡??¬ì‚¬?©í•˜??
// ?°ì´?°ëŠ” lecture-problem-sets ê³„ì—´ URL(ê°•ì¢Œ ?„ìš© actions)ë¡?ì²˜ë¦¬?œë‹¤.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import CategoryNav from "@/components/layout/CategoryNav";
import Sidebar from "@/components/layout/Sidebar";
import { mobileSidebarClasses } from "@/components/layout/mobileSidebarClasses";
import { OneButtonModal, TwoButtonModal, WarningModal } from "@/components/common";
import { streamChat } from "@/features/chat/stream";
import { createChatTypewriter } from "@/features/chat/typewriter";
import { ApiClientError, handleClientError } from "@/lib/errorHandling";

// ê°•ì¢Œ ?„ìš©: ?…ì¥/?œì¶œ
import { submitLectureProblem } from "../actions";
import { getCourseLectures } from "@/features/course/lectureActions";
import { getCourseProblemSets } from "@/features/course/problemSetActions";
// ê³µí†µ ?¬ì‚¬?? ?¤í–‰/?ŒíŠ¸/ì±—ë´‡
import {
  deleteProblemMessageFeedback,
  getProblemDatasetDownloadUrl,
  getProblemChatMessages,
  getProblemHints,
  runProblem,
  setProblemMessageFeedback,
  viewProblemExplanation,
} from "@/features/problems/actions";
import type {
  ChatMessage,
  ExecutionResult,
  FeedbackRating,
  ProblemHint,
  ProblemResultTab,
  ProblemSetDetail,
  ProblemStatus,
  SubmissionResult,
} from "@/features/problems/types";
import ProblemChatPanel from "@/features/problems/components/ProblemChatPanel";
import ProblemCodeEditor from "@/features/problems/components/ProblemCodeEditor";
import ProblemResultPanel from "@/features/problems/components/ProblemResultPanel";
import { useResizableProblemPanel } from "@/features/problems/hooks/useResizableProblemPanel";

// ?¤í??¼ì? ë¬¸ì œ?€???”ë©´ê³??™ì¼?˜ê²Œ ê³µìœ ?˜ë˜, ?´ë¼?´ì–¸??ì»´í¬?ŒíŠ¸ ?˜ì¡´ ?†ì´ ?¤í????Œì¼ë§?ì°¸ì¡°??
import { problemDetailClasses as styles } from "@/features/problems/problemDetailStyles";

interface CourseProblemDetailClientProps {
  courseId: string;
  lectureProblemSetId: string;
  initialProblemSet: ProblemSetDetail;
}

const updateArrayItem = <T,>(items: T[], index: number, value: T) =>
  items.map((item, itemIndex) => (itemIndex === index ? value : item));

function createClientMessageId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

// ë¬¸ì œ?¸íŠ¸ë³??‘ì„± ì¤??µì•ˆ ?„ì‹œ ?€??(localStorage). ?•ë‹µ ì²˜ë¦¬?˜ë©´ ?´ë¦¬??
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
    /* quota ì´ˆê³¼ ??ë¬´ì‹œ */
  }
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

  // ?€?¥ëœ ?‘ì„± ì¤??µì•ˆ???ˆìœ¼ë©?startCode ?€??ê·¸ê²ƒ???¬ìš© (?•ë‹µ ì²˜ë¦¬?˜ë©´ ?´ë¦¬?´ë¨).
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

  // ì¢Œìš° ?¨ë„ ?œë˜ê·?ë¦¬ì‚¬?´ì¦ˆ (ë¬¸ì œ?€?´ë°©ê³??™ì¼)
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
  // ë§ˆì?ë§?ë¬¸ì œê¹Œì? ëª¨ë‘ ?•ë‹µ ??ê°•ì˜ ?„ë£Œ + ê°•ì¢Œ ?˜ì´ì§€ ?´ë™ ?ˆë‚´.
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

  // ??ë¬¸ì œ ?€?´ê? ?í•œ ê°•ì˜ + ?¤ìŒ ê°•ì˜ ?•ë³´ ???˜ê?ê¸??„ë£Œ ???•í™•??lecture ?˜ì´ì§€ë¡??´ë™.
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
        /* ?¤íŒ¨?´ë„ fallback ?¼ìš°???™ì‘ */
      }
    };
    void loadNavTargets();
  }, [courseId, lectureProblemSetId]);

  // ?˜ê?ê¸??„ë£Œ ëª¨ë‹¬???¼ìš°?????????ˆìœ¼ë©?lecture ?˜ì´ì§€, ?„ë‹ˆë©?ê°•ì¢Œ ?˜ì´ì§€ë¡?fallback.
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

  // ?°ì´?°ì…‹(CSV) ?¤ìš´ë¡œë“œ ??ë¬¸ì œ?¸íŠ¸ ?¨ìœ„ (ë¬¸ì œ?€?´ë°©ê³??™ì¼). ?œë²„ê°€ ?œëª… URL ë°œê¸‰.
  const handleDatasetDownload = async () => {
    if (isDatasetDownloading) return;
    // ?°ì´?°ì…‹?€ ë¬¸ì œ?¸íŠ¸ ?¨ìœ„ ??problemSetId(? íƒê°? ?†ìœ¼ë©??•ê·œ?”ëœ id ?¬ìš©.
    // lectureProblemSetId(ê°•ì˜-ë¬¸ì œ?¸íŠ¸ ?°ê²° ID)ë¡?fallback ?˜ë©´ ????
    const datasetKey = String(problemSet.problemSetId ?? problemSet.id);
    setIsDatasetDownloading(true);
    try {
      const dataset = await getProblemDatasetDownloadUrl(datasetKey);
      if (!dataset?.downloadUrl) {
        setAlertModal({
          open: true,
          title: "CSV ?¤ìš´ë¡œë“œ ?¤íŒ¨",
          content: "?¤ìš´ë¡œë“œ???°ì´?°ì…‹??ì°¾ì? ëª»í–ˆ?µë‹ˆ??",
        });
        return;
      }
      const parsedUrl = new URL(dataset.downloadUrl, window.location.origin);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        setAlertModal({
          open: true,
          title: "CSV ?¤ìš´ë¡œë“œ ?¤íŒ¨",
          content: "? íš¨?˜ì? ?Šì? ?¤ìš´ë¡œë“œ ì£¼ì†Œ?…ë‹ˆ??",
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
        fallbackTitle: "CSV ?¤ìš´ë¡œë“œ ?¤íŒ¨",
        fallbackMessage:
          "CSV ?¤ìš´ë¡œë“œ URL??ë°œê¸‰ë°›ì? ëª»í–ˆ?µë‹ˆ?? ? ì‹œ ???¤ì‹œ ?œë„??ì£¼ì„¸??",
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
    // ?‘ì„± ì¤??µì•ˆ localStorage ???€?????˜ì´ì§€ ?´íƒˆ ???¬ì§„????ë³µì›.
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
      // ê°•ì¢Œ ?„ìš© ?œì¶œ URL ?¬ìš©
      const result = await submitLectureProblem(
        lectureProblemSetId,
        currentProblem.problemId,
        code,
      );

      setExecutionResult(null);
      setSubmissionResult(result);
      setActiveTab("result");

      if (result.isCorrect) {
        // ?•ë‹µ ì²˜ë¦¬??ë¬¸ì œ??draft ?????´ìƒ ë³´ê????„ìš” ?†ìŒ.
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

        if (!hints[currentIndex]?.length) {
          await fetchHints(currentProblem.problemId, currentIndex);
        }

        // ëª¨ë“  ë¬¸ì œ ?•ë‹µ?´ë©´ ê°•ì˜ ?„ë£Œ ëª¨ë‹¬ë¡? ?„ë‹ˆë©??¼ë°˜ ?•ë‹µ ëª¨ë‹¬.
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
      // ?´ë? ?„ë£Œ??ë¬¸ì œ?¸íŠ¸ ?¬ì œì¶?LRN-009) ???ëŸ¬ê°€ ?„ë‹ˆ???„ë£Œë¡?ë³´ê³  ?¤ìŒ ê°•ì˜ë¡??ˆë‚´
      // BE ?¤ë¥˜ ê³„ì•½(ApiClientError)???Œë§Œ ì²˜ë¦¬???„ì˜ Error ë¡??¤ì œ ?¤íŒ¨ê°€ ?¨ê²¨ì§€ì§€ ?Šê²Œ ??
      if (
        error instanceof ApiClientError &&
        (error.code === "LRN-009" || /already completed/i.test(error.message))
      ) {
        setLectureCompleteModalOpen(true);
        return;
      }
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

  const handleChatFeedback = useCallback(
    async (messageId: number, nextRating: FeedbackRating) => {
      if (feedbackPendingIds.has(messageId)) {
        return false;
      }

      const currentFeedback =
        chatMessages.find((message) => message.messageId === messageId)
          ?.feedback ?? null;
      const isCancel = currentFeedback === nextRating;

      setFeedbackPendingIds((prev) => new Set(prev).add(messageId));

      setChatMessages((prev) =>
        prev.map((message) =>
          message.messageId === messageId
            ? { ...message, feedback: isCancel ? null : nextRating }
            : message,
        ),
      );

      try {
        if (isCancel) {
          await deleteProblemMessageFeedback(messageId);
        } else {
          await setProblemMessageFeedback(messageId, nextRating);
        }

        return true;
      } catch (error) {
        setChatMessages((prev) =>
          prev.map((message) =>
            message.messageId === messageId
              ? { ...message, feedback: currentFeedback }
              : message,
          ),
        );
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
              aria-label={mobileSidebarOpen ? "ë¬¸ì œ ëª©ë¡ ?«ê¸°" : "ë¬¸ì œ ëª©ë¡ ?´ê¸°"}
              aria-pressed={mobileSidebarOpen}
              className={styles.mobileSidebarToggle}
              onClick={() => setMobileSidebarOpen((prev) => !prev)}
              type="button"
            >
              <Image
                alt=""
                className={styles.mobileSidebarIcon}
                height={56}
                src="/assets/img/sidebar.svg"
                width={56}
              />
            </button>
          )}

          {mobileSidebarOpen && !chatOpen && (
            <button
              aria-label="ë¬¸ì œ ëª©ë¡ ?«ê¸°"
              className={mobileSidebarClasses.backdrop}
              onClick={() => setMobileSidebarOpen(false)}
              type="button"
            />
          )}

          <section className={styles.contentArea} ref={contentAreaRef}>
            <article
              className={`${styles.problemBox} ${
                isPanelSplitAvailable
                  ? styles.problemResizablePane
                  : styles.problemStackedPane
              }`}
              style={isPanelSplitAvailable ? problemPanelStyle : undefined}
            >
              <div className={styles.problemHeader}>
                <h2>ë¬¸ì œ ?´ìš©</h2>
                <button
                  aria-label="CSV ?¤ìš´ë¡œë“œ"
                  className={styles.datasetDownloadButton}
                  disabled={isDatasetDownloading}
                  onClick={handleDatasetDownload}
                  title="CSV ?¤ìš´ë¡œë“œ"
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
                    CSV?Œì¼ ?¤ìš´ë¡œë“œ
                  </span>
                </button>
              </div>
              <div className={styles.problemContent}>
                {currentProblem?.content}
              </div>
            </article>

            {isPanelSplitAvailable && (
              <button
                aria-label="ë¬¸ì œ ?´ìš©ê³?ë¬¸ì œ?€???ì—­ ?ˆë¹„ ì¡°ì ˆ"
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
                <h2>ë¬¸ì œ?€???ì—­</h2>
                {showHintToast && (
                  <div className={styles.hintToast}>
                    ?ŒíŠ¸ë¥??•ì¸?????ˆìŠµ?ˆë‹¤.
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
                  ?¤í–‰ê²°ê³¼
                </button>
                <button
                  className={activeTab === "hint" ? styles.activeTab : ""}
                  disabled={!hintEnabled[currentIndex]}
                  onClick={() => handleTabChange("hint")}
                  type="button"
                >
                  ?ŒíŠ¸
                </button>
                <button
                  className={activeTab === "solution" ? styles.activeTab : ""}
                  disabled={isViewingExplanation}
                  onClick={() => handleTabChange("solution")}
                  type="button"
                >
                  {isViewingExplanation ? "?´ì„¤ ì¡°íšŒ ì¤? : "?´ì„¤ë³´ê¸°"}
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
                  {isSubmitting ? "?œì¶œ ì¤? : "?œì¶œ?˜ê¸°"}
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
            onChatInputChange={setChatInput}
            onClose={() => setChatOpen(false)}
            onFeedback={handleChatFeedback}
            onSendChat={sendChat}
          />
        </div>
      </main>

      <OneButtonModal
        isOpen={successModalOpen}
        modalContent="?´ë‹¹ ë¬¸ì œ???´ì„¤???•ì¸?????ˆìŠµ?ˆë‹¤."
        modalTitle="?•ë‹µ?…ë‹ˆ??
        onClose={() => setSuccessModalOpen(false)}
      />
      <OneButtonModal
        isOpen={lectureCompleteModalOpen}
        modalContent="ëª¨ë“  ë¬¸ì œë¥??€?ˆìŠµ?ˆë‹¤! ?¤ìŒ ê°•ì˜ë¡??´ë™?©ë‹ˆ??"
        modalTitle="ê°•ì˜ ?„ë£Œ"
        onClose={() => {
          setLectureCompleteModalOpen(false);
          router.push(nextLecturePath);
        }}
      />
      <OneButtonModal
        isOpen={emptySubmitModalOpen}
        modalContent="?¤í–‰?˜ê±°???œì¶œ??ì½”ë“œë¥??…ë ¥??ì£¼ì„¸??"
        modalTitle="?´ìš©???…ë ¥??ì£¼ì„¸??
        onClose={() => setEmptySubmitModalOpen(false)}
      />
      <TwoButtonModal
        cancelDisabled={isViewingExplanation}
        confirmDisabled={isViewingExplanation}
        isOpen={explanationViewConfirmOpen}
        modalContent={
          "?´ì„¤???•ì¸?˜ë©´\n?´í›„ ?´ì„¤ê³??ŒíŠ¸ë¥??•ì¸?????ˆìŠµ?ˆë‹¤."
        }
        modalTitle="?´ì„¤???•ì¸?˜ì‹œê² ìŠµ?ˆê¹Œ?"
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
        modalContent="?‘ì„±???´ìš©?€ ?€?¥ë˜ì§€ ?ŠìŠµ?ˆë‹¤."
        modalTitle="?•ë§ ?˜ê??œê² ?µë‹ˆê¹?"
        onClose={() => setWarningModalOpen(false)}
        onConfirm={() => router.push(exitToLecturePath)}
      />
    </>
  );
}
