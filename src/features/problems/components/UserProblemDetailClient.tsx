"use client";

// CSR - 문제풀이 상호작용: 서버 초기 문제 데이터를 상태로 받아 코드 입력, 실행, 제출, 문제 이동을 즉시 처리함
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import CategoryNav from "@/components/layout/CategoryNav";
import Sidebar from "@/components/layout/Sidebar";
import { useProblemChat } from "@/features/problems/hooks/useProblemChat";
import { useProblemWorkspace } from "@/features/problems/hooks/useProblemWorkspace";
import { useResizableProblemPanel } from "@/features/problems/hooks/useResizableProblemPanel";

import { getProblemRecommendedCourses } from "../actions";
import { problemDetailClasses } from "../problemDetailStyles";
import type {
  RecommendedCourse,
  ProblemSetDetail,
  ProblemSetResult,
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


export default function UserProblemDetailClient({
  problemSetId,
  initialProblemSet,
  initialProblemSetResult,
  initialUserId,
}: UserProblemDetailClientProps) {
  const router = useRouter();

  const [recommendedCourses, setRecommendedCourses] = useState<
    Record<number, RecommendedCourse[]>
  >({});
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [pendingRecommendedCourseId, setPendingRecommendedCourseId] =
    useState<number | null>(null);
  const [alertModal, setAlertModal] = useState({
    open: false,
    title: "",
    content: "",
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const {
    contentAreaRef,
    isPanelSplitAvailable,
    problemPanelStyle,
    handlePanelResizeStart,
  } = useResizableProblemPanel();
  const showError = useCallback((title: string, content: string) => {
    setAlertModal({ open: true, title, content });
  }, []);
  const resetChatRef = useRef<() => void>(() => {});
  const resetChat = useCallback(() => resetChatRef.current(), []);
  const closeMobileSidebar = useCallback(() => setMobileSidebarOpen(false), []);

  const {
    problemSet,
    currentProblem,
    currentIndex,
    currentHints,
    isCurrentProblemCorrect,
    code,
    problemStates,
    hintEnabled,
    solutionEnabled,
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
  } = useProblemWorkspace({
    problemSetId,
    initialProblemSet,
    initialProblemSetResult,
    initialUserId,
    resetChat,
    closeMobileSidebar,
    showError,
  });

  const {
    chatOpen,
    setChatOpen,
    hasOpenedChatPanel,
    chatRoomId,
    chatRoomTitle,
    chatRoomTitleInput,
    setChatRoomTitleInput,
    chatRoomTitleEditing,
    chatRoomTitleConfirmOpen,
    setChatRoomTitleConfirmOpen,
    chatRoomTitleUpdating,
    chatMessages,
    feedbackPendingIds,
    chatInput,
    setChatInput,
    chatSending,
    showChatResponsePending,
    chatLoading,
    suggestedQuestions,
    toggleChat,
    resetChatState,
    sendChat,
    handleChatFeedback,
    handleSelectSuggestedQuestion,
    startChatRoomTitleEdit,
    cancelChatRoomTitleEdit,
    requestChatRoomTitleUpdate,
    handleChatRoomTitleUpdate,
  } = useProblemChat({
    problemSetId: problemSet.id,
    currentProblemId: currentProblem?.problemId,
    showError,
  });

  // workspace 의 소문제 이동/URL 동기화가 chat 을 초기화할 수 있도록 최신 resetChatState 를
  // ref 로 연결(순환결합 차단). resetChat 호출은 항상 이벤트/타이머라 커밋 후 참조되어 안전.
  useEffect(() => {
    resetChatRef.current = resetChatState;
  }, [resetChatState]);

  const toggleProblemChat = useCallback(() => {
    setMobileSidebarOpen(false);
    toggleChat();
  }, [toggleChat]);

  useEffect(() => {
    let isMounted = true;

    const loadRecommendedCourses = async () => {
      if (
        !currentProblem?.problemId ||
        recommendedCourses[currentProblem.problemId]
      ) {
        return;
      }

      try {
        const courses = await getProblemRecommendedCourses(
          currentProblem.problemId,
        );

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
              problemListSlot={
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
              }
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
              feedbackPendingIds={feedbackPendingIds}
              chatRoomTitleEditing={chatRoomTitleEditing}
              chatRoomTitleInput={chatRoomTitleInput}
              chatRoomTitle={chatRoomTitle}
              chatSending={chatSending || chatLoading}
              showChatSendingIndicator={showChatResponsePending}
              suggestedQuestions={suggestedQuestions}
              onChatInputChange={setChatInput}
              onChatRoomTitleCancel={cancelChatRoomTitleEdit}
              onChatRoomTitleChange={setChatRoomTitleInput}
              onChatRoomTitleEdit={startChatRoomTitleEdit}
              onChatRoomTitleSubmit={requestChatRoomTitleUpdate}
              onClose={() => setChatOpen(false)}
              onFeedback={handleChatFeedback}
              onSelectSuggestedQuestion={handleSelectSuggestedQuestion}
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

