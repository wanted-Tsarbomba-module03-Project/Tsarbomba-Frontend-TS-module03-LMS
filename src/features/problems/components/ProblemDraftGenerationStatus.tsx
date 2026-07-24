"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

import {
  clearProblemDraftGeneration,
  getProblemDraftGenerationServerSnapshot,
  getProblemDraftGenerationSnapshot,
  subscribeProblemDraftGeneration,
} from "../problemDraftGenerationStore";

const statusClasses = {
  button:
    "fixed bottom-24 right-6 z-[1200] flex min-w-[230px] cursor-pointer items-center gap-3 rounded-xl border border-[#1a237e] bg-white px-4 py-3 text-left shadow-[0_12px_30px_rgba(15,23,42,0.22)] transition hover:bg-[#eef2ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a237e] max-md:right-4 max-md:bottom-20 max-md:min-w-[calc(100vw-32px)]",
  content: "flex min-w-0 flex-1 flex-col",
  description: "truncate text-description text-text-secondary",
  dot: "h-2.5 w-2.5 rounded-full bg-button-blue-bg",
  errorDot: "h-2.5 w-2.5 rounded-full bg-button-red-bg",
  spinner:
    "h-4 w-4 animate-spin rounded-full border-2 border-[#93a9c8] border-t-button-blue-bg",
  title: "text-body font-semibold text-text-primary",
} as const;

export default function ProblemDraftGenerationStatus() {
  const router = useRouter();
  const job = useSyncExternalStore(
    subscribeProblemDraftGeneration,
    getProblemDraftGenerationSnapshot,
    getProblemDraftGenerationServerSnapshot,
  );

  if (!job) {
    return null;
  }

  const isRunning = job.status === "running";
  const title =
    job.status === "success"
      ? "AI 초안 생성 완료"
      : job.status === "error"
        ? "AI 초안 생성 실패"
        : "AI 초안 생성 중";
  const description =
    job.status === "error"
      ? "클릭하면 등록 화면으로 이동합니다."
      : `${job.topic || job.fileName} · 클릭해서 확인`;

  return (
    <button
      aria-label={`${title} - 문제 등록 화면으로 이동`}
      className={statusClasses.button}
      onClick={() => {
        router.push(job.targetPath);

        if (job.status === "error") {
          clearProblemDraftGeneration(job.id);
        }
      }}
      type="button"
    >
      {isRunning ? (
        <span aria-hidden="true" className={statusClasses.spinner} />
      ) : (
        <span
          aria-hidden="true"
          className={job.status === "error" ? statusClasses.errorDot : statusClasses.dot}
        />
      )}
      <span className={statusClasses.content}>
        <span className={statusClasses.title}>{title}</span>
        <span className={statusClasses.description}>{description}</span>
      </span>
    </button>
  );
}
