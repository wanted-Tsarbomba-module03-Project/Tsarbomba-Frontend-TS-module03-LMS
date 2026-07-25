import { Skeleton } from "primereact/skeleton";

interface ListSkeletonProps {
  columns: string[];
  columnWidths?: string[];
  colWidths?: readonly (string | undefined)[];
  containerClassName?: string;
  rowCount?: number;
  statusMessage?: string;
  title?: string;
  titleClassName?: string;
  withPagination?: boolean;
}

const listSkeletonClasses = {
  container: "w-full min-w-0",
  title: "mt-0 mb-5 text-title-lg font-bold text-text-primary",
  card: "overflow-hidden rounded-[12px] border border-border-light bg-bg-box shadow-[0_1px_2px_rgba(16,24,40,0.04),0_6px_20px_-12px_rgba(16,24,40,0.16)]",
  scrollArea:
    "w-full max-w-full overscroll-x-contain overflow-x-auto [scrollbar-width:thin]",
  table:
    "w-full min-w-[720px] table-fixed border-separate border-spacing-0 max-[760px]:min-w-[640px] max-[420px]:min-w-[560px] [&_td]:overflow-hidden [&_td]:text-ellipsis [&_td]:whitespace-nowrap [&_th]:overflow-hidden [&_th]:text-ellipsis [&_th]:whitespace-nowrap [&_thead_th]:h-[54px] [&_thead_th]:border-b [&_thead_th]:border-border-light [&_thead_th]:bg-[#fafbfc] [&_thead_th]:px-3 [&_thead_th]:text-center [&_thead_th]:align-middle [&_thead_th]:font-semibold [&_tbody_td]:h-[60px] [&_tbody_td]:border-b [&_tbody_td]:border-[#f0f1f4] [&_tbody_td]:p-0 [&_tbody_td]:text-center [&_tbody_td]:align-middle [&_tbody_tr:last-child_td]:border-b-0",
  cellContent:
    "box-border flex min-h-[60px] items-center justify-center whitespace-normal break-words p-2",
  pagination: "mt-5 flex flex-wrap justify-center gap-2",
} as const;

function getSkeletonWidth(index: number, columnCount: number) {
  if (columnCount <= 1) {
    return "60%";
  }

  if (index === 0) {
    return "36px";
  }

  if (index === columnCount - 1) {
    return "64%";
  }

  return index % 2 === 0 ? "72%" : "56%";
}

function SkeletonCell({
  columnCount,
  index,
  width,
}: {
  columnCount: number;
  index: number;
  width?: string;
}) {
  return (
    <td>
      <div className={listSkeletonClasses.cellContent}>
        <Skeleton
          borderRadius="8px"
          height="18px"
          width={width ?? getSkeletonWidth(index, columnCount)}
        />
      </div>
    </td>
  );
}

export default function ListSkeleton({
  columns,
  columnWidths,
  colWidths,
  containerClassName = listSkeletonClasses.container,
  rowCount = 8,
  statusMessage = "목록을 불러오는 중입니다.",
  title,
  titleClassName = listSkeletonClasses.title,
  withPagination = true,
}: ListSkeletonProps) {
  return (
    <div aria-busy="true" className={containerClassName}>
      <p aria-live="polite" className="sr-only" role="status">
        {statusMessage}
      </p>

      {title && <h2 className={titleClassName}>{title}</h2>}

      <div aria-hidden="true" className={listSkeletonClasses.card}>
        <div className={listSkeletonClasses.scrollArea}>
          <table className={listSkeletonClasses.table}>
            {colWidths && (
              <colgroup>
                {columns.map((column, columnIndex) => (
                  <col
                    key={`${column}-${columnIndex}`}
                    style={{ width: colWidths[columnIndex] }}
                  />
                ))}
              </colgroup>
            )}
            <thead>
              <tr>
                {columns.map((column, columnIndex) => (
                  <th key={`${column}-${columnIndex}`}>{column}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {Array.from({ length: rowCount }, (_, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((column, columnIndex) => (
                    <SkeletonCell
                      columnCount={columns.length}
                      index={columnIndex}
                      key={`${column}-${columnIndex}`}
                      width={columnWidths?.[columnIndex]}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {withPagination && (
        <div aria-hidden="true" className={listSkeletonClasses.pagination}>
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton
              borderRadius="8px"
              height="36px"
              key={index}
              width={index === 2 ? "44px" : "36px"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
