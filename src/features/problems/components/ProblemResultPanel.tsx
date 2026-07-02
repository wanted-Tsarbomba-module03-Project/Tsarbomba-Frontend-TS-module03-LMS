"use client";

// CSR - 문제풀이 결과 패널: 실행/제출 결과와 힌트/해설 탭이 풀이 상태에 따라 즉시 전환됨
import { useState } from "react";
import Image from "next/image";

import { optimizedImageProps } from "@/components/common/imageOptimization";
import type {
  ExecutionResult,
  ProblemHint,
  ProblemResultTab,
  RecommendedCourse,
  SubmissionResult,
} from "../types";
import { problemDetailClasses } from "../problemDetailStyles";

interface ProblemResultPanelProps {
  activeTab: ProblemResultTab;
  currentHints: ProblemHint[];
  currentProblemExplanation?: string;
  executionResult: ExecutionResult | null;
  onRecommendedCourseSelect?: (courseId: number) => void;
  recommendedCourses?: RecommendedCourse[];
  submissionResult: SubmissionResult | null;
}

export default function ProblemResultPanel({
  activeTab,
  currentHints,
  currentProblemExplanation,
  executionResult,
  onRecommendedCourseSelect,
  recommendedCourses = [],
  submissionResult,
}: ProblemResultPanelProps) {
  if (activeTab === "hint") {
    return (
      <div className={problemDetailClasses.bottomPanel}>
        {currentHints.length
          ? currentHints.map((hint) => (
              <p key={hint.hintId}>{hint.hintContent}</p>
            ))
          : "힌트가 없습니다."}
      </div>
    );
  }

  if (activeTab === "solution") {
    return (
      <div className={problemDetailClasses.bottomPanel}>
        {submissionResult?.explanation ??
          currentProblemExplanation ??
          "해설이 없습니다."}
      </div>
    );
  }

  if (activeTab === "recommendedCourses") {
    return (
      <div className={problemDetailClasses.bottomPanel}>
        <RecommendedCourseView
          courses={recommendedCourses}
          onRecommendedCourseSelect={onRecommendedCourseSelect}
        />
      </div>
    );
  }

  return (
    <div className={problemDetailClasses.bottomPanel}>
      {submissionResult ? (
        <SubmissionResultView submissionResult={submissionResult} />
      ) : executionResult ? (
        <ExecutionResultView executionResult={executionResult} />
      ) : (
        ""
      )}
    </div>
  );
}

function RecommendedCourseView({
  courses,
  onRecommendedCourseSelect,
}: {
  courses: RecommendedCourse[];
  onRecommendedCourseSelect?: (courseId: number) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const safeActiveIndex = courses.length ? activeIndex % courses.length : 0;
  const activeCourse = courses.length ? courses[safeActiveIndex] : null;

  if (!activeCourse) {
    return <p className={problemDetailClasses.emptyRecommendedCourse}>추천 강좌가 없습니다.</p>;
  }

  return (
    <div className={problemDetailClasses.recommendedCourseWrap}>
      <button
        className={problemDetailClasses.recommendedCourseCard}
        onClick={() => onRecommendedCourseSelect?.(activeCourse.courseId)}
        title={`${activeCourse.title}${
          activeCourse.description ? `\n${activeCourse.description}` : ""
        }`}
        type="button"
      >
        <div className={problemDetailClasses.recommendedCourseThumb}>
          {activeCourse.thumbnailUrl && (
            <Image
              alt=""
              className="object-cover"
              fill
              sizes="132px"
              src={activeCourse.thumbnailUrl}
              {...optimizedImageProps}
            />
          )}
        </div>
        <div className={problemDetailClasses.recommendedCourseText}>
          <strong>{activeCourse.title}</strong>
          {activeCourse.description && <span>{activeCourse.description}</span>}
        </div>
      </button>

      {courses.length > 1 && (
        <div className={problemDetailClasses.recommendedCourseControls}>
          <button
            onClick={() =>
              setActiveIndex((prev) => (prev - 1 + courses.length) % courses.length)
            }
            type="button"
          >
            이전
          </button>
          <span>
            {safeActiveIndex + 1} / {courses.length}
          </span>
          <button
            onClick={() => setActiveIndex((prev) => (prev + 1) % courses.length)}
            type="button"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}

function SubmissionResultView({
  submissionResult,
}: {
  submissionResult: SubmissionResult;
}) {
  const hasTestCount =
    typeof submissionResult.passedTestCount === "number" ||
    typeof submissionResult.totalTestCount === "number";

  return (
    <>
      <p>채점 결과: {submissionResult.isCorrect ? "정답" : "오답"}</p>
      {hasTestCount && (
        <p>
          통과 테스트: {submissionResult.passedTestCount ?? 0}/
          {submissionResult.totalTestCount ?? 0}
        </p>
      )}
      {submissionResult.submittedAt && (
        <p>제출 시간: {formatSubmittedAt(submissionResult.submittedAt)}</p>
      )}
      {submissionResult.executionStatus && (
        <p>실행 상태: {submissionResult.executionStatus}</p>
      )}
      {submissionResult.explanation && <p>{submissionResult.explanation}</p>}
      {submissionResult.errorMessage && (
        <pre className={problemDetailClasses.executionError}>
          {submissionResult.errorMessage}
        </pre>
      )}
    </>
  );
}

function formatSubmittedAt(value: string) {
  const normalizedValue = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function ExecutionResultView({
  executionResult,
}: {
  executionResult: ExecutionResult;
}) {
  const output =
    executionResult.output ??
    executionResult.stdout ??
    executionResult.result ??
    executionResult.message;
  const error = executionResult.errorMessage ?? executionResult.stderr;

  return (
    <>
      {executionResult.executionStatus && (
        <p>실행 상태: {executionResult.executionStatus}</p>
      )}
      {output && (
        <pre className={problemDetailClasses.executionOutput}>{output}</pre>
      )}
      {error && (
        <pre className={problemDetailClasses.executionError}>{error}</pre>
      )}
      {!executionResult.executionStatus && !output && !error && (
        <pre className={problemDetailClasses.executionOutput}>
          {JSON.stringify(executionResult, null, 2)}
        </pre>
      )}
    </>
  );
}
