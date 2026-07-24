import type { ProblemSetDraft } from "../types";
import { problemFormPageClasses } from "./ProblemRegister.styles";

interface ProblemDraftPreviewModalProps {
  draft: ProblemSetDraft | null;
  isApplying: boolean;
  onApply: () => void;
  onClose: () => void;
}

export default function ProblemDraftPreviewModal({
  draft,
  isApplying,
  onApply,
  onClose,
}: ProblemDraftPreviewModalProps) {
  if (!draft) {
    return null;
  }

  return (
    <div className={problemFormPageClasses.draftPreviewOverlay}>
      <section
        aria-labelledby="problem-draft-preview-title"
        aria-modal="true"
        className={problemFormPageClasses.draftPreviewPanel}
        role="dialog"
      >
        <header className={problemFormPageClasses.draftModalHeader}>
          <div className={problemFormPageClasses.draftHeaderTextWrap}>
            <div className={problemFormPageClasses.draftTitleRow}>
              <h3
                className={problemFormPageClasses.draftTitle}
                id="problem-draft-preview-title"
              >
                생성된 문제세트 초안
              </h3>
            </div>
            <p className={problemFormPageClasses.draftDescription}>
              내용을 확인한 뒤 반영하기를 누르면 문제 등록 폼에 채워집니다.
            </p>
          </div>
          <button
            aria-label="닫기"
            className={problemFormPageClasses.draftCloseButton}
            disabled={isApplying}
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
          {draft.answer && (
            <section className={problemFormPageClasses.draftAnswerBox}>
              <h4 className={problemFormPageClasses.draftAnswerTitle}>
                AI 생성 요약
              </h4>
              <p className={problemFormPageClasses.draftAnswerText}>
                {draft.answer}
              </p>
              {draft.usedTools && draft.usedTools.length > 0 && (
                <div className={problemFormPageClasses.draftMeta}>
                  {draft.usedTools.map((tool) => (
                    <span
                      className={problemFormPageClasses.draftBadge}
                      key={tool}
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              )}
            </section>
          )}

          <div className={problemFormPageClasses.draftProblemItem}>
            <h4 className={problemFormPageClasses.draftProblemTitle}>
              {draft.title || "제목 없음"}
            </h4>
            <p className={problemFormPageClasses.draftProblemText}>
              {draft.description || "설명 없음"}
            </p>
            <div className={problemFormPageClasses.draftMeta}>
              {draft.categoryName && (
                <span className={problemFormPageClasses.draftBadge}>
                  {draft.categoryName}
                </span>
              )}
              {draft.difficulty && (
                <span className={problemFormPageClasses.draftBadge}>
                  {draft.difficulty}
                </span>
              )}
              {draft.dataFileName && (
                <span className={problemFormPageClasses.draftBadge}>
                  {draft.dataFileName}
                </span>
              )}
            </div>
          </div>

          <ul className={problemFormPageClasses.draftProblemList}>
            {draft.problems.map((problem, index) => (
              <li
                className={problemFormPageClasses.draftProblemItem}
                key={`${problem.title}-${index}`}
              >
                <h4 className={problemFormPageClasses.draftProblemTitle}>
                  소문제 {index + 1}. {problem.title || "제목 없음"}
                </h4>
                <p className={problemFormPageClasses.draftProblemText}>
                  {problem.content || "내용 없음"}
                </p>
                {problem.startCode && (
                  <>
                    <div className={problemFormPageClasses.draftFieldLabel}>
                      시작 코드
                    </div>
                    <pre className={problemFormPageClasses.draftCodeBlock}>
                      {problem.startCode}
                    </pre>
                  </>
                )}
                <div className={problemFormPageClasses.draftFieldLabel}>
                  힌트
                </div>
                <p className={problemFormPageClasses.draftProblemText}>
                  {problem.hint || "힌트 없음"}
                </p>
                <div className={problemFormPageClasses.draftFieldLabel}>
                  해설
                </div>
                <p className={problemFormPageClasses.draftProblemText}>
                  {problem.explanation || "해설 없음"}
                </p>
                {problem.testCases.length > 0 && (
                  <>
                    <div className={problemFormPageClasses.draftFieldLabel}>
                      테스트 케이스
                    </div>
                    {problem.testCases.map((testCase, testCaseIndex) => (
                      <div
                        className={problemFormPageClasses.draftCodeBlock}
                        key={`${problem.title}-test-${testCaseIndex}`}
                      >
                        <div>
                          케이스 {testCaseIndex + 1} · 제한 시간{" "}
                          {testCase.timeoutMs}
                          초 · {testCase.isHidden ? "숨김" : "공개"}
                        </div>
                        <pre className="m-0 mt-2 whitespace-pre-wrap">
                          {testCase.testCode || "테스트 코드 없음"}
                        </pre>
                      </div>
                    ))}
                  </>
                )}
                <div className={problemFormPageClasses.draftMeta}>
                  <span className={problemFormPageClasses.draftBadge}>
                    {problem.point}점
                  </span>
                  <span className={problemFormPageClasses.draftBadge}>
                    테스트 {problem.testCases.length}개
                  </span>
                  <span className={problemFormPageClasses.draftBadge}>
                    힌트 {problem.hint ? "있음" : "없음"}
                  </span>
                  <span className={problemFormPageClasses.draftBadge}>
                    해설 {problem.explanation ? "있음" : "없음"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <footer className={problemFormPageClasses.draftModalFooter}>
          <button
            className={problemFormPageClasses.draftFooterCancelButton}
            disabled={isApplying}
            onClick={onClose}
            type="button"
          >
            닫기
          </button>
          <button
            className={problemFormPageClasses.draftFooterPrimaryButton}
            disabled={isApplying}
            onClick={onApply}
            type="button"
          >
            반영하기
          </button>
        </footer>
      </section>
    </div>
  );
}
