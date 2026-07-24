"use client";

import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  OneButtonModal,
  TwoButtonModal,
  WarningModal,
} from "@/components/common";
import { handleClientError } from "@/lib/errorHandling";

import {
  createProblem,
  createProblemRequestBody,
  getSelectableRecommendedCourses,
  INITIAL_PROBLEM_INFO,
  INITIAL_SUB_PROBLEM,
  updateProblemsRecommendedCourses,
} from "../actions";
import { useProblemDraftGeneration } from "../hooks/useProblemDraftGeneration";
import type {
  ProblemCategory,
  ProblemInfo,
  SelectableRecommendedCourse,
  SubProblem,
} from "../types";
import ProblemDraftGeneratorModal from "./ProblemDraftGeneratorModal";
import ProblemDraftPreviewModal from "./ProblemDraftPreviewModal";
import { problemFormPageClasses } from "./ProblemRegister.styles";
import RegisterForm from "./RegisterForm";

interface ProblemRegisterClientProps {
  initialCategories: ProblemCategory[];
}

const createInitialSubProblem = (): SubProblem => ({
  ...INITIAL_SUB_PROBLEM,
  testCases: INITIAL_SUB_PROBLEM.testCases.map((testCase) => ({ ...testCase })),
});

const createInitialTestCase = () => ({ ...INITIAL_SUB_PROBLEM.testCases[0] });

export default function ProblemRegisterClient({
  initialCategories,
}: ProblemRegisterClientProps) {
  const router = useRouter();
  const isSubmittingRef = useRef(false);

  const [problemInfo, setProblemInfo] = useState<ProblemInfo>({
    ...INITIAL_PROBLEM_INFO,
    categoryId: initialCategories[0]?.categoryId ?? "",
  });
  const [problems, setProblems] = useState<SubProblem[]>([
    createInitialSubProblem(),
  ]);
  const [file, setFile] = useState<File | null>(null);
  const [fileInputVersion, setFileInputVersion] = useState(0);
  const [selectableCourses, setSelectableCourses] = useState<
    SelectableRecommendedCourse[]
  >([]);
  const categories = initialCategories;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [openSuccessModal, setOpenSuccessModal] = useState(false);
  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [openValidationModal, setOpenValidationModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const {
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
  } = useProblemDraftGeneration({
    categories,
    file,
    problemInfo,
    setFile,
    setFileInputVersion,
    setProblemInfo,
    setProblems,
    showValidation: (message) => {
      setValidationMessage(message);
      setOpenValidationModal(true);
    },
  });

  useEffect(() => {
    let isMounted = true;

    const loadCourses = async () => {
      try {
        const courses = await getSelectableRecommendedCourses();

        if (isMounted) {
          setSelectableCourses(courses);
        }
      } catch (error) {
        console.error("추천 강좌 목록 조회 실패:", error);
      }
    };

    void loadCourses();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleProblemInfoChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;

    setProblemInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProblemChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;

    setProblems((prev) =>
      prev.map((problem, problemIndex) => {
        if (problemIndex !== index) {
          return problem;
        }

        if (name === "point") {
          const parsedValue = Number.parseInt(value, 10);

          return {
            ...problem,
            point: Number.isNaN(parsedValue) || parsedValue < 1 ? 1 : parsedValue,
          };
        }

        return {
          ...problem,
          [name]: value,
        };
      }),
    );
  };

  const handleTestCaseChange = (
    problemIndex: number,
    testCaseIndex: number,
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;

    setProblems((prev) =>
      prev.map((problem, currentProblemIndex) => {
        if (currentProblemIndex !== problemIndex) {
          return problem;
        }

        return {
          ...problem,
          testCases: problem.testCases.map((testCase, currentTestCaseIndex) => {
            if (currentTestCaseIndex !== testCaseIndex) {
              return testCase;
            }

            if (name === "isHidden") {
              return {
                ...testCase,
                isHidden: (event.target as HTMLInputElement).checked,
              };
            }

            if (name === "timeoutMs") {
              const parsedValue = Number.parseInt(value, 10);

              return {
                ...testCase,
                timeoutMs:
                  Number.isNaN(parsedValue) || parsedValue < 1 ? 1 : parsedValue,
              };
            }

            return {
              ...testCase,
              [name]: value,
            };
          }),
        };
      }),
    );
  };

  const handleRecommendedCourseChange = (
    problemIndex: number,
    courseIds: number[],
  ) => {
    setProblems((prev) =>
      prev.map((problem, currentIndex) => {
        if (currentIndex !== problemIndex) {
          return problem;
        }

        return {
          ...problem,
          recommendedCourseIds: getOrderedSelectedCourseIds(
            problem.recommendedCourseIds ?? [],
            courseIds,
          ),
        };
      }),
    );
  };

  const handleRecommendedCourseSearch = async (keyword: string) => {
    try {
      const courses = await getSelectableRecommendedCourses(keyword);
      setSelectableCourses((prev) => mergeSelectableCourses(prev, courses));
    } catch (error) {
      console.error("추천 강좌 검색 실패:", error);
    }
  };

  const handleAddProblem = () => {
    setProblems((prev) => [...prev, createInitialSubProblem()]);
  };

  const handleRemoveProblem = (index: number) => {
    setProblems((prev) =>
      prev.length === 1 ? prev : prev.filter((_, problemIndex) => problemIndex !== index),
    );
  };

  const handleAddTestCase = (problemIndex: number) => {
    setProblems((prev) =>
      prev.map((problem, currentProblemIndex) =>
        currentProblemIndex === problemIndex
          ? {
              ...problem,
              testCases: [...problem.testCases, createInitialTestCase()],
            }
          : problem,
      ),
    );
  };

  const handleRemoveTestCase = (problemIndex: number, testCaseIndex: number) => {
    setProblems((prev) =>
      prev.map((problem, currentProblemIndex) =>
        currentProblemIndex === problemIndex
          ? {
              ...problem,
              testCases:
                problem.testCases.length === 1
                  ? problem.testCases
                  : problem.testCases.filter((_, index) => index !== testCaseIndex),
            }
          : problem,
      ),
    );
  };

  const resetForm = () => {
    setProblemInfo({
      ...INITIAL_PROBLEM_INFO,
      categoryId: initialCategories[0]?.categoryId ?? "",
    });
    setProblems([createInitialSubProblem()]);
    setFile(null);
    setFileInputVersion((version) => version + 1);
  };

  const handleGoList = () => {
    resetForm();
    router.push("/admin/problems");
  };

  const validateForm = () => {
    if (!problemInfo.title.trim()) {
      return "문제명을 입력해 주세요.";
    }

    if (!problemInfo.categoryId) {
      return "카테고리를 선택해 주세요.";
    }

    if (!problemInfo.description.trim()) {
      return "문제 설명을 입력해 주세요.";
    }

    if (!file) {
      return "데이터 파일을 추가해 주세요.";
    }

    for (let index = 0; index < problems.length; index += 1) {
      const problem = problems[index];
      const label = `소문제 ${index + 1}`;

      if (!problem.questionTitle.trim()) {
        return `${label}의 문제 제목을 입력해 주세요.`;
      }

      if (!problem.context.trim()) {
        return `${label}의 문제 내용을 입력해 주세요.`;
      }

      if (!problem.hint.trim()) {
        return `${label}의 힌트를 입력해 주세요.`;
      }

      if (!problem.solution.trim()) {
        return `${label}의 해설을 입력해 주세요.`;
      }

      for (let testCaseIndex = 0; testCaseIndex < problem.testCases.length; testCaseIndex += 1) {
        const testCase = problem.testCases[testCaseIndex];
        const testCaseLabel = `${label} 테스트 ${testCaseIndex + 1}`;

        if (!testCase.testCode.trim()) {
          return `${testCaseLabel}의 테스트 코드를 입력해 주세요.`;
        }

        if (!testCase.timeoutMs || testCase.timeoutMs < 1) {
          return `${testCaseLabel}의 제한 시간을 입력해 주세요.`;
        }
      }
    }

    return null;
  };

  const handleOpenSubmitModal = () => {
    if (isSubmitting) {
      return;
    }

    const errorMessage = validateForm();

    if (errorMessage) {
      setValidationMessage(errorMessage);
      setOpenValidationModal(true);
      return;
    }

    setOpenConfirmModal(true);
  };

  const handleSubmit = async () => {
    if (isSubmittingRef.current || !file) {
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const requestBody = createProblemRequestBody(
        problemInfo,
        problems,
        file,
        categories,
      );

      const createResult = await createProblem(requestBody, file);
      const createdProblemIds = extractCreatedProblemIds(createResult);
      const hasRecommendedCourses = problems.some(
        (problem) => (problem.recommendedCourseIds?.length ?? 0) > 0,
      );

      if (hasRecommendedCourses && createdProblemIds.length < problems.length) {
        throw new Error("추천 강좌를 연결할 소문제 정보를 확인하지 못했습니다.");
      }

      const createdProblems = problems.map((problem, index) => ({
        ...problem,
        problemId: createdProblemIds[index],
      }));

      await updateProblemsRecommendedCourses(createdProblems, false);

      setOpenConfirmModal(false);
      setOpenSuccessModal(true);
    } catch (error) {
      setOpenConfirmModal(false);
      handleClientError(error, {
        router,
        fallbackTitle: "문제 등록 실패",
        fallbackMessage: "문제를 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        showModal: (title, content) => {
          setValidationMessage(content || title);
          setOpenValidationModal(true);
        },
      });
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <main className={problemFormPageClasses.container}>
      <div className={problemFormPageClasses.titleBar}>
        <h2 className={problemFormPageClasses.pageTitle}>문제 등록</h2>
        <button
          className={problemFormPageClasses.draftButton}
          disabled={isSubmitting}
          onClick={() => setDraftModalOpen(true)}
          type="button"
        >
          AI 초안 생성
        </button>
      </div>

      <RegisterForm
        categories={categories}
        file={file}
        key={fileInputVersion}
        onAddProblem={handleAddProblem}
        onAddTestCase={handleAddTestCase}
        onFileChange={setFile}
        onProblemChange={handleProblemChange}
        onProblemInfoChange={handleProblemInfoChange}
        onRecommendedCourseChange={handleRecommendedCourseChange}
        onRecommendedCourseSearch={handleRecommendedCourseSearch}
        onRemoveFile={handleRemoveDatasetFile}
        onRemoveProblem={handleRemoveProblem}
        onRemoveTestCase={handleRemoveTestCase}
        onTestCaseChange={handleTestCaseChange}
        problemInfo={problemInfo}
        problems={problems}
        selectableCourses={selectableCourses}
      />

      <div className={problemFormPageClasses.bottomButtonGroup}>
        <button
          className={problemFormPageClasses.submitButton}
          disabled={isSubmitting}
          onClick={handleOpenSubmitModal}
          type="button"
        >
          등록
        </button>
        <button
          className={problemFormPageClasses.cancelButton}
          disabled={isSubmitting}
          onClick={() => setOpenCancelModal(true)}
          type="button"
        >
          취소
        </button>
      </div>

      <TwoButtonModal
        cancelDisabled={isSubmitting}
        confirmDisabled={isSubmitting}
        isOpen={openConfirmModal}
        modalTitle="등록하시겠습니까?"
        onClose={() => {
          if (!isSubmitting) {
            setOpenConfirmModal(false);
          }
        }}
        onConfirm={handleSubmit}
      />

      <OneButtonModal
        isOpen={openSuccessModal}
        modalContent="문제가 등록되었습니다."
        modalTitle="등록 완료"
        onClose={handleGoList}
      />

      <OneButtonModal
        isOpen={openValidationModal}
        modalContent={validationMessage}
        modalTitle="확인해 주세요"
        onClose={() => setOpenValidationModal(false)}
      />

      <WarningModal
        isOpen={openCancelModal}
        modalContent="작성한 내용은 저장되지 않습니다."
        modalTitle="취소하시겠습니까?"
        onClose={() => setOpenCancelModal(false)}
        onConfirm={handleGoList}
      />

      <ProblemDraftPreviewModal
        draft={draftPreview}
        isApplying={isSubmitting}
        onApply={handleApplyDraft}
        onClose={closeDraftPreview}
      />
      <ProblemDraftGeneratorModal
        categories={categories}
        draftFileInputRef={draftFileInputRef}
        draftForm={draftForm}
        file={file}
        isGeneratingDraft={isGeneratingDraft}
        isOpen={draftModalOpen}
        isSubmitting={isSubmitting}
        onClose={() => setDraftModalOpen(false)}
        onDraftFormChange={handleDraftFormChange}
        onFileChange={setFile}
        onGenerate={() => void handleGenerateDraft()}
        onProblemInfoChange={handleProblemInfoChange}
        onRemoveFile={handleRemoveDatasetFile}
        problemInfo={problemInfo}
      />
    </main>
  );
}

function mergeSelectableCourses(
  prev: SelectableRecommendedCourse[],
  next: SelectableRecommendedCourse[],
) {
  const courseMap = new Map<number, SelectableRecommendedCourse>();

  [...prev, ...next].forEach((course) => {
    const existingCourse = courseMap.get(course.courseId);

    courseMap.set(course.courseId, {
      ...existingCourse,
      ...course,
      categoryId: course.categoryId ?? existingCourse?.categoryId,
      categoryName: course.categoryName ?? existingCourse?.categoryName,
    });
  });

  return Array.from(courseMap.values());
}

function getOrderedSelectedCourseIds(prevIds: number[], nextIds: number[]) {
  return [
    ...prevIds.filter((courseId) => nextIds.includes(courseId)),
    ...nextIds.filter((courseId) => !prevIds.includes(courseId)),
  ];
}

function extractCreatedProblemIds(response: unknown) {
  const payload = response as {
    data?: {
      problems?: Array<{ problemId?: number; id?: number }>;
      problemSet?: {
        problems?: Array<{ problemId?: number; id?: number }>;
      };
    };
    problemSet?: {
      problems?: Array<{ problemId?: number; id?: number }>;
    };
    problems?: Array<{ problemId?: number; id?: number }>;
  } | null;
  const problems =
    payload?.data?.problems ??
    payload?.data?.problemSet?.problems ??
    payload?.problems ??
    payload?.problemSet?.problems ??
    [];

  return problems.map((problem) => problem.problemId ?? problem.id);
}
