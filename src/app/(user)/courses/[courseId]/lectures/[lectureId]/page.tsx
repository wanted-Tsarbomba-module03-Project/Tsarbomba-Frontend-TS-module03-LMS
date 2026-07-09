"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getLecture,
  getCourseLectures,
  getLectureProgress,
} from "@/features/course/lectureActions";
import { getCourseProblemSets } from "@/features/course/problemSetActions";
import { getMyEnrollments } from "@/features/course/enrollmentActions";
import {
  getLectureMaterials,
  issueMaterialDownloadUrl,
  type LectureMaterial,
} from "@/features/course/materialActions";
import { getLectureProblemProgress } from "@/features/course/problems/actions";
import { resolveThumbnailUrl } from "@/features/course/http";
import type {
  LectureSummary,
  CourseProblemSetLink,
} from "@/features/course/types";
import YoutubeProgressPlayer from "@/features/course/components/YoutubeProgressPlayer";
import OneButtonModal from "@/components/common/OneButtonModal";
import TwoButtonModal from "@/components/common/TwoButtonModal";
import LoadingIndicator from "@/components/common/LoadingIndicator";
import ErrorPageView from "@/components/common/ErrorPageView";
import { ApiClientError } from "@/lib/errorHandling";

const getYoutubeEmbedUrl = (url?: string | null): string | null => {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    let id = "";
    if (host === "youtu.be") {
      id = u.pathname.slice(1).split("/")[0];
    } else if (host === "youtube.com") {
      if (u.pathname === "/watch") id = u.searchParams.get("v") ?? "";
      else if (u.pathname.startsWith("/embed/")) id = u.pathname.split("/")[2];
      else if (u.pathname.startsWith("/shorts/")) id = u.pathname.split("/")[2];
    }
    return id ? `https://www.youtube.com/embed/${id}` : null;
  } catch {
    return null;
  }
};

export default function LectureDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const lectureId = params.lectureId as string;

  const [lecture, setLecture] = useState<LectureSummary | null>(null);
  const [lectures, setLectures] = useState<LectureSummary[]>([]);
  const [problemLinks, setProblemLinks] = useState<CourseProblemSetLink[]>([]);
  const [materials, setMaterials] = useState<LectureMaterial[]>([]);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  // 운영/관리 역할은 미수강·잠금 무관하게 열람·이동 가능 (마운트 후 클라에서 확정 — hydration 안전)
  const [isOperator, setIsOperator] = useState(false);
  useEffect(() => {
    const role = localStorage.getItem("userRole") ?? "";
    setIsOperator(
      ["OPERATOR", "ADMIN", "MASTER", "INSTRUCTOR"].includes(role),
    );
  }, []);

  const [panelOpen, setPanelOpen] = useState(true);
  const [problemNavTarget, setProblemNavTarget] =
    useState<CourseProblemSetLink | null>(null);
  // 영상 90% 또는 문제 전부 풀이를 완료 기준으로 판단
  const [completedByLecture, setCompletedByLecture] = useState<
    Map<number, boolean>
  >(new Map());
  const [lockedNavTarget, setLockedNavTarget] = useState<LectureSummary | null>(
    null,
  );
  const [notEnrolledOpen, setNotEnrolledOpen] = useState(false);
  const [deletedOpen, setDeletedOpen] = useState(false);
  const [lockedAccessOpen, setLockedAccessOpen] = useState(false);
  const [lockedRedirectTarget, setLockedRedirectTarget] =
    useState<LectureSummary | null>(null);
  // 강좌별 1회만 노출 — 마지막이 문제 강의여서 다른 페이지에서 완료된 경우에도 재진입 시 잡히도록 lecture 페이지에서 체크
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const completionShownKey = `course-${courseId}-completion-shown`;
  // false → true 전환 1회만 노출
  const [showNextLectureModal, setShowNextLectureModal] = useState(false);
  const currentCompletedRef = useRef(false);

  const loadAllProgress = async (
    lectureList: LectureSummary[],
    links: CourseProblemSetLink[],
  ) => {
    const linkMap = new Map<number, CourseProblemSetLink>();
    links.forEach((l) => linkMap.set(l.lectureId, l));
    const entries = await Promise.all(
      lectureList.map(async (l) => {
        const link = linkMap.get(l.lectureId);
        try {
          if (link) {
            const lpsId = link.lectureProblemSetId ?? link.courseProblemSetId;
            const p = await getLectureProblemProgress(String(lpsId));
            const totalCount = p?.totalCount ?? 0;
            const solvedCount = p?.solvedCount ?? 0;
            const done =
              p?.completed ??
              p?.isCompleted ??
              (totalCount > 0 && solvedCount >= totalCount);
            return [l.lectureId, done] as const;
          }
          const p = await getLectureProgress(l.lectureId);
          return [l.lectureId, !!p?.completed] as const;
        } catch {
          return [l.lectureId, false] as const;
        }
      }),
    );
    setCompletedByLecture(new Map(entries));

    const allCompleted =
      lectureList.length > 0 && entries.every(([, done]) => done);

    // false → true 전환 시점에만 다음 강의 모달
    const currentEntry = entries.find(
      ([id]) => String(id) === String(lectureId),
    );
    const currentCompleted = currentEntry?.[1] ?? false;
    const justCompleted = !currentCompletedRef.current && currentCompleted;
    currentCompletedRef.current = currentCompleted;

    // 전체 완료 모달이 우선
    if (allCompleted && typeof window !== "undefined") {
      const alreadyShown = localStorage.getItem(completionShownKey) === "1";
      if (!alreadyShown) {
        setShowCompletionModal(true);
        localStorage.setItem(completionShownKey, "1");
      }
    } else if (justCompleted) {
      const lastIdx = lectureList.length - 1;
      const curIdx = lectureList.findIndex(
        (l) => String(l.lectureId) === String(lectureId),
      );
      if (curIdx >= 0 && curIdx < lastIdx) {
        setShowNextLectureModal(true);
      }
    }
    return entries;
  };

  useEffect(() => {
    if (!courseId || !lectureId) return;

    // 운영/관리 역할은 미수강·잠금 관계없이 강의 열람 가능 (강좌 관리·미리보기 목적)
    const userRole =
      typeof window !== "undefined"
        ? (localStorage.getItem("userRole") ?? "")
        : "";
    const isOperator = ["OPERATOR", "ADMIN", "MASTER", "INSTRUCTOR"].includes(
      userRole,
    );

    const load = async () => {
      setLoading(true);
      try {
        // 수강 여부 먼저 확인 — 강의 데이터 fetch 전에 가드 (운영자는 스킵)
        if (!isOperator) {
          const enrollments = await getMyEnrollments().catch(() => []);
          const enrolled = enrollments.some(
            (e) => String(e.courseId) === String(courseId),
          );
          if (!enrolled) {
            setNotEnrolledOpen(true);
            return;
          }
        }

        // 삭제/없는 강의(404)는 에러 페이지 대신 안내 모달, 접근 불가(403)는 강좌 페이지로.
        const lectureData = await getLecture(lectureId).catch((err: unknown) => {
          const status =
            err instanceof ApiClientError ? err.status : undefined;
          if (status === 404) {
            setDeletedOpen(true);
            return null;
          }
          if (status === 403) {
            router.replace(`/courses/${courseId}`);
            return null;
          }
          throw err;
        });
        if (!lectureData) return;

        const [lectureList, links, materialList] = await Promise.all([
          getCourseLectures(courseId),
          getCourseProblemSets(courseId).catch(() => []),
          getLectureMaterials(lectureId).catch(() => []),
        ]);
        setLecture(lectureData);
        setLectures(lectureList);
        setProblemLinks(links);
        setMaterials(materialList);
        const entries = await loadAllProgress(lectureList, links);

        const sortedList = [...lectureList].sort(
          (a, b) => a.lectureOrder - b.lectureOrder,
        );
        const completedMap = new Map(entries);
        const curIdx = sortedList.findIndex(
          (l) => String(l.lectureId) === String(lectureId),
        );
        const firstUncompletedIdx = sortedList.findIndex(
          (l) => !completedMap.get(l.lectureId),
        );
        // 운영자는 순서 잠금 무시하고 열람 가능
        if (
          !isOperator &&
          firstUncompletedIdx >= 0 &&
          curIdx > firstUncompletedIdx
        ) {
          setLockedRedirectTarget(sortedList[firstUncompletedIdx]);
          setLockedAccessOpen(true);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [courseId, lectureId]);

  const currentIndex = lectures.findIndex(
    (l) => String(l.lectureId) === String(lectureId),
  );
  const prevLecture = currentIndex > 0 ? lectures[currentIndex - 1] : null;
  const nextLecture =
    currentIndex >= 0 && currentIndex < lectures.length - 1
      ? lectures[currentIndex + 1]
      : null;

  const linkByLecture = new Map<number, CourseProblemSetLink>();
  problemLinks.forEach((link) => linkByLecture.set(link.lectureId, link));

  // 영상 진도 저장 직후 즉시 잠금 해제 반영용
  const refreshAllProgress = () => {
    void loadAllProgress(lectures, problemLinks);
  };

  // 첫 강의는 항상 열림, 이후는 직전 강의 완료 시에만
  const unlockedIds = new Set<number>();
  if (lectures.length > 0) unlockedIds.add(lectures[0].lectureId);
  for (let i = 1; i < lectures.length; i++) {
    if (completedByLecture.get(lectures[i - 1].lectureId)) {
      unlockedIds.add(lectures[i].lectureId);
    }
  }
  // 운영자는 모든 강의 잠금 해제 → nextLocked·목록 클릭 가드까지 일괄 예외 적용
  const isLocked = (l: LectureSummary) =>
    !isOperator && !unlockedIds.has(l.lectureId);
  const nextLocked = nextLecture ? isLocked(nextLecture) : true;

  const goToLecture = (id: number) => {
    router.push(`/courses/${courseId}/lectures/${id}`);
  };

  const goToProblem = (link: CourseProblemSetLink) => {
    const lpsId = link.lectureProblemSetId ?? link.courseProblemSetId;
    if (lpsId == null) return; // ID 없으면 /problems/undefined 라우팅 방지
    router.push(`/courses/${courseId}/problems/${lpsId}`);
  };

  // 자료 다운로드 — URL 발급(POST) 후 숨김 <a download> 클릭 (새 탭/흰 화면 없이 바로 다운로드)
  const handleDownloadMaterial = async (m: LectureMaterial) => {
    if (downloadingId !== null) return;
    setDownloadingId(m.lectureMaterialId);
    try {
      const url = await issueMaterialDownloadUrl(m.lectureMaterialId);
      const a = document.createElement("a");
      a.href = url;
      a.download = m.originalFileName;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      /* 발급 실패 — 조용히 무시 (버튼 재시도 가능) */
    } finally {
      setDownloadingId(null);
    }
  };

  const handleListItemClick = (item: LectureSummary) => {
    if (isLocked(item)) {
      setLockedNavTarget(item);
      return;
    }
    // 연결된 문제세트가 있으면 문제 풀이로, 그 외엔 강의 페이지로
    const link = linkByLecture.get(item.lectureId);
    if (link) {
      setProblemNavTarget(link);
    } else {
      goToLecture(item.lectureId);
    }
  };

  const currentLink = linkByLecture.get(Number(lectureId));
  // BE 응답에 lectureType 이 없어 videoUrl 유무로 영상/문제 구분 (문제세트 링크 있으면 확정 문제 강의)
  const isProblemLecture = !!currentLink || !lecture?.videoUrl;

  if (loading) {
    return <LoadingIndicator message="강의를 불러오는 중입니다." />;
  }

  // onClose 에서 state 를 false 로 되돌리면 lecture=null 인 상태로 잠시 ErrorPageView(404) 가 노출되므로, 모달은 그대로 두고 navigation 만
  if (notEnrolledOpen) {
    return (
      <OneButtonModal
        isOpen={true}
        onClose={() => router.replace(`/courses/${courseId}`)}
        modalTitle="수강 신청이 필요합니다"
        modalContent={"먼저 수강 신청을 해주세요.\n강좌 페이지로 이동합니다."}
      />
    );
  }

  if (deletedOpen) {
    return (
      <OneButtonModal
        isOpen={true}
        onClose={() => router.replace(`/courses/${courseId}`)}
        modalTitle="삭제된 강의입니다"
        modalContent={"삭제되었거나 존재하지 않는 강의예요.\n강좌 페이지로 이동합니다."}
      />
    );
  }

  if (lockedAccessOpen) {
    const targetOrder = lockedRedirectTarget?.lectureOrder;
    const targetId = lockedRedirectTarget?.lectureId;
    return (
      <OneButtonModal
        isOpen={true}
        onClose={() => {
          if (targetId != null) {
            router.replace(`/courses/${courseId}/lectures/${targetId}`);
          } else {
            router.replace(`/courses/${courseId}`);
          }
        }}
        modalTitle="잠긴 강의입니다"
        modalContent={
          targetOrder != null
            ? `이전 강의를 먼저 완료해주세요.\n${targetOrder}주차 강의로 이동합니다.`
            : "이전 강의를 먼저 완료해주세요.\n강좌 페이지로 이동합니다."
        }
      />
    );
  }

  if (!lecture) {
    return <ErrorPageView status={404} message="강의를 찾을 수 없습니다." />;
  }

  const embedUrl = getYoutubeEmbedUrl(lecture.videoUrl);
  const videoSrc = resolveThumbnailUrl(lecture.videoUrl);

  return (
    <div className="max-w-6xl mx-auto px-6">
      <div className="flex gap-4 items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => router.push(`/courses/${courseId}`)}
              aria-label="강좌 페이지로 돌아가기"
              title="강좌 페이지로 돌아가기"
              className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-500 hover:text-blue-900 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 4L6 8l4 4" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-800 truncate">
              {lecture.lectureOrder}주차: {lecture.title}
            </h1>
            <span
              className={[
                "shrink-0 text-xs font-medium px-2 py-0.5 rounded",
                isProblemLecture
                  ? "bg-amber-50 text-amber-700"
                  : "bg-blue-50 text-blue-700",
              ].join(" ")}
            >
              {isProblemLecture ? "문제" : "영상"}
            </span>
          </div>

          <p className="mb-0.5 pl-2.5 -indent-2.5 text-xs text-red-600">
            {isProblemLecture
              ? "* 문제를 모두 풀이해야 다음 강의가 열립니다."
              : "* 강의 영상을 끝까지 시청해야 다음 강의가 열립니다. 처음 시청 시에는 재생바 이동과 배속 재생이 제한됩니다."}
          </p>

          {!isProblemLecture && (
            <p className="mb-3 pl-2.5 -indent-2.5 text-xs text-red-600">
              * 본 영상은 외부 YouTube 영상을 임베드하여 제공됩니다. 영상의 무단
              배포, 캡처 후 공유, 재업로드 및 재사용으로 인해 발생하는 책임은
              이용자 본인에게 있습니다.
            </p>
          )}

          {isProblemLecture ? (
            <div className="w-full aspect-video bg-gray-100 rounded-lg flex flex-col items-center justify-center gap-5 px-6 text-center">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <rect
                  x="12"
                  y="8"
                  width="40"
                  height="48"
                  rx="4"
                  stroke="#1E3A8A"
                  strokeWidth="2"
                  fill="white"
                />
                <path
                  d="M22 22h20M22 32h20M22 42h12"
                  stroke="#1E3A8A"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <div>
                <p className="text-lg font-semibold text-gray-800 mb-1">
                  문제 강의입니다
                </p>
                <p className="text-sm text-gray-500">
                  {currentLink
                    ? "아래 버튼을 눌러 문제를 풀어보세요."
                    : "문제 연결 정보를 불러오지 못했어요. 잠시 후 새로고침 해주세요."}
                </p>
              </div>
              {currentLink && (
                <button
                  type="button"
                  onClick={() => setProblemNavTarget(currentLink)}
                  className="px-6 py-2.5 text-base font-medium bg-blue-900 text-white rounded-lg cursor-pointer hover:bg-blue-950 transition-colors"
                >
                  문제 풀러 가기
                </button>
              )}
            </div>
          ) : (
            <div className="w-full aspect-video bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
              {embedUrl ? (
                <YoutubeProgressPlayer
                  lectureId={lectureId}
                  videoUrl={lecture.videoUrl}
                  title={lecture.title}
                  onProgressSaved={refreshAllProgress}
                />
              ) : videoSrc ? (
                <video src={videoSrc} controls className="w-full h-full" />
              ) : (
                <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
                  <circle
                    cx="36"
                    cy="36"
                    r="34"
                    stroke="#9CA3AF"
                    strokeWidth="2"
                  />
                  <path d="M30 26l16 10-16 10V26z" fill="#9CA3AF" />
                </svg>
              )}
            </div>
          )}

          {!isProblemLecture && (
            <div className="mt-4">
              <p className="text-sm text-text-secondary leading-relaxed">
                {lecture.description}
              </p>

              {materials.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-text-primary mb-2">
                    첨부 파일
                  </p>
                  <ul className="flex flex-col gap-2">
                    {materials.map((m) => (
                      <li key={m.lectureMaterialId}>
                        <button
                          type="button"
                          onClick={() => handleDownloadMaterial(m)}
                          disabled={downloadingId === m.lectureMaterialId}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm border border-border-light rounded-lg text-text-primary hover:bg-bg-gray-box transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="shrink-0"
                          >
                            <path d="M8 2v8m0 0l3-3m-3 3L5 7M3 12h10" />
                          </svg>
                          <span className="truncate flex-1 text-left">
                            {m.originalFileName}
                          </span>
                          <span className="shrink-0 text-xs text-text-secondary">
                            {downloadingId === m.lectureMaterialId
                              ? "준비 중..."
                              : "다운로드"}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              disabled={!prevLecture}
              onClick={() => prevLecture && goToLecture(prevLecture.lectureId)}
              className="flex items-center gap-1 text-base font-medium text-gray-800 cursor-pointer hover:text-blue-900 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4l-5 5 5 5" />
              </svg>
              이전
            </button>

            <button
              type="button"
              disabled={!nextLecture || nextLocked}
              onClick={() => nextLecture && goToLecture(nextLecture.lectureId)}
              title={
                nextLecture && nextLocked
                  ? "현재 강의를 완료하면 다음 강의가 열립니다."
                  : undefined
              }
              className="flex items-center gap-1 text-base font-medium text-gray-800 cursor-pointer hover:text-blue-900 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              다음
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 4l5 5-5 5" />
              </svg>
            </button>
          </div>
        </div>

        <div className="shrink-0 flex items-start">
          {!panelOpen && (
            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 hover:bg-gray-100 transition-colors whitespace-nowrap cursor-pointer"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M10 4L6 8l4 4" />
              </svg>
              강의 목록
            </button>
          )}

          <div
            className={[
              "overflow-hidden transition-all duration-300",
              panelOpen ? "w-72 opacity-100" : "w-0 opacity-0",
            ].join(" ")}
          >
            <div className="w-72 border border-gray-200 rounded-lg bg-white">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <span className="text-base font-semibold text-gray-800">
                  강의 목록
                </span>
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  aria-label="목록 접기"
                  className="text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M7 4l5 5-5 5" />
                  </svg>
                </button>
              </div>

              <ul className="max-h-96 overflow-y-auto py-1">
                {lectures.map((item) => {
                  const isCurrent =
                    String(item.lectureId) === String(lectureId);
                  const isProblem =
                    linkByLecture.has(item.lectureId) || !item.videoUrl;
                  const locked = isLocked(item) && !isCurrent;
                  return (
                    <li key={item.lectureId}>
                      <button
                        type="button"
                        onClick={() => handleListItemClick(item)}
                        className={[
                          "w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 cursor-pointer",
                          isCurrent
                            ? "bg-blue-900 text-white"
                            : locked
                              ? "text-gray-400 hover:bg-gray-50"
                              : "text-gray-800 hover:bg-gray-100",
                        ].join(" ")}
                      >
                        {locked && (
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            className="shrink-0"
                          >
                            <rect
                              x="3"
                              y="6"
                              width="8"
                              height="6"
                              rx="1"
                              fill="none"
                            />
                            <path
                              d="M5 6V4a2 2 0 014 0v2"
                              strokeLinecap="round"
                            />
                          </svg>
                        )}
                        <span className="truncate flex-1">
                          {item.lectureOrder}. {item.title}
                        </span>
                        <span
                          className={[
                            "text-xs px-1.5 py-0.5 rounded shrink-0",
                            isCurrent
                              ? "bg-white/20 text-white"
                              : isProblem
                                ? "bg-amber-50 text-amber-700"
                                : "bg-blue-50 text-blue-700",
                          ].join(" ")}
                        >
                          {isProblem ? "문제" : "영상"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <TwoButtonModal
        isOpen={!!problemNavTarget}
        onClose={() => setProblemNavTarget(null)}
        onConfirm={() => {
          if (problemNavTarget) goToProblem(problemNavTarget);
          setProblemNavTarget(null);
        }}
        modalTitle="문제 풀이로 이동"
        modalContent="문제 풀이 화면으로 이동하시겠습니까?"
      />

      <OneButtonModal
        isOpen={!!lockedNavTarget}
        onClose={() => setLockedNavTarget(null)}
        modalTitle="잠긴 강의입니다"
        modalContent="이전 강의를 먼저 완료해주세요."
      />

      <OneButtonModal
        isOpen={showCompletionModal}
        onClose={() => {
          setShowCompletionModal(false);
          router.push(`/courses/${courseId}`);
        }}
        modalTitle="강좌 수강 완료"
        modalContent="모든 강의를 끝까지 들으셨습니다! 추천 문제를 풀어보세요."
      />

      <TwoButtonModal
        isOpen={showNextLectureModal}
        onClose={() => setShowNextLectureModal(false)}
        onConfirm={() => {
          setShowNextLectureModal(false);
          if (!nextLecture) return;
          const link = linkByLecture.get(nextLecture.lectureId);
          if (link) {
            goToProblem(link);
          } else {
            goToLecture(nextLecture.lectureId);
          }
        }}
        modalTitle="강의 완료"
        modalContent="다음 강의로 이동하시겠습니까?"
      />
    </div>
  );
}
