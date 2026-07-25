import { DIFFICULTY_MAP } from "../actions";
import type { ProblemDifficulty } from "../types";

const difficultyBadgeClass =
  "inline-flex h-8 min-w-[58px] items-center justify-center rounded-full px-3 text-description font-semibold";

const difficultyColorClasses: Record<ProblemDifficulty, string> = {
  EASY: "bg-[#dcfce7] text-[#15803d]",
  MEDIUM: "bg-[#fef9c3] text-[#854d0e]",
  HARD: "bg-[#fee2e2] text-[#b91c1c]",
};

interface DifficultyBadgeProps {
  difficulty?: ProblemDifficulty | string | null;
}

export default function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  if (!isProblemDifficulty(difficulty)) {
    return <>{difficulty || "-"}</>;
  }

  return (
    <span className={`${difficultyBadgeClass} ${difficultyColorClasses[difficulty]}`}>
      {DIFFICULTY_MAP[difficulty]}
    </span>
  );
}

function isProblemDifficulty(
  difficulty: DifficultyBadgeProps["difficulty"],
): difficulty is ProblemDifficulty {
  return (
    typeof difficulty === "string" &&
    Object.prototype.hasOwnProperty.call(DIFFICULTY_MAP, difficulty)
  );
}
