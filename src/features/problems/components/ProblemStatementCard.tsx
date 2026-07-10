"use client";

import { memo, useState } from "react";
import Image from "next/image";
import type { CSSProperties } from "react";

import { problemDetailClasses } from "../problemDetailStyles";

type StatementTab = "problem" | "overview";

interface ProblemStatementCardProps {
  className?: string;
  content?: string;
  isDownloadingDataset?: boolean;
  onDownloadDataset?: () => void;
  problemSetDescription?: string;
  problemSetTitle?: string;
  style?: CSSProperties;
}

function ProblemStatementCard({
  className = "",
  content,
  isDownloadingDataset = false,
  onDownloadDataset,
  problemSetDescription,
  problemSetTitle,
  style,
}: ProblemStatementCardProps) {
  const [activeTab, setActiveTab] = useState<StatementTab>("overview");
  const hasOverview = Boolean(problemSetTitle || problemSetDescription);

  return (
    <article
      className={`${problemDetailClasses.problemBox} ${className}`}
      style={style}
    >
      <div className={problemDetailClasses.problemHeader}>
        <h2>문제 내용</h2>
        {onDownloadDataset && (
          <button
            aria-label="CSV 다운로드"
            className={problemDetailClasses.datasetDownloadButton}
            disabled={isDownloadingDataset}
            onClick={onDownloadDataset}
            title="CSV 다운로드"
            type="button"
          >
            <Image
              alt=""
              height={18}
              src="/assets/img/download-Icon.svg"
              width={18}
            />
          </button>
        )}
      </div>
      {hasOverview && (
        <div
          aria-label="문제 내용 보기 방식"
          className={problemDetailClasses.statementTabs}
          role="tablist"
        >
          <button
            aria-selected={activeTab === "overview"}
            className={
              activeTab === "overview" ? problemDetailClasses.activeTab : ""
            }
            onClick={() => setActiveTab("overview")}
            role="tab"
            type="button"
          >
            문제 소개
          </button>
          <button
            aria-selected={activeTab === "problem"}
            className={
              activeTab === "problem" ? problemDetailClasses.activeTab : ""
            }
            onClick={() => setActiveTab("problem")}
            role="tab"
            type="button"
          >
            문제 내용
          </button>
        </div>
      )}
      {activeTab === "overview" && hasOverview ? (
        <div className={problemDetailClasses.problemSetOverview}>
          {problemSetTitle && <strong>{problemSetTitle}</strong>}
          {problemSetDescription && <p>{problemSetDescription}</p>}
        </div>
      ) : (
        <div className={problemDetailClasses.problemContent}>{content}</div>
      )}
    </article>
  );
}

export default memo(ProblemStatementCard);
