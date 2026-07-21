"use client";

import { memo, useRef, useState } from "react";
import Image from "next/image";
import type { CSSProperties, KeyboardEvent, ReactNode } from "react";

import { problemDetailClasses } from "../problemDetailStyles";

type StatementTab = "problem" | "overview";

const STATEMENT_TABS: Array<{
  id: StatementTab;
  label: string;
}> = [
  { id: "overview", label: "문제 소개" },
  { id: "problem", label: "문제 내용" },
];

interface ProblemStatementCardProps {
  className?: string;
  content?: string;
  isDownloadingDataset?: boolean;
  onDownloadDataset?: () => void;
  problemSetDescription?: string;
  problemSetTitle?: string;
  problemListSlot?: ReactNode;
  style?: CSSProperties;
}

function ProblemStatementCard({
  className = "",
  content,
  isDownloadingDataset = false,
  onDownloadDataset,
  problemSetDescription,
  problemSetTitle,
  problemListSlot,
  style,
}: ProblemStatementCardProps) {
  const [activeTab, setActiveTab] = useState<StatementTab>("overview");
  const tabRefs = useRef<Record<StatementTab, HTMLButtonElement | null>>({
    overview: null,
    problem: null,
  });
  const hasOverview = Boolean(problemSetTitle || problemSetDescription);
  const activeTabIndex = STATEMENT_TABS.findIndex(
    (tab) => tab.id === activeTab,
  );

  const selectTab = (tab: StatementTab) => {
    setActiveTab(tab);
    tabRefs.current[tab]?.focus();
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    event.preventDefault();

    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex =
      (activeTabIndex + direction + STATEMENT_TABS.length) %
      STATEMENT_TABS.length;

    selectTab(STATEMENT_TABS[nextIndex].id);
  };

  return (
    <article
      className={`${problemDetailClasses.problemBox} ${className}`}
      style={style}
    >
      {problemListSlot}
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
            <span
              aria-hidden="true"
              className={problemDetailClasses.datasetDownloadIcon}
            >
              <Image
                alt=""
                height={18}
                src="/assets/img/download-Icon.svg"
                width={18}
              />
            </span>
            <span className={problemDetailClasses.datasetDownloadText}>
              CSV파일 다운로드
            </span>
          </button>
        )}
      </div>
      {hasOverview && (
        <div
          aria-label="문제 내용 보기 방식"
          className={problemDetailClasses.statementTabs}
          role="tablist"
        >
          {STATEMENT_TABS.map((tab) => (
            <button
              aria-controls={`problem-statement-${tab.id}-panel`}
              aria-selected={activeTab === tab.id}
              className={
                activeTab === tab.id ? problemDetailClasses.activeTab : ""
              }
              id={`problem-statement-${tab.id}-tab`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={handleTabKeyDown}
              ref={(element) => {
                tabRefs.current[tab.id] = element;
              }}
              role="tab"
              tabIndex={activeTab === tab.id ? 0 : -1}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
      {activeTab === "overview" && hasOverview ? (
        <div
          aria-labelledby="problem-statement-overview-tab"
          className={problemDetailClasses.problemSetOverview}
          id="problem-statement-overview-panel"
          role="tabpanel"
        >
          {problemSetTitle && <strong>{problemSetTitle}</strong>}
          {problemSetDescription && <p>{problemSetDescription}</p>}
        </div>
      ) : (
        <div
          aria-labelledby={
            hasOverview ? "problem-statement-problem-tab" : undefined
          }
          className={problemDetailClasses.problemContent}
          id={hasOverview ? "problem-statement-problem-panel" : undefined}
          role={hasOverview ? "tabpanel" : undefined}
        >
          {content}
        </div>
      )}
    </article>
  );
}

export default memo(ProblemStatementCard);
