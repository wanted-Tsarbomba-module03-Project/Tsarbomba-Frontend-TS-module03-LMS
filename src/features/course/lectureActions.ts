import { request } from "./http";
import type { LectureSummary, LectureUpsertBody } from "./types";

// 강의는 lectureOrder 순으로 정렬해서 내려준다.
export const getCourseLectures = async (
  courseId: number | string,
): Promise<LectureSummary[]> => {
  const data = await request<LectureSummary[]>(
    `/api/v1/courses/${courseId}/lectures`,
    { method: "GET" },
    "강의 목록을 불러오지 못했습니다.",
  );
  return (data ?? []).sort((a, b) => a.lectureOrder - b.lectureOrder);
};

export const getLecture = async (
  lectureId: number | string,
): Promise<LectureSummary> => {
  return request<LectureSummary>(
    `/api/v1/lectures/${lectureId}`,
    { method: "GET" },
    "강의 정보를 불러오지 못했습니다.",
  );
};

export const createLecture = async (
  courseId: number | string,
  body: LectureUpsertBody,
): Promise<number> => {
  const data = await request<{ lectureId: number }>(
    `/api/v1/courses/${courseId}/lectures`,
    { method: "POST", body: JSON.stringify(body) },
    "강의 등록에 실패했습니다.",
  );
  return data?.lectureId;
};

export const updateLecture = async (
  lectureId: number | string,
  body: LectureUpsertBody,
): Promise<void> => {
  await request(
    `/api/v1/lectures/${lectureId}`,
    { method: "PUT", body: JSON.stringify(body) },
    "강의 수정에 실패했습니다.",
  );
};

export const deleteLecture = async (
  lectureId: number | string,
): Promise<void> => {
  await request(
    `/api/v1/lectures/${lectureId}`,
    { method: "DELETE" },
    "강의 삭제에 실패했습니다.",
  );
};

// 강의 진행률 저장 (PATCH). 재생 중 주기 저장 아니고 일시정지/종료/이탈 시점에 호출.
// watchedDeltaSec = 직전 저장 이후 실제 시청한 초 (seek 로 건너뛴 구간은 제외).
export interface LectureProgressPayload {
  lastPositionSec: number;
  durationSec?: number;
  watchedDeltaSec: number;
}

export const recordLectureProgress = async (
  lectureId: number | string,
  body: LectureProgressPayload,
  // keepalive: 새로고침/탭 종료 직전에도 요청이 완료되도록 (이탈 저장 유실 방지)
  options?: { keepalive?: boolean },
): Promise<void> => {
  await request(
    `/api/v1/lectures/${lectureId}/progress`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
      keepalive: options?.keepalive,
    },
    "강의 진행률 저장에 실패했습니다.",
  );
};

export interface LectureProgress {
  lectureProgressId: number;
  lectureId: number;
  completed: boolean;
  completedAt?: string | null;
  lastWatchedAt?: string | null;
  lastPositionSec: number;
  durationSec?: number | null;
  watchedSec: number;
}

export const getLectureProgress = async (
  lectureId: number | string,
): Promise<LectureProgress> => {
  return request<LectureProgress>(
    `/api/v1/lectures/${lectureId}/progress`,
    { method: "GET" },
    "강의 진행률 조회에 실패했습니다.",
  );
};
