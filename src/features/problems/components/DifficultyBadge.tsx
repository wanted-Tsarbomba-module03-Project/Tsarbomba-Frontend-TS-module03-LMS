import { DIFFICULTY_MAP } from "../actions";
import type { ProblemDifficulty } from "../types";

const difficultyBadgeClass =
  "inline-flex h-8 min-w-[58px] items-center justify-center rounded-full px-3 text-description font-semibold";

const difficultyColorClasses: Record<ProblemDifficulty, string> = {
  EASY: "bg-[#dcfce7] text-[#15803d]",
  MEDIUM: "bg-[#fef9c3] text-[#854d0e]",
  HARD: "bg-[#fee2e2] text-[#b91c1c]",
};

/** 난이도 색상 배지 - 회원/관리자 문제 목록에서 공통 사용 */
export default function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const knownDifficulty =
    difficulty === "EASY" || difficulty === "MEDIUM" || difficulty === "HARD"
      ? difficulty
      : null;

  if (!knownDifficulty) {
    return <>{difficulty || "-"}</>;
  }

  return (
    <span className={`${difficultyBadgeClass} ${difficultyColorClasses[knownDifficulty]}`}>
      {DIFFICULTY_MAP[knownDifficulty]}
    </span>
  );
}
