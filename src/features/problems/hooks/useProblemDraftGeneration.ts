import type {
  ChangeEvent,
  Dispatch,
  SetStateAction,
} from "react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { INITIAL_SUB_PROBLEM } from "../actions";
import { initialProblemDraftForm } from "../problemDraftGenerationConstants";
import {
  consumeProblemDraftGeneration,
  getProblemDraftGenerationServerSnapshot,
  getProblemDraftGenerationSnapshot,
  startProblemDraftGeneration,
  subscribeProblemDraftGeneration,
} from "../problemDraftGenerationStore";
import type {
  ProblemCategory,
  ProblemInfo,
  ProblemSetDraft,
  SubProblem,
} from "../types";

interface UseProblemDraftGenerationParams {
  categories: ProblemCategory[];
  file: File | null;
  problemInfo: ProblemInfo;
  setFile: Dispatch<SetStateAction<File | null>>;
  setFileInputVersion: Dispatch<SetStateAction<number>>;
  setProblemInfo: Dispatch<SetStateAction<ProblemInfo>>;
  setProblems: Dispatch<SetStateAction<SubProblem[]>>;
  showValidation: (message: string) => void;
}

const createInitialSubProblem = (): SubProblem => ({
  ...INITIAL_SUB_PROBLEM,
  testCases: INITIAL_SUB_PROBLEM.testCases.map((testCase) => ({ ...testCase })),
});

export function useProblemDraftGeneration({
  categories,
  file,
  problemInfo,
  setFile,
  setFileInputVersion,
  setProblemInfo,
  setProblems,
  showValidation,
}: UseProblemDraftGenerationParams) {
  const draftFileInputRef = useRef<HTMLInputElement>(null);

  const [draftForm, setDraftForm] = useState(initialProblemDraftForm);
  const [draftPreview, setDraftPreview] = useState<ProblemSetDraft | null>(null);
  const [draftPreviewFile, setDraftPreviewFile] = useState<File | null>(null);
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const draftGenerationJob = useSyncExternalStore(
    subscribeProblemDraftGeneration,
    getProblemDraftGenerationSnapshot,
    getProblemDraftGenerationServerSnapshot,
  );
  const isGeneratingDraft = draftGenerationJob?.status === "running";
  const selectedCategory = categories.find(
    (category) => String(category.categoryId) === String(problemInfo.categoryId),
  );

  useEffect(() => {
    if (draftGenerationJob?.status !== "success") {
      return;
    }

    const previewTimer = window.setTimeout(() => {
      const result = consumeProblemDraftGeneration(draftGenerationJob.id);

      if (result) {
        setDraftPreview(result.draft);
        setDraftPreviewFile(result.file);
      }
    }, 0);

    return () => window.clearTimeout(previewTimer);
  }, [draftGenerationJob?.id, draftGenerationJob?.status]);

  const handleDraftFormChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;

    setDraftForm((prev) => {
      if (name === "problemCount" || name === "subProblemCount") {
        const parsedValue = Number.parseInt(value, 10);

        return {
          ...prev,
          [name]: Number.isNaN(parsedValue) || parsedValue < 1 ? 1 : parsedValue,
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handleRemoveDatasetFile = () => {
    if (draftFileInputRef.current) {
      draftFileInputRef.current.value = "";
    }

    setFile(null);
    setFileInputVersion((version) => version + 1);
  };

  const validateDraftForm = () => {
    if (!draftForm.question.trim()) {
      return "문제 생성 방향을 입력해 주세요.";
    }

    if (!draftForm.topic.trim()) {
      return "문제 주제를 입력해 주세요.";
    }

    if (!problemInfo.categoryId || !selectedCategory) {
      return "카테고리를 선택해 주세요.";
    }

    if (!file) {
      return "초안 생성에 사용할 데이터 파일을 선택해 주세요.";
    }

    return null;
  };

  const handleGenerateDraft = () => {
    if (isGeneratingDraft) {
      return;
    }

    const errorMessage = validateDraftForm();

    if (errorMessage) {
      showValidation(errorMessage);
      return;
    }

    if (!file || !selectedCategory) {
      return;
    }

    startProblemDraftGeneration({
      file,
      requestBody: {
        categoryName: selectedCategory.categoryName,
        dataFileName: file.name,
        difficulty: problemInfo.difficulty,
        problemCount: draftForm.problemCount,
        question: draftForm.question.trim(),
        subProblemCount: draftForm.subProblemCount,
        topic: draftForm.topic.trim(),
      },
      targetPath: "/admin/problems/new",
    });
    setDraftModalOpen(false);
  };

  const handleApplyDraft = () => {
    if (!draftPreview) {
      return;
    }

    const draftCategory = categories.find(
      (category) => category.categoryName === draftPreview.categoryName,
    );

    setProblemInfo((prev) => ({
      ...prev,
      categoryId: draftCategory?.categoryId ?? prev.categoryId,
      description: draftPreview.description || prev.description,
      difficulty: draftPreview.difficulty ?? prev.difficulty,
      title: draftPreview.title || prev.title,
    }));
    setProblems(
      draftPreview.problems.length > 0
        ? draftPreview.problems.map((problem) => ({
            context: problem.content,
            hint: problem.hint,
            point: problem.point,
            questionTitle: problem.title,
            recommendedCourseIds: [],
            solution: problem.explanation,
            startCode: problem.startCode,
            testCases: problem.testCases.map((testCase) => ({
              isHidden: testCase.isHidden,
              testCode: testCase.testCode,
              timeoutMs:
                testCase.timeoutMs > 1000
                  ? Math.max(1, Math.round(testCase.timeoutMs / 1000))
                  : testCase.timeoutMs,
            })),
          }))
        : [createInitialSubProblem()],
    );
    setFile(draftPreviewFile);
    setFileInputVersion((version) => version + 1);
    closeDraftPreview();
  };

  const closeDraftPreview = () => {
    setDraftPreview(null);
    setDraftPreviewFile(null);
  };

  return {
    closeDraftPreview,
    draftFileInputRef,
    draftForm,
    draftModalOpen,
    draftPreview,
    handleApplyDraft,
    handleDraftFormChange,
    handleGenerateDraft,
    handleRemoveDatasetFile,
    isGeneratingDraft,
    setDraftModalOpen,
  };
}
