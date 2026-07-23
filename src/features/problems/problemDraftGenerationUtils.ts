import type { ProblemDifficulty } from "./types";

const PROBLEM_DIFFICULTIES = new Set<ProblemDifficulty>([
  "EASY",
  "MEDIUM",
  "HARD",
]);

export function normalizePositiveNumber(value: unknown, fallback: number) {
  const parsedValue =
    typeof value === "number" ? value : Number.parseInt(String(value), 10);

  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
}

export function normalizeTimeoutSeconds(value: unknown, fallback = 3) {
  const timeout = normalizePositiveNumber(value, fallback);

  return timeout >= 1000 ? Math.max(1, Math.round(timeout / 1000)) : timeout;
}

export function normalizeOptionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

export function normalizeProblemDifficulty(value: unknown) {
  return typeof value === "string" &&
    PROBLEM_DIFFICULTIES.has(value as ProblemDifficulty)
    ? (value as ProblemDifficulty)
    : undefined;
}
