"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { optimizedImageProps } from "@/components/common/imageOptimization";
import { deleteCourse } from "@/features/course/actions";
import {
  getCourseLearningProgress,
  getStudentProblemSet,
} from "@/features/course/progressActions";
import { getCourseProblemSets } from "@/features/course/problemSetActions";
import { OPERATOR_COURSE_PROGRESS_COLUMN_LABELS } from "@/features/course/constants";
import { resolveThumbnailUrl } from "@/features/course/http";
import type {
  CourseDetail,
  LectureSummary,
  StudentLearningProgress,
  StudentLearningProgressPage,
  StudentProblemEntry,
} from "@/features/course/types";
import OneButtonModal from "@/components/common/OneButtonModal";
import TwoButtonModal from "@/components/common/TwoButtonModal";
import List, { type ListColumn } from "@/components/common/List";
import ListSkeleton from "@/components/common/ListSkeleton";
import LoadingIndicator from "@/components/common/LoadingIndicator";
import Pagination from "@/components/common/Pagination";

interface OperatorCourseDetailClientProps {
  courseId: string;
  course: CourseDetail;
  lectures: LectureSummary[];
}

const outlineBtn =
  "px-4 py-2 text-sm font-medium bg-white text-blue-900 border border-blue-900 rounded-lg cursor-pointer hover:bg-blue-900 hover:text-white transition-colors whitespace-nowrap";

const STATUS_LABEL: Record<string, string> = {
  CORRECT: "정답",
  WRONG: "오답",
  UNSOLVED: "미제출",
};

export default function OperatorCourseDetailClient({
  courseId,
  course,
  lectures,
}: OperatorCourseDetailClientProps) {
  const router = useRouter();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 학습률 모달
  const [showProgress, setShowProgress] = useState(false);
  const [progressPage, setProgressPage] =
    useState<StudentLearningProgressPage | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [progressLoading, setProgressLoading] = useState(false);

  // 문제 풀이 현황 모달
  const [problemModal, setProblemModal] = useState<{
    studentName: string;
    entries: StudentProblemEntry[];
  } | null>(null);
  const [problemLoading, setProblemLoading] = useState(false);
  const [problemError, setProblemError] = useState<string | null>(null);

  const [resultModal, setResultModal] = useState<{
    title: string;
    content: string;
    redirect?: string;
  } | null>(null);

  const progressColumns: ListColumn<StudentLearningProgress>[] = [
    { key: "index", label: OPERATOR_COURSE_PROGRESS_COLUMN_LABELS[0] },
    { key: "studentName", label: OPERATOR_COURSE_PROGRESS_COLUMN_LABELS[1] },
    {
      key: "lecture",
      label: OPERATOR_COURSE_PROGRESS_COLUMN_LABELS[2],
      render: (item) =>
        `${item.completedLectureCount}/${item.totalLectureCount} ${item.lectureProgressRate}%`,
    },
    {
      key: "problem",
      label: OPERATOR_COURSE_PROGRESS_COLUMN_LABELS[3],
      render: (item) =>
        `${item.completedProblemCount}/${item.totalProblemCount} 개`,
    },
    {
      key: "action",
      label: OPERATOR_COURSE_PROGRESS_COLUMN_LABELS[4],
      render: (item) => (
        <button
          type="button"
          onClick={() => handleProblemClick(item)}
          className="px-3 py-1 text-xs font-medium text-blue-900 border border-blue-900 rounded-md hover:bg-blue-900 hover:text-white transition-colors cursor-pointer"
        >
          이동하기
        </button>
      ),
    },
  ];

  const handleLectureClick = (lectureId: number) => {
    router.push(`/courses/${courseId}/lectures/${lectureId}`);
  };

  const handleEditClick = () => {
    router.push(`/admin/courses/${courseId}/edit`);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteCourse(courseId);
      setShowDeleteConfirm(false);
      setResultModal({
        title: "삭제 완료",
        content: "강좌가 삭제되었습니다.",
        redirect: "/admin/courses",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "오류가 발생했습니다.";
      setShowDeleteConfirm(false);
      setResultModal({ title: "삭제 실패", content: msg });
    } finally {
      setIsDeleting(false);
    }
  };

  const loadProgress = async (page: number) => {
    setProgressLoading(true);
    try {
      const data = await getCourseLearningProgress(courseId, page);
      setProgressPage(data);
      setCurrentPage(page);
    } catch {
      /* ignore */
    } finally {
      setProgressLoading(false);
    }
  };

  const handleProgressClick = async () => {
    setShowProgress(true);
    if (progressPage && currentPage === 0) return;
    await loadProgress(0);
  };

  const handlePageChange = async (page: number) => {
    await loadProgress(page);
  };

  const handleProblemClick = async (student: StudentLearningProgress) => {
    setProblemLoading(true);
    setProblemError(null);
    setProblemModal({ studentName: student.studentName, entries: [] });

    try {
      const links = await getCourseProblemSets(courseId);
      const ids = links
        .map((l) => l.lectureProblemSetId)
        .filter((id): id is number => id != null);

      if (ids.length === 0) {
        setProblemError("이 강좌에 연결된 문제세트가 없습니다.");
        return;
      }

      const entries = await Promise.all(
        ids.map((id) => getStudentProblemSet(courseId, student.userId, id)),
      );

      setProblemModal({ studentName: student.studentName, entries });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "불러오지 못했습니다.";
      setProblemError(msg);
    } finally {
      setProblemLoading(false);
    }
  };

  const handleResultClose = () => {
    const redirect = resultModal?.redirect;
    setResultModal(null);
    if (redirect) router.push(redirect);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-8">
          <div className="relative w-full h-72 bg-gray-100 flex items-center justify-center overflow-hidden">
            {course.thumbnailUrl ? (
              <Image
                src={resolveThumbnailUrl(course.thumbnailUrl)}
                alt={course.title}
                className="w-full h-full object-cover"
                fill
                sizes="(max-width: 896px) 100vw, 896px"
                {...optimizedImageProps}
              />
            ) : (
              <svg width="64" height="64" viewBox="0 0 56 56" fill="none">
                <rect
                  x="4"
                  y="10"
                  width="48"
                  height="36"
                  rx="4"
                  stroke="#9CA3AF"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M4 38l13-14 10 10 8-8 17 18"
                  stroke="#9CA3AF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <circle cx="18" cy="24" r="4" fill="#9CA3AF" />
              </svg>
            )}
          </div>

          <div className="p-6">
            {course.instructorName && (
              <p className="text-sm text-gray-500 mb-1">
                강사: {course.instructorName}
              </p>
            )}

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-gray-800 mb-2">
                  {course.title}
                </h1>
                <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">
                  {course.description}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 mt-1">
                <button
                  type="button"
                  onClick={handleProgressClick}
                  className={outlineBtn}
                >
                  학습률 조회하기
                </button>
                <button
                  type="button"
                  onClick={handleEditClick}
                  className={outlineBtn}
                >
                  수정하기
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 text-sm font-medium bg-white text-red-500 border border-red-500 rounded-lg cursor-pointer hover:bg-red-500 hover:text-white transition-colors whitespace-nowrap"
                >
                  삭제하기
                </button>
              </div>
            </div>
          </div>
        </div>

        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">커리큘럼</h2>

          {lectures.length === 0 ? (
            <div className="border border-gray-200 rounded-lg py-12 text-center text-sm text-gray-400">
              등록된 강의가 없습니다.
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {lectures.map((lecture, index) => (
                <button
                  key={lecture.lectureId}
                  type="button"
                  onClick={() => handleLectureClick(lecture.lectureId)}
                  className={[
                    "w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer hover:bg-gray-100 transition-colors",
                    index < lectures.length - 1
                      ? "border-b border-gray-200"
                      : "",
                  ].join(" ")}
                >
                  <span className="text-base text-gray-800">
                    {lecture.lectureOrder}주차: {lecture.title}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="#6B7280"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 4l4 4-4 4" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      <TwoButtonModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        confirmDisabled={isDeleting}
        modalTitle="강좌 삭제"
        modalContent="삭제하면 복구할 수 없습니다. 삭제하시겠습니까?"
      />

      {/* 학습률 모달 */}
      {showProgress && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-screen flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                수강생 학습 현황
              </h3>
              <button
                type="button"
                onClick={() => setShowProgress(false)}
                className="text-gray-500 hover:text-gray-800 transition-colors"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                >
                  <path d="M15 5L5 15M5 5l10 10" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4">
              {progressLoading ? (
                <ListSkeleton
                  columns={[...OPERATOR_COURSE_PROGRESS_COLUMN_LABELS]}
                  rowCount={5}
                  statusMessage="학습 현황을 불러오는 중입니다."
                />
              ) : (
                <List
                  data={progressPage?.content ?? []}
                  columns={progressColumns}
                  emptyMessage="수강생 데이터가 없습니다."
                  rowKey={(item) => item.userId}
                  rowNumberOffset={
                    (progressPage?.page ?? currentPage) *
                    (progressPage?.size ?? 0)
                  }
                />
              )}
            </div>

            {!progressLoading && (progressPage?.totalPages ?? 0) > 1 && (
              <div className="px-6 py-3 border-t border-gray-100">
                <Pagination
                  currentPage={currentPage}
                  totalPages={progressPage?.totalPages ?? 1}
                  onPageChange={handlePageChange}
                  disabled={progressLoading}
                />
              </div>
            )}

            <div className="flex justify-end px-6 py-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowProgress(false)}
                className="px-5 py-2.5 text-sm text-white bg-blue-900 rounded-lg hover:bg-blue-950 transition-colors font-medium"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 문제 풀이 현황 모달 */}
      {problemModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  문제 풀이 현황
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {problemModal.studentName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setProblemModal(null);
                  setProblemError(null);
                }}
                className="text-gray-500 hover:text-gray-800 transition-colors"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                >
                  <path d="M15 5L5 15M5 5l10 10" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              {problemLoading ? (
                <LoadingIndicator message="문제 풀이 현황을 불러오는 중입니다." />
              ) : problemError ? (
                <p className="text-center text-sm text-red-500 py-8">
                  {problemError}
                </p>
              ) : problemModal.entries.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">
                  문제 풀이 데이터가 없습니다.
                </p>
              ) : (
                <div className="space-y-6">
                  {problemModal.entries.map((entry, i) => (
                    <div key={i}>
                      {entry.title && (
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">
                          {entry.title}
                        </h4>
                      )}
                      {entry.problems.length === 0 ? (
                        <p className="text-sm text-gray-400">
                          문제가 없습니다.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {entry.problems.map((problem, j) => (
                            <li
                              key={problem.problemId}
                              className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden"
                            >
                              <div className="flex items-center justify-between px-4 py-3">
                                <span className="text-sm text-gray-700">
                                  {j + 1}. {problem.title}
                                </span>
                                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white border border-gray-200">
                                  {STATUS_LABEL[problem.status] ??
                                    problem.status}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end px-6 py-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setProblemModal(null);
                  setProblemError(null);
                }}
                className="px-5 py-2.5 text-sm text-white bg-blue-900 rounded-lg hover:bg-blue-950 transition-colors font-medium"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      <OneButtonModal
        isOpen={!!resultModal}
        onClose={handleResultClose}
        modalTitle={resultModal?.title ?? ""}
        modalContent={resultModal?.content}
      />
    </div>
  );
}
