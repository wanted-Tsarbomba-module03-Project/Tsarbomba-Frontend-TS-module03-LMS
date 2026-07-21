"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { optimizedImageProps } from "@/components/common/imageOptimization";
import { deleteCourse } from "@/features/course/actions";
import {
  enrollCourse,
  getMyEnrollments,
} from "@/features/course/enrollmentActions";
import { COURSE_PROGRESS_COLUMN_LABELS } from "@/features/course/constants";
import { getCourseLearningProgress } from "@/features/course/progressActions";
import {
  getFinalProblemSetCandidates,
  type FinalProblemSetCandidate,
} from "@/features/course/recommendActions";
import { resolveThumbnailUrl } from "@/features/course/http";
import { isEnrollmentCompleted } from "@/features/course/search";
import type {
  CourseDetail,
  StudentLearningProgress,
  LectureSummary,
} from "@/features/course/types";
import OneButtonModal from "@/components/common/OneButtonModal";
import TwoButtonModal from "@/components/common/TwoButtonModal";
import List, { type ListColumn } from "@/components/common/List";
import ListSkeleton from "@/components/common/ListSkeleton";
import LoadingIndicator from "@/components/common/LoadingIndicator";

interface CourseDetailClientProps {
  courseId: string;
  course: CourseDetail;
  lectures: LectureSummary[];
}

const TEACHER_ROLES = ["INSTRUCTOR", "OPERATOR", "ADMIN"];

const outlineBtn =
  "px-4 py-2 text-sm font-medium bg-bg-box text-text-blue border border-text-blue rounded-lg cursor-pointer hover:bg-button-blue-bg hover:text-text-white transition-colors whitespace-nowrap";

// "이동하기" 는 학생 답안 view-only 화면 — 백엔드 API 확정 전까지 비활성 stub.
const progressColumns: ListColumn<StudentLearningProgress>[] = [
  { key: "index", label: COURSE_PROGRESS_COLUMN_LABELS[0] },
  { key: "studentName", label: COURSE_PROGRESS_COLUMN_LABELS[1] },
  {
    key: "lecture",
    label: COURSE_PROGRESS_COLUMN_LABELS[2],
    render: (item) =>
      `${item.completedLectureCount}/${item.totalLectureCount} ${item.lectureProgressRate}%`,
  },
  {
    key: "problem",
    label: COURSE_PROGRESS_COLUMN_LABELS[3],
    render: (item) =>
      `${item.completedProblemCount}/${item.totalProblemCount} 개`,
  },
  {
    key: "action",
    label: COURSE_PROGRESS_COLUMN_LABELS[4],
    render: () => (
      <button
        type="button"
        disabled
        title="준비 중인 기능입니다"
        className="px-3 py-1 text-xs font-medium text-text-blue border border-text-blue rounded-md opacity-60 cursor-not-allowed"
      >
        이동하기
      </button>
    ),
  },
];

export default function CourseDetailClient({
  courseId,
  course,
  lectures,
}: CourseDetailClientProps) {
  const router = useRouter();

  // 역할 — localStorage 기반이라 클라에서만 결정. lazy initializer 로 마운트 한 번에 확정.
  const [userRole] = useState<string>(() =>
    typeof window === "undefined"
      ? ""
      : (localStorage.getItem("userRole") ?? ""),
  );
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const isTeacher = TEACHER_ROLES.includes(userRole);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 학생 + 로그인 상태에서만 수강 여부 조회.
    const loggedIn =
      !!localStorage.getItem("token") || !!localStorage.getItem("userNickname");
    if (isTeacher || !loggedIn) return;

    getMyEnrollments()
      .then((enrollments) => {
        const mine = enrollments.find(
          (e) => String(e.courseId) === String(courseId),
        );
        setIsEnrolled(!!mine);
        setIsCompleted(isEnrollmentCompleted(mine));
      })
      .catch(() => {
        /* ignore */
      });
  }, [courseId, isTeacher]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showProgress, setShowProgress] = useState(false);
  const [progressData, setProgressData] = useState<StudentLearningProgress[]>(
    [],
  );
  const [progressLoading, setProgressLoading] = useState(false);

  const [showEnrollConfirm, setShowEnrollConfirm] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);

  // 추가 문제 추천 모달
  const [showRecommend, setShowRecommend] = useState(false);
  const [recommendData, setRecommendData] = useState<FinalProblemSetCandidate[]>(
    [],
  );
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [recommendLoaded, setRecommendLoaded] = useState(false);
  const [recommendError, setRecommendError] = useState(false);
  const [recommendBlocked, setRecommendBlocked] = useState(false);
  const recommendTitleId = useId();

  // 추천 조회 기준 강의 = 마지막 강의(최고 order). BE 가 "마지막 + 전체 완료" 를 검증.
  const lastLectureId =
    lectures.length > 0
      ? lectures.reduce((a, b) => (b.lectureOrder > a.lectureOrder ? b : a))
          .lectureId
      : null;

  const [resultModal, setResultModal] = useState<{
    title: string;
    content: string;
    redirect?: string;
  } | null>(null);

  // 추천 모달 Esc 닫기
  useEffect(() => {
    if (!showRecommend) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowRecommend(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showRecommend]);

  const handleRecommendClick = async () => {
    setShowRecommend(true);
    if (recommendLoaded) return;
    setRecommendLoading(true);
    setRecommendError(false);
    setRecommendBlocked(false);

    if (lastLectureId == null) {
      setRecommendBlocked(true);
      setRecommendLoading(false);
      return;
    }

    const result = await getFinalProblemSetCandidates(lastLectureId);
    if (result.status === "ok") {
      setRecommendData(result.problemSets);
      setRecommendLoaded(true); // 성공 시에만 — 미완료/실패 시 재오픈으로 재시도 가능
    } else if (result.status === "notCompleted") {
      setRecommendBlocked(true);
    } else {
      setRecommendError(true);
    }
    setRecommendLoading(false);
  };

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

  const handleProgressClick = async () => {
    setShowProgress(true);
    if (progressData.length > 0) return;
    setProgressLoading(true);
    try {
      const page = await getCourseLearningProgress(courseId);
      setProgressData(page.content);
    } catch {
      /* ignore */
    } finally {
      setProgressLoading(false);
    }
  };

  const handleEnrollClick = () => {
    const isLoggedIn =
      typeof window !== "undefined" &&
      (!!localStorage.getItem("token") ||
        !!localStorage.getItem("userNickname"));

    if (!isLoggedIn) {
      setResultModal({
        title: "로그인 필요",
        content: "수강 신청은 로그인 후 이용할 수 있습니다.",
        redirect: "/auth/login",
      });
      return;
    }
    setShowEnrollConfirm(true);
  };

  const handleEnrollConfirm = async () => {
    setIsEnrolling(true);
    try {
      await enrollCourse(courseId);
      setShowEnrollConfirm(false);
      setIsEnrolled(true);
      // 내 강의실로 보내지 않고 강좌 페이지에 그대로 둔다 — isEnrolled=true 로 바뀌어
      // 아래 강의 목록을 바로 눌러 학습을 시작할 수 있다.
      setResultModal({
        title: "수강 신청 완료",
        content: "신청이 완료되었습니다.\n아래 강의 목록에서 바로 학습을 시작하세요.",
      });
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : "";
      // 잠금 계정: 딱딱한 원문("잠긴 계정입니다.") 대신 안내형 문구로
      const locked = raw.includes("잠긴") || raw.includes("잠금");
      const content = locked
        ? "계정이 잠겨 있어 수강 신청할 수 없습니다.\n관리자에게 문의해 주세요."
        : raw && raw.length <= 60
          ? raw
          : "수강 신청에 실패했습니다. 잠시 후 다시 시도해 주세요.";
      setShowEnrollConfirm(false);
      setResultModal({ title: "수강 신청 실패", content });
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleResultClose = () => {
    const redirect = resultModal?.redirect;
    setResultModal(null);
    if (redirect) router.push(redirect);
  };

  // 설명이 일정 길이 이하이면 3줄 안에 들어가므로 더보기를 띄우지 않는다.
  // (기존 90자는 3줄에 다 들어가는 설명에도 더보기가 떠서 임계값을 상향)
  const needsDescToggle =
    !!course.description && course.description.length > 120;

  return (
    <div className="min-h-screen bg-bg-main">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
        <div className="border border-border-light rounded-lg overflow-hidden mb-8">
          <div className="relative w-full h-48 sm:h-72 bg-bg-gray-box flex items-center justify-center overflow-hidden">
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
              <p className="text-sm text-text-secondary mb-1">
                강사: {course.instructorName}
              </p>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-text-primary mb-2">
                  {course.title}
                </h1>
                <div className="relative">
                  <p
                    className={[
                      "text-sm text-text-secondary leading-relaxed",
                      descExpanded ? "" : "line-clamp-3 pr-12",
                    ].join(" ")}
                  >
                    {course.description}
                    {descExpanded && needsDescToggle && (
                      <button
                        type="button"
                        onClick={() => setDescExpanded(false)}
                        className="ml-1 text-xs font-medium text-text-blue hover:underline cursor-pointer whitespace-nowrap"
                      >
                        접기
                      </button>
                    )}
                  </p>
                  {!descExpanded && needsDescToggle && (
                    <button
                      type="button"
                      onClick={() => setDescExpanded(true)}
                      className="absolute bottom-0 right-0 bg-bg-main pl-2 text-xs font-medium text-text-blue hover:underline cursor-pointer whitespace-nowrap"
                    >
                      더보기
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0 mt-1">
                {isTeacher ? (
                  <>
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
                      className="px-4 py-2 text-sm font-medium bg-bg-box text-text-red border border-button-red-bg rounded-lg hover:bg-button-red-bg hover:text-text-white transition-colors whitespace-nowrap"
                    >
                      삭제하기
                    </button>
                  </>
                ) : isEnrolled ? (
                  <>
                    {/* 추천 문제는 수강 + 전체 강의 완료가 전제 → 수강 중일 때만 노출 */}
                    <button
                      type="button"
                      onClick={handleRecommendClick}
                      className={outlineBtn}
                    >
                      추가 문제
                    </button>
                    <span className="px-6 py-2 text-sm font-medium text-text-blue bg-bg-gray-box rounded-lg whitespace-nowrap">
                      {isCompleted ? "수강 완료" : "수강 중"}
                    </span>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleEnrollClick}
                    className="px-6 py-2 text-sm font-medium bg-button-blue-bg text-text-white rounded-lg cursor-pointer hover:bg-button-blue-hover-bg transition-colors whitespace-nowrap"
                  >
                    수강 신청
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-4">강의목록</h2>

          {lectures.length === 0 ? (
            <div className="border border-border-light rounded-lg py-12 text-center text-sm text-text-muted">
              등록된 강의가 없습니다.
            </div>
          ) : (
            <div className="border border-border-light rounded-lg overflow-hidden">
              {lectures.map((lecture, index) => (
                <button
                  key={lecture.lectureId}
                  type="button"
                  onClick={() => handleLectureClick(lecture.lectureId)}
                  className={[
                    "w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer hover:bg-bg-gray-box transition-colors",
                    index < lectures.length - 1
                      ? "border-b border-border-light"
                      : "",
                  ].join(" ")}
                >
                  <span className="text-base text-text-primary">
                    {lecture.lectureOrder}주차: {lecture.title}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={[
                        "text-xs font-medium px-2 py-0.5 rounded",
                        lecture.videoUrl
                          ? "bg-tag-video-bg text-tag-video-text"
                          : "bg-tag-problem-bg text-tag-problem-text",
                      ].join(" ")}
                    >
                      {lecture.videoUrl ? "영상" : "문제"}
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
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      <TwoButtonModal
        isOpen={showEnrollConfirm}
        onClose={() => setShowEnrollConfirm(false)}
        onConfirm={handleEnrollConfirm}
        confirmDisabled={isEnrolling}
        modalTitle="수강 신청"
        modalContent="이 강좌를 수강 신청하시겠습니까?"
      />

      <TwoButtonModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        confirmDisabled={isDeleting}
        modalTitle="강좌 삭제"
        modalContent="삭제하면 복구할 수 없습니다. 삭제하시겠습니까?"
      />

      {showProgress && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-bg-box rounded-lg shadow-2xl w-full max-w-2xl max-h-screen flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-light">
              <h3 className="text-lg font-semibold text-text-primary">
                수강생 학습 현황
              </h3>
              <button
                type="button"
                onClick={() => setShowProgress(false)}
                className="text-text-secondary hover:text-text-primary transition-colors"
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
                  columns={[...COURSE_PROGRESS_COLUMN_LABELS]}
                  rowCount={5}
                  statusMessage="학습 현황을 불러오는 중입니다."
                  withPagination={false}
                />
              ) : (
                <List
                  data={progressData}
                  columns={progressColumns}
                  rowKey={(item) => item.userId}
                  emptyMessage="수강생 데이터가 없습니다."
                />
              )}
            </div>

            <div className="flex justify-end px-6 py-4 border-t border-border-light">
              <button
                type="button"
                onClick={() => setShowProgress(false)}
                className="px-5 py-2.5 text-sm text-text-white bg-button-blue-bg rounded-lg hover:bg-button-blue-hover-bg transition-colors font-medium"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {showRecommend && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setShowRecommend(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={recommendTitleId}
            className="bg-bg-box rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-light">
              <h3
                id={recommendTitleId}
                className="text-lg font-semibold text-text-primary"
              >
                추천 문제
              </h3>
              <button
                type="button"
                onClick={() => setShowRecommend(false)}
                aria-label="모달 닫기"
                className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
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
              {recommendLoading ? (
                <LoadingIndicator message="추천 문제를 불러오는 중입니다." />
              ) : recommendBlocked ? (
                <p
                  role="status"
                  className="text-center text-sm text-text-secondary py-8 leading-relaxed"
                >
                  강좌의 모든 강의를 수강한 뒤<br />
                  추천 문제를 받을 수 있어요.
                </p>
              ) : recommendError ? (
                <div className="text-center py-8">
                  <p className="text-sm text-text-red mb-3">
                    추천 문제를 불러오지 못했어요.
                  </p>
                  <button
                    type="button"
                    onClick={handleRecommendClick}
                    className="px-4 py-2 text-sm font-medium text-text-blue border border-text-blue rounded-lg hover:bg-button-blue-bg hover:text-text-white transition-colors cursor-pointer"
                  >
                    다시 시도
                  </button>
                </div>
              ) : recommendData.length === 0 ? (
                <p className="text-center text-sm text-text-muted py-8">
                  추천할 문제가 없어요.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {recommendData.map((ps) => (
                    <li key={ps.problemSetId}>
                      <button
                        type="button"
                        onClick={() => router.push(`/problems/${ps.problemSetId}`)}
                        className="w-full text-left p-4 rounded-lg border border-border-light hover:border-text-blue hover:bg-bg-box-hover transition-colors cursor-pointer"
                      >
                        <p className="text-sm font-semibold text-text-primary mb-1">
                          {ps.title}
                        </p>
                        <p className="text-xs text-text-secondary line-clamp-2">
                          {ps.description}
                        </p>
                        {ps.recommendationReason && (
                          <span className="mt-3 flex gap-2 rounded-md bg-[#eef2ff] px-3 py-2 text-xs leading-relaxed text-text-blue">
                            <span aria-hidden="true">💡</span>
                            <span>
                              <span className="font-semibold">추천 이유 </span>
                              {ps.recommendationReason}
                            </span>
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end px-6 py-4 border-t border-border-light">
              <button
                type="button"
                onClick={() => setShowRecommend(false)}
                className="px-5 py-2.5 text-sm text-text-white bg-button-blue-bg rounded-lg hover:bg-button-blue-hover-bg transition-colors font-medium cursor-pointer"
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
