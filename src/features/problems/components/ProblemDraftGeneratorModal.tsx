"use client";

import type { ChangeEvent, RefObject } from "react";
import { useEffect } from "react";

import { DIFFICULTY_MAP } from "../actions";
import type { ProblemDraftForm } from "../problemDraftGenerationConstants";
import type { ProblemCategory, ProblemInfo } from "../types";
import { problemFormPageClasses } from "./ProblemRegister.styles";

interface ProblemDraftGeneratorModalProps {
  categories: ProblemCategory[];
  draftFileInputRef: RefObject<HTMLInputElement | null>;
  draftForm: ProblemDraftForm;
  file: File | null;
  isGeneratingDraft: boolean;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onDraftFormChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onFileChange: (file: File | null) => void;
  onGenerate: () => void;
  onProblemInfoChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  onRemoveFile: () => void;
  problemInfo: ProblemInfo;
}

export default function ProblemDraftGeneratorModal({
  categories,
  draftFileInputRef,
  draftForm,
  file,
  isGeneratingDraft,
  isOpen,
  isSubmitting,
  onClose,
  onDraftFormChange,
  onFileChange,
  onGenerate,
  onProblemInfoChange,
  onRemoveFile,
  problemInfo,
}: ProblemDraftGeneratorModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={problemFormPageClasses.draftModalOverlay} onClick={onClose}>
      <section
        aria-labelledby="problem-draft-generator-title"
        aria-modal="true"
        className={problemFormPageClasses.draftModalPanel}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className={problemFormPageClasses.draftModalHeader}>
          <div className={problemFormPageClasses.draftHeaderTextWrap}>
            <div className={problemFormPageClasses.draftTitleRow}>
              <h3
                className={problemFormPageClasses.draftTitle}
                id="problem-draft-generator-title"
              >
                AI 문제세트 초안 생성
              </h3>
            </div>
            <p className={problemFormPageClasses.draftDescription}>
              생성 방향, 주제, 난이도, 카테고리, CSV 파일을 기반으로 문제세트
              초안을 만듭니다.
              <br />
              초안은 저장되지 않으며 반영 후 기존 등록 버튼으로 최종 저장합니다.
            </p>
          </div>
          <button
            aria-label="닫기"
            className={problemFormPageClasses.draftCloseButton}
            onClick={onClose}
            type="button"
          >
            <svg
              fill="none"
              height="20"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.6"
              viewBox="0 0 20 20"
              width="20"
            >
              <path d="M15 5L5 15M5 5l10 10" />
            </svg>
          </button>
        </header>

        <div className={problemFormPageClasses.draftModalBody}>
          <section className={problemFormPageClasses.draftSection}>
            <h4 className={problemFormPageClasses.draftSectionTitle}>
              생성 방향
            </h4>
            <div className={problemFormPageClasses.draftGrid}>
              <div
                className={`${problemFormPageClasses.draftInputGroup} ${problemFormPageClasses.draftFull}`}
              >
                <label htmlFor="draftQuestion">문제 생성 방향 *</label>
                <textarea
                  id="draftQuestion"
                  name="question"
                  onChange={onDraftFormChange}
                  placeholder="예: 데이터 확인, 정제, 탐색, 모델 학습 순서로 실습형 문제를 만들어 주세요."
                  value={draftForm.question}
                />
                <p className={problemFormPageClasses.draftHelpText}>
                  관리자가 원하는 학습 흐름, 포함할 분석 단계, 주의할 채점
                  기준을 적어 주세요.
                </p>
              </div>

              <div
                className={`${problemFormPageClasses.draftInputGroup} ${problemFormPageClasses.draftFull}`}
              >
                <label htmlFor="draftTopic">문제 주제 *</label>
                <input
                  id="draftTopic"
                  name="topic"
                  onChange={onDraftFormChange}
                  placeholder="예: SW기술자 평균임금 분석"
                  value={draftForm.topic}
                />
              </div>
            </div>
          </section>

          <section className={problemFormPageClasses.draftSection}>
            <h4 className={problemFormPageClasses.draftSectionTitle}>
              생성 옵션
            </h4>
            <div className={problemFormPageClasses.draftGrid}>
              <div className={problemFormPageClasses.draftInputGroup}>
                <label htmlFor="draftCategoryId">카테고리 *</label>
                <select
                  id="draftCategoryId"
                  name="categoryId"
                  onChange={onProblemInfoChange}
                  value={problemInfo.categoryId}
                >
                  <option disabled value="">
                    카테고리 선택
                  </option>
                  {categories.map((category) => (
                    <option
                      key={category.categoryId}
                      value={category.categoryId}
                    >
                      {category.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              <div className={problemFormPageClasses.draftInputGroup}>
                <label htmlFor="draftDifficulty">난이도 *</label>
                <select
                  id="draftDifficulty"
                  name="difficulty"
                  onChange={onProblemInfoChange}
                  value={problemInfo.difficulty}
                >
                  {Object.entries(DIFFICULTY_MAP).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>

              <div className={problemFormPageClasses.draftInputGroup}>
                <label htmlFor="draftProblemCount">문제세트 수 *</label>
                <input
                  id="draftProblemCount"
                  min={1}
                  name="problemCount"
                  onChange={onDraftFormChange}
                  type="number"
                  value={draftForm.problemCount}
                />
              </div>

              <div className={problemFormPageClasses.draftInputGroup}>
                <label htmlFor="draftSubProblemCount">소문제 수 *</label>
                <input
                  id="draftSubProblemCount"
                  min={1}
                  name="subProblemCount"
                  onChange={onDraftFormChange}
                  type="number"
                  value={draftForm.subProblemCount}
                />
              </div>

              <div
                className={`${problemFormPageClasses.draftInputGroup} ${problemFormPageClasses.draftFull}`}
              >
                <label htmlFor="draftDatasetFile">데이터 파일 *</label>
                <div className={problemFormPageClasses.draftFileRow}>
                  <label
                    className={problemFormPageClasses.draftFileButton}
                    htmlFor="draftDatasetFile"
                  >
                    {file?.name || "파일 선택 (CSV)"}
                  </label>
                  <input
                    ref={draftFileInputRef}
                    accept=".csv,text/csv"
                    hidden
                    id="draftDatasetFile"
                    onChange={(event) =>
                      onFileChange(event.target.files?.[0] ?? null)
                    }
                    type="file"
                  />
                  <button
                    className={problemFormPageClasses.draftFileRemoveButton}
                    disabled={!file || isGeneratingDraft || isSubmitting}
                    onClick={onRemoveFile}
                    type="button"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        <footer className={problemFormPageClasses.draftModalFooter}>
          <button
            className={problemFormPageClasses.draftFooterCancelButton}
            onClick={onClose}
            type="button"
          >
            닫기
          </button>
          <button
            className={problemFormPageClasses.draftFooterPrimaryButton}
            disabled={isGeneratingDraft || isSubmitting}
            onClick={onGenerate}
            type="button"
          >
            {isGeneratingDraft ? (
              <>
                <span
                  aria-hidden="true"
                  className={problemFormPageClasses.draftButtonSpinner}
                />
                생성 중...
              </>
            ) : (
              "초안 생성"
            )}
          </button>
        </footer>
      </section>
    </div>
  );
}
