"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getCourse,
  updateCourse,
  uploadCourseThumbnail,
} from "@/features/course/actions";
import {
  createLecture,
  deleteLecture,
  getCourseLectures,
  updateLecture,
} from "@/features/course/lectureActions";
import { uploadLectureMaterial } from "@/features/course/materialActions";
import {
  configureCourseProblemSets,
  getCourseProblemSets,
} from "@/features/course/problemSetActions";
import { resolveThumbnailUrl } from "@/features/course/http";
import { isValidYoutubeUrl } from "@/features/course/youtube";
import type { ProblemSetConnection } from "@/features/course/types";
import OneButtonModal from "@/components/common/OneButtonModal";
import TwoButtonModal from "@/components/common/TwoButtonModal";
import LoadingIndicator from "@/components/common/LoadingIndicator";
import type {
  LectureItem,
  ProblemLecture,
  ProblemSetSummary,
  VideoLecture,
} from "@/features/course/form/types";
import CourseBasicSection from "@/features/course/form/components/CourseBasicSection";
import ProblemSetPanel from "@/features/course/form/components/ProblemSetPanel";
import LectureListSection from "@/features/course/form/components/LectureListSection";
import { useCourseCategories } from "@/features/course/form/hooks/useCourseCategories";
import { useProblemCategories } from "@/features/course/form/hooks/useProblemCategories";
import { useProblemSets } from "@/features/course/form/hooks/useProblemSets";
import {
  fetchProblemCategories,
  fetchProblemSetsByCategory,
} from "@/features/course/form/http";
import { uid } from "@/features/course/form/id";

// 강좌 수정
export default function CourseEditPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState("");
  const [title, setTitle] = useState("");
  const [courseCategoryId, setCourseCategoryId] = useState("");
  const [description, setDescription] = useState("");

  const { categories: courseCategories } = useCourseCategories();
  const problemCategories = useProblemCategories();
  const [selectedProblemCategoryId, setSelectedProblemCategoryId] =
    useState("");
  const problemSets = useProblemSets(selectedProblemCategoryId);
  const [selectedProblemSetIds, setSelectedProblemSetIds] = useState<
    Set<number>
  >(new Set());

  const [lectures, setLectures] = useState<LectureItem[]>([]);
  const [deletedLectureIds, setDeletedLectureIds] = useState<number[]>([]);

  // 기존에 DB에 저장돼 있던 (lectureId:problemSetId) — 저장 시 중복 INSERT 방지.
  const originalLinkKeysRef = useRef<Set<string>>(new Set());

  const [initialLoading, setInitialLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 동기 가드 — isSubmitting(상태)은 비동기라 빠른 중복 클릭을 못 막음. 저장 1회만 실행 보장.
  const submittingRef = useRef(false);
  const [resultModal, setResultModal] = useState<{
    title: string;
    content: string;
    isSuccess: boolean;
  } | null>(null);

  // 첫 진입 시 연결된 문제세트의 카테고리를 우측 패널에 자동 선택.
  const autoSelectCategory = useCallback(async (problemSetId: number) => {
    const cats = await fetchProblemCategories();
    for (const cat of cats) {
      const sets = await fetchProblemSetsByCategory(String(cat.categoryId));
      if (sets.some((s) => s.problemSetId === problemSetId)) {
        setSelectedProblemCategoryId(String(cat.categoryId));
        return;
      }
    }
  }, []);

  useEffect(() => {
    if (!courseId) return;

    const load = async () => {
      setInitialLoading(true);
      try {
        const [course, lectureData, problemLinks] = await Promise.all([
          getCourse(courseId),
          getCourseLectures(courseId),
          getCourseProblemSets(courseId),
        ]);

        setTitle(course.title ?? "");
        setDescription(course.description ?? "");
        setCourseCategoryId(String(course.courseCategoryId ?? ""));
        setExistingThumbnailUrl(course.thumbnailUrl ?? "");
        setThumbnailPreview(resolveThumbnailUrl(course.thumbnailUrl ?? ""));

        // lectureId → problemSetId 매핑 (이 강의가 문제 강의라는 표시).
        const psByLecture = new Map<number, number>();
        problemLinks.forEach((link) =>
          psByLecture.set(link.lectureId, link.problemSetId),
        );

        originalLinkKeysRef.current = new Set(
          problemLinks.map((link) => `${link.lectureId}:${link.problemSetId}`),
        );

        setLectures(
          lectureData.map((l) => {
            const linkedPsId = psByLecture.get(l.lectureId);
            if (linkedPsId != null) {
              return {
                id: uid("edit"),
                lectureId: l.lectureId,
                type: "problem" as const,
                problemSetId: linkedPsId,
                problemTitle: l.title ?? "",
                dropdownOpen: false,
                lectureOrder: l.lectureOrder,
              } as ProblemLecture;
            }
            return {
              id: uid("edit"),
              lectureId: l.lectureId,
              type: "video" as const,
              title: l.title ?? "",
              videoUrl: l.videoUrl ?? "",
              description: l.description ?? "",
              files: [],
              lectureOrder: l.lectureOrder,
            } as VideoLecture;
          }),
        );

        const linkedIds = problemLinks.map((link) => link.problemSetId);
        if (linkedIds.length > 0) {
          setSelectedProblemSetIds(new Set(linkedIds));
          void autoSelectCategory(linkedIds[0]);
        }
      } catch {
        /* ignore */
      } finally {
        setInitialLoading(false);
      }
    };

    load();
  }, [courseId, autoSelectCategory]);

  const assignedProblemSetIds = new Set<number>(
    lectures
      .filter(
        (l): l is ProblemLecture =>
          l.type === "problem" && l.problemSetId !== null,
      )
      .map((l) => l.problemSetId as number),
  );

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setThumbnailFile(f);
    setThumbnailPreview(URL.createObjectURL(f));
  };

  const toggleProblemSet = (id: number) => {
    if (assignedProblemSetIds.has(id)) return;
    setSelectedProblemSetIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addVideo = () => {
    setLectures((prev) => [
      ...prev,
      {
        id: uid("edit"),
        type: "video",
        title: "",
        videoUrl: "",
        description: "",
        files: [],
        lectureOrder: prev.length + 1,
      } as VideoLecture,
    ]);
  };

  const addProblem = () => {
    setLectures((prev) => [
      ...prev,
      {
        id: uid("edit"),
        type: "problem",
        problemSetId: null,
        dropdownOpen: false,
        lectureOrder: prev.length + 1,
      } as ProblemLecture,
    ]);
  };

  // 기존 강의 (lectureId 보유) 는 삭제에 넣어 제출 시 일괄 처리.
  const removeLecture = (id: string) => {
    const target = lectures.find((l) => l.id === id);
    if (target?.lectureId) {
      setDeletedLectureIds((prev) => [...prev, target.lectureId!]);
    }
    setLectures((prev) => prev.filter((l) => l.id !== id));
  };

  const updateVideoField = useCallback(
    (id: string, field: keyof VideoLecture, value: unknown) => {
      setLectures((prev) =>
        prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)),
      );
    },
    [],
  );

  const assignProblemToLecture = (lectureId: string, psId: number) => {
    setLectures((prev) =>
      prev.map((l) =>
        l.id === lectureId
          ? ({
              ...l,
              problemSetId: psId,
              dropdownOpen: false,
            } as ProblemLecture)
          : l,
      ),
    );
  };

  const toggleProblemDropdown = (lectureId: string) => {
    setLectures((prev) =>
      prev.map((l) => {
        if (l.type !== "problem") return l;
        return {
          ...l,
          dropdownOpen:
            l.id === lectureId ? !(l as ProblemLecture).dropdownOpen : false,
        } as ProblemLecture;
      }),
    );
  };

  const getAvailableForLecture = (lectureId: string): ProblemSetSummary[] => {
    const thisItem = lectures.find((l) => l.id === lectureId) as
      | ProblemLecture
      | undefined;
    return problemSets.filter(
      (ps) =>
        selectedProblemSetIds.has(ps.problemSetId) &&
        (!assignedProblemSetIds.has(ps.problemSetId) ||
          thisItem?.problemSetId === ps.problemSetId),
    );
  };

  const getLabel = (index: number) => {
    const type = lectures[index].type;
    let count = 0;
    for (let i = 0; i <= index; i++) {
      if (lectures[i].type === type) count++;
    }
    return type === "video" ? `강의 영상 ${count}` : `문제 ${count}`;
  };

  const validate = (): string | null => {
    if (!title.trim()) return "강좌 제목을 입력해주세요.";
    if (!courseCategoryId) return "카테고리를 선택해주세요.";
    if (!description.trim()) return "강좌 설명을 입력해주세요.";
    for (const lec of lectures) {
      if (lec.type !== "video") continue;
      if (!lec.videoUrl.trim()) return "영상 링크(유튜브)를 입력해주세요.";
      if (!isValidYoutubeUrl(lec.videoUrl.trim()))
        return "유효한 유튜브 링크를 입력해주세요. (예: https://youtu.be/xxxxxxxxxxx)";
    }
    return null;
  };

  const handleSaveClick = () => {
    const err = validate();
    if (err) {
      setResultModal({ title: "입력 오류", content: err, isSuccess: false });
      return;
    }
    setShowConfirm(true);
  };

  const handleSubmit = async () => {
    if (submittingRef.current) return; // 동기 가드 — 빠른 중복 클릭 차단
    submittingRef.current = true;
    setShowConfirm(false);
    setIsSubmitting(true);
    try {
      let thumbnailUrl = existingThumbnailUrl;
      if (thumbnailFile) {
        thumbnailUrl = await uploadCourseThumbnail(thumbnailFile);
      }

      await updateCourse(courseId, {
        title,
        courseCategoryId: Number(courseCategoryId),
        description,
        thumbnailUrl,
      });

      const lectureIdMap: Record<string, number> = {};

      for (let i = 0; i < lectures.length; i++) {
        const item = lectures[i];
        const isVideo = item.type === "video";
        const v = isVideo ? (item as VideoLecture) : null;
        const pl = !isVideo ? (item as ProblemLecture) : null;

        const body = {
          title: isVideo
            ? v!.title
            : pl!.problemSetId !== null
              ? (problemSets.find((ps) => ps.problemSetId === pl!.problemSetId)
                  ?.title ?? "문제 강의")
              : "문제 강의",
          description: isVideo ? v!.description : null,
          videoUrl: isVideo ? v!.videoUrl.trim() || null : null,
          lectureOrder: i + 1,
        };

        if (item.lectureId) {
          await updateLecture(item.lectureId, body);
          lectureIdMap[item.id] = item.lectureId;
        } else {
          lectureIdMap[item.id] = await createLecture(courseId, body);
        }

        // 새로 첨부한 파일들 순차 업로드 (기존 자료는 BE 가 보관, BE 가 1개씩 받음)
        if (isVideo && v!.files.length > 0) {
          for (const file of v!.files) {
            await uploadLectureMaterial(lectureIdMap[item.id], file);
          }
        }
      }

      for (const lid of deletedLectureIds) {
        await deleteLecture(lid);
      }

      // DB 에 이미 있던 연결은 재전송 생략 → 중복 INSERT 방지.
      const connections: ProblemSetConnection[] = [];
      let displayOrderCounter = 1;
      for (const item of lectures) {
        if (item.type !== "problem") continue;
        const pl = item as ProblemLecture;
        if (pl.problemSetId === null) continue;

        const lectureId = lectureIdMap[item.id] ?? null;
        if (
          lectureId != null &&
          originalLinkKeysRef.current.has(`${lectureId}:${pl.problemSetId}`)
        ) {
          continue;
        }

        connections.push({
          problemSetId: pl.problemSetId,
          lectureId,
          role: "MAIN",
          displayOrder: displayOrderCounter++,
        });
      }

      if (connections.length > 0) {
        await configureCourseProblemSets(courseId, connections);
      }

      setResultModal({
        title: "수정 완료",
        content: "강좌가 성공적으로 수정되었습니다.",
        isSuccess: true,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "오류가 발생했습니다.";
      setResultModal({ title: "수정 실패", content: msg, isSuccess: false });
    } finally {
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  };

  if (initialLoading) {
    return <LoadingIndicator message="강좌 정보를 불러오는 중입니다." />;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="px-8 py-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">강좌 수정</h1>
      </div>

      <div className="px-8 py-6 max-w-6xl">
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">
            기본 정보
          </h2>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <CourseBasicSection
                thumbnailPreview={thumbnailPreview}
                onThumbnailChange={handleThumbnailChange}
                title={title}
                onTitleChange={setTitle}
                categoryId={courseCategoryId}
                onCategoryChange={setCourseCategoryId}
                categories={courseCategories}
                description={description}
                onDescriptionChange={setDescription}
                thumbnailInputId="course-edit-thumbnail"
              />
              {thumbnailFile && (
                <p className="mt-1 text-xs text-blue-900">
                  새 파일: {thumbnailFile.name}
                </p>
              )}
            </div>

            <ProblemSetPanel
              problemCategories={problemCategories}
              selectedCategoryId={selectedProblemCategoryId}
              onSelectCategory={(id) => {
                setSelectedProblemCategoryId(id);
                setSelectedProblemSetIds(new Set());
              }}
              problemSets={problemSets}
              selectedProblemSetIds={selectedProblemSetIds}
              assignedProblemSetIds={assignedProblemSetIds}
              onToggleProblemSet={toggleProblemSet}
              categoryLocked={assignedProblemSetIds.size > 0}
            />
          </div>
        </section>

        <LectureListSection
          lectures={lectures}
          setLectures={setLectures}
          problemSets={problemSets}
          onAddVideo={addVideo}
          onAddProblem={addProblem}
          onRemoveLecture={removeLecture}
          onUpdateVideoField={updateVideoField}
          onToggleProblemDropdown={toggleProblemDropdown}
          onAssignProblem={assignProblemToLecture}
          getLabel={getLabel}
          getAvailableForLecture={getAvailableForLecture}
        />

        <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleSaveClick}
            disabled={isSubmitting}
            className="px-8 py-2.5 bg-blue-900 text-white text-base font-medium rounded-lg cursor-pointer hover:bg-blue-950 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "저장 중..." : "수정 완료"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-8 py-2.5 bg-white text-gray-500 text-base font-medium rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
          >
            취소
          </button>
        </div>
      </div>

      <TwoButtonModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSubmit}
        confirmDisabled={isSubmitting}
        modalTitle="강좌 수정"
        modalContent="변경 사항이 즉시 반영됩니다. 저장하시겠습니까?"
      />

      <OneButtonModal
        isOpen={!!resultModal}
        onClose={() => {
          const success = resultModal?.isSuccess;
          setResultModal(null);
          if (success) router.push(`/courses/${courseId}`);
        }}
        modalTitle={resultModal?.title ?? ""}
        modalContent={resultModal?.content}
      />
    </div>
  );
}
