import { ListSkeleton } from "@/components/common";

import {
  PROBLEM_LIST_COLUMN_LABELS,
  PROBLEM_LIST_COLUMN_WIDTHS,
  PROBLEM_SET_PAGE_SIZE,
} from "../constants";

const problemListSkeletonClasses = {
  container: "min-h-screen bg-bg-main py-[30px] max-md:py-6",
  pageTitle: "mt-0 mb-5 text-title-lg font-bold text-text-primary",
} as const;

export default function ProblemListSkeleton() {
  return (
    <ListSkeleton
      colWidths={PROBLEM_LIST_COLUMN_WIDTHS}
      columns={[...PROBLEM_LIST_COLUMN_LABELS]}
      containerClassName={problemListSkeletonClasses.container}
      rowCount={PROBLEM_SET_PAGE_SIZE}
      statusMessage="문제 목록을 불러오는 중입니다."
      title="문제풀이"
      titleClassName={problemListSkeletonClasses.pageTitle}
    />
  );
}
