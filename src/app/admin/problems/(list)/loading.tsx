import { ListSkeleton } from "@/components/common";
import {
  ADMIN_PROBLEM_LIST_COLUMN_LABELS,
  PROBLEM_LIST_COLUMN_WIDTHS,
  PROBLEM_SET_PAGE_SIZE,
} from "@/features/problems/constants";

export default function AdminProblemsLoading() {
  return (
    <main className="min-h-screen bg-bg-main p-[30px]">
      <div className="mb-5 flex items-center justify-between gap-4 max-md:flex-col max-md:items-stretch">
        <h2 className="m-0 text-title-lg font-bold text-text-primary">
          문제 관리
        </h2>
      </div>

      <ListSkeleton
        colWidths={PROBLEM_LIST_COLUMN_WIDTHS}
        columns={[...ADMIN_PROBLEM_LIST_COLUMN_LABELS]}
        rowCount={PROBLEM_SET_PAGE_SIZE}
        statusMessage="문제 목록을 불러오는 중입니다."
      />
    </main>
  );
}
