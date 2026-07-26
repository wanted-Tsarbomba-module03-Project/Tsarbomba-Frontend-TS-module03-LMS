"use client";

// 현재 문제(problemSetId, problemId)에 대한 AI 추천 질문 조회.
// User/Course 문제풀이 채팅에서 동일 로직을 공유한다.
import { useEffect, useState } from "react";

import { getSuggestedQuestions } from "@/features/chat/actions";

export function useProblemSuggestedQuestions(
  problemSetId: number | undefined,
  currentProblemId: number | undefined,
) {
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);

  useEffect(() => {
    const problemSetNumericId = Number(problemSetId);
    const problemNumericId = Number(currentProblemId);

    if (
      !Number.isFinite(problemSetNumericId) ||
      problemSetNumericId <= 0 ||
      !Number.isFinite(problemNumericId) ||
      problemNumericId <= 0
    ) {
      const resetTimer = window.setTimeout(() => {
        setSuggestedQuestions([]);
      }, 0);

      return () => window.clearTimeout(resetTimer);
    }

    const controller = new AbortController();

    getSuggestedQuestions(problemSetNumericId, problemNumericId, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setSuggestedQuestions(result?.questions ?? []);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setSuggestedQuestions([]);
        }
      });

    return () => controller.abort();
  }, [currentProblemId, problemSetId]);

  return suggestedQuestions;
}
