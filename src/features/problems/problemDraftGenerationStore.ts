import { generateProblemSetDraft } from "./actions";
import type { ProblemSetDraft, ProblemSetDraftGenerateRequest } from "./types";

export type ProblemDraftGenerationStatus = "running" | "success" | "error";

export interface ProblemDraftGenerationJob {
  id: string;
  draft?: ProblemSetDraft;
  errorMessage?: string;
  file?: File;
  fileName: string;
  startedAt: number;
  status: ProblemDraftGenerationStatus;
  targetPath: string;
  topic: string;
}

interface StartProblemDraftGenerationParams {
  file: File;
  requestBody: ProblemSetDraftGenerateRequest;
  targetPath: string;
}

const subscribers = new Set<() => void>();

let currentJob: ProblemDraftGenerationJob | null = null;
let currentController: AbortController | null = null;

const createJobId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

function notifySubscribers() {
  subscribers.forEach((callback) => callback());
}

export function subscribeProblemDraftGeneration(callback: () => void) {
  subscribers.add(callback);

  return () => {
    subscribers.delete(callback);
  };
}

export function getProblemDraftGenerationSnapshot() {
  return currentJob;
}

export function getProblemDraftGenerationServerSnapshot() {
  return null;
}

export function startProblemDraftGeneration({
  file,
  requestBody,
  targetPath,
}: StartProblemDraftGenerationParams) {
  currentController?.abort();

  const controller = new AbortController();
  const jobId = createJobId();

  currentController = controller;
  currentJob = {
    file,
    fileName: file.name,
    id: jobId,
    startedAt: Date.now(),
    status: "running",
    targetPath,
    topic: requestBody.topic,
  };
  notifySubscribers();

  void generateProblemSetDraft(requestBody, file, controller.signal)
    .then((draft) => {
      if (controller.signal.aborted || currentJob?.id !== jobId) {
        return;
      }

      currentJob = {
        ...currentJob,
        draft,
        status: "success",
      };
      notifySubscribers();
    })
    .catch((error) => {
      if (controller.signal.aborted || currentJob?.id !== jobId) {
        return;
      }

      currentJob = {
        ...currentJob,
        errorMessage:
          error instanceof Error
            ? error.message
            : "문제세트 초안을 생성하지 못했습니다.",
        status: "error",
      };
      notifySubscribers();
    })
    .finally(() => {
      if (currentController === controller) {
        currentController = null;
      }
    });

  return jobId;
}

export function consumeProblemDraftGeneration(jobId: string) {
  if (currentJob?.id !== jobId || currentJob.status !== "success") {
    return null;
  }

  const result = currentJob.draft
    ? {
        draft: currentJob.draft,
        file: currentJob.file ?? null,
      }
    : null;
  currentJob = null;
  notifySubscribers();

  return result;
}

export function clearProblemDraftGeneration(jobId?: string) {
  if (jobId && currentJob?.id !== jobId) {
    return;
  }

  currentJob = null;
  notifySubscribers();
}
