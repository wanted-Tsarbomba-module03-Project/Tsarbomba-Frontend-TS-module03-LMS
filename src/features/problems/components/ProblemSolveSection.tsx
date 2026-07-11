"use client";

import { memo } from "react";
import type { CSSProperties } from "react";

import { problemDetailClasses } from "../problemDetailStyles";
import type {
  ExecutionResult,
  ProblemHint,
  ProblemResultTab,
  RecommendedCourse,
  SubmissionResult,
} from "../types";
import ProblemCodeEditor from "./ProblemCodeEditor";
import ProblemResultPanel from "./ProblemResultPanel";

interface ProblemSolveSectionProps {
  activeTab: ProblemResultTab;
  className?: string;
  code: string;
  currentHints: ProblemHint[];
  currentProblemExplanation?: string;
  executionResult: ExecutionResult | null;
  hintEnabled: boolean;
  isCurrentProblemCorrect: boolean;
  isViewingExplanation: boolean;
  isSubmitting: boolean;
  onCodeChange: (nextCode: string) => void;
  onRecommendedCourseSelect?: (courseId: number) => void;
  onSubmit: () => void;
  onTabChange: (tab: ProblemResultTab) => void;
  recommendedCourses?: RecommendedCourse[];
  showHintToast: boolean;
  solutionEnabled: boolean;
  submissionResult: SubmissionResult | null;
  style?: CSSProperties;
}

function ProblemSolveSection({
  activeTab,
  className = "",
  code,
  currentHints,
  currentProblemExplanation,
  executionResult,
  hintEnabled,
  isCurrentProblemCorrect,
  isViewingExplanation,
  isSubmitting,
  onCodeChange,
  onRecommendedCourseSelect,
  onSubmit,
  onTabChange,
  recommendedCourses = [],
  showHintToast,
  solutionEnabled,
  submissionResult,
  style,
}: ProblemSolveSectionProps) {
  return (
    <section
      className={`${problemDetailClasses.solveBox} ${className}`}
      style={style}
    >
      <div className={problemDetailClasses.editorSection}>
        <h2>문제풀이 영역</h2>
        {showHintToast && (
          <div className={problemDetailClasses.hintToast}>
            힌트를 확인할 수 있습니다.
          </div>
        )}
        <ProblemCodeEditor code={code} onCodeChange={onCodeChange} />
      </div>

      <div
        aria-label="문제 풀이 결과 탭"
        className={problemDetailClasses.tabs}
        role="tablist"
      >
        <button
          aria-selected={activeTab === "result"}
          className={
            activeTab === "result" ? problemDetailClasses.activeTab : ""
          }
          onClick={() => onTabChange("result")}
          role="tab"
          type="button"
        >
          실행결과
        </button>
        <button
          aria-selected={activeTab === "recommendedCourses"}
          className={
            activeTab === "recommendedCourses"
              ? problemDetailClasses.activeTab
              : ""
          }
          onClick={() => onTabChange("recommendedCourses")}
          role="tab"
          type="button"
        >
          추천강좌
        </button>
        <button
          aria-selected={activeTab === "hint"}
          className={activeTab === "hint" ? problemDetailClasses.activeTab : ""}
          disabled={!hintEnabled}
          onClick={() => onTabChange("hint")}
          role="tab"
          type="button"
        >
          힌트
        </button>
        <button
          aria-selected={activeTab === "solution"}
          className={
            activeTab === "solution" ? problemDetailClasses.activeTab : ""
          }
          disabled={isViewingExplanation}
          onClick={() => onTabChange("solution")}
          role="tab"
          type="button"
        >
          {isViewingExplanation ? "해설 조회 중" : "해설보기"}
        </button>
      </div>

      <ProblemResultPanel
        activeTab={activeTab}
        currentHints={currentHints}
        currentProblemExplanation={currentProblemExplanation}
        executionResult={executionResult}
        onRecommendedCourseSelect={onRecommendedCourseSelect}
        recommendedCourses={recommendedCourses}
        submissionResult={submissionResult}
      />

      <div className={problemDetailClasses.submitWrap}>
        <button
          className={problemDetailClasses.submitButton}
          disabled={isSubmitting || isCurrentProblemCorrect}
          onClick={onSubmit}
          type="button"
        >
          {isCurrentProblemCorrect
            ? "제출 완료"
            : isSubmitting
              ? "제출 중"
              : "제출하기"}
        </button>
      </div>
    </section>
  );
}

export default memo(ProblemSolveSection);
