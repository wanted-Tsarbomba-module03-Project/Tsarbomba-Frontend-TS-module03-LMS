"use client";

import { useEffect, useRef, useState, type Key, type ReactNode } from "react";
import Link from "next/link";

type ListItem = object & {
  id?: Key;
};

export interface ListColumn<T extends ListItem> {
  key: keyof T | "index" | string;
  label: ReactNode;
  cellClassName?: string | ((item: T, index: number) => string);
  isRowNumber?: boolean;
  title?: (item: T, index: number) => string | undefined;
  width?: string;
  render?: (item: T, index: number) => ReactNode;
}

interface ListProps<T extends ListItem> {
  data: T[];
  columns: ListColumn<T>[];
  onRowClick?: (item: T) => void;
  rowHref?: (item: T, index: number) => string | undefined;
  rowKey?: (item: T, index: number) => Key;
  rowClassName?: string | ((item: T, index: number) => string);
  rowNumberOffset?: number;
  scrollable?: boolean;
  pagination?: ReactNode;
  emptyMessage?: ReactNode;
}

interface ListCellContentProps {
  children: ReactNode;
  className: string;
  href?: string;
  title?: string;
}

const listClasses = {
  container: "w-full min-w-0 overflow-hidden",
  scrollArea:
    "w-full max-w-full overscroll-x-contain overflow-auto max-h-[min(520px,calc(100dvh-260px))] [scrollbar-width:thin]",
  table:
    "w-full min-w-[720px] table-fixed border-collapse max-[760px]:min-w-[640px] max-[420px]:min-w-[560px] [&_td]:overflow-hidden [&_td]:text-ellipsis [&_td]:whitespace-nowrap [&_th]:overflow-hidden [&_th]:text-ellipsis [&_th]:whitespace-nowrap [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-[1] [&_thead_th]:h-[50px] [&_thead_th]:border-y [&_thead_th]:border-border-light [&_thead_th]:bg-bg-navbar [&_thead_th]:text-center [&_thead_th]:align-middle [&_thead_th]:font-semibold [&_tbody_td]:h-[50px] [&_tbody_td]:border-b [&_tbody_td]:border-border-light [&_tbody_td]:p-0 [&_tbody_td]:text-center [&_tbody_td]:align-middle [&_tbody_tr:hover_td]:cursor-pointer [&_tbody_tr:hover_td]:bg-[#f0f0f0]",
  cellContent:
    "box-border min-w-0 overflow-hidden text-ellipsis whitespace-nowrap px-1 py-0",
  pagination:
    "mt-4 flex min-w-0 flex-wrap justify-center gap-2 overflow-x-auto pb-1",
};

const INDEX_COLUMN_WIDTH = "clamp(48px, 6ch, 72px)";

export const listCellClasses = {
  twoLine: "line-clamp-2 whitespace-normal! break-words leading-5",
} as const;

export default function List<T extends ListItem>({
  data,
  columns,
  onRowClick,
  rowHref,
  rowKey,
  rowClassName,
  rowNumberOffset = 0,
  scrollable = true,
  pagination = null,
  emptyMessage = "조회된 데이터가 없습니다.",
}: ListProps<T>) {
  const table = (
    <table className={listClasses.table}>
      <colgroup>
        {columns.map((column) => (
          <col
            key={String(column.key)}
            style={{ width: getColumnWidth(column) }}
          />
        ))}
      </colgroup>

      <thead>
        <tr>
          {columns.map((column) => (
            <th key={String(column.key)}>{column.label}</th>
          ))}
        </tr>
      </thead>

      <tbody>
        {data.length > 0 ? (
          data.map((item, index) => {
            const href = rowHref?.(item, index);

            return (
              <tr
                className={getRowClassName(rowClassName, item, index)}
                key={rowKey?.(item, index) ?? item.id ?? index}
                onClick={href ? undefined : () => onRowClick?.(item)}
              >
                {columns.map((column) => {
                  const cellContent = getCellContent(
                    item,
                    column,
                    index,
                    rowNumberOffset,
                  );
                  const cellTitle = getCellTitle(
                    item,
                    column,
                    index,
                    cellContent,
                  );

                  return (
                    <td key={String(column.key)}>
                      <ListCellContent
                        className={getCellClassName(column, item, index)}
                        href={href}
                        title={cellTitle}
                      >
                        {cellContent}
                      </ListCellContent>
                    </td>
                  );
                })}
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan={columns.length}>
              <div className={listClasses.cellContent}>{emptyMessage}</div>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  return (
    <div className={listClasses.container}>
      {scrollable ? (
        <div className={listClasses.scrollArea}>{table}</div>
      ) : (
        table
      )}

      {pagination && <div className={listClasses.pagination}>{pagination}</div>}
    </div>
  );
}

function ListCellContent({
  children,
  className,
  href,
  title,
}: ListCellContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const contentElement = contentRef.current;

    if (!contentElement || !title) {
      setIsOverflowing(false);
      return;
    }

    const updateOverflowState = () => {
      const nextIsOverflowing =
        contentElement.scrollWidth > contentElement.clientWidth ||
        contentElement.scrollHeight > contentElement.clientHeight;

      setIsOverflowing((currentIsOverflowing) =>
        currentIsOverflowing === nextIsOverflowing
          ? currentIsOverflowing
          : nextIsOverflowing,
      );
    };

    updateOverflowState();

    const resizeObserver = new ResizeObserver(updateOverflowState);
    resizeObserver.observe(contentElement);
    window.addEventListener("resize", updateOverflowState);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateOverflowState);
    };
  }, [children, className, title]);

  return (
    <div
      className={className}
      ref={contentRef}
      title={isOverflowing ? title : undefined}
    >
      {href ? (
        <Link className="block min-w-0 text-inherit no-underline" href={href}>
          {children}
        </Link>
      ) : (
        children
      )}
    </div>
  );
}

function getRowClassName<T extends ListItem>(
  rowClassName: ListProps<T>["rowClassName"],
  item: T,
  index: number,
) {
  if (typeof rowClassName === "function") {
    return rowClassName(item, index);
  }

  return rowClassName;
}

function getCellClassName<T extends ListItem>(
  column: ListColumn<T>,
  item: T,
  index: number,
) {
  const extraClassName =
    typeof column.cellClassName === "function"
      ? column.cellClassName(item, index)
      : column.cellClassName;

  return [listClasses.cellContent, extraClassName].filter(Boolean).join(" ");
}

function getColumnWidth<T extends ListItem>(column: ListColumn<T>) {
  if (column.width) {
    return column.width;
  }

  if (isRowNumberColumn(column)) {
    return INDEX_COLUMN_WIDTH;
  }

  return undefined;
}

function getCellContent<T extends ListItem>(
  item: T,
  column: ListColumn<T>,
  index: number,
  rowNumberOffset = 0,
): ReactNode {
  if (column.key === "index") {
    return rowNumberOffset + index + 1;
  }

  if (column.render) {
    return column.render(item, index);
  }

  const value = (item as Record<string, unknown>)[String(column.key)];

  if (value === null || value === undefined) {
    return "-";
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  return "-";
}

function getCellTitle<T extends ListItem>(
  item: T,
  column: ListColumn<T>,
  index: number,
  cellContent: ReactNode,
) {
  if (isRowNumberColumn(column)) {
    return undefined;
  }

  if (column.title) {
    return normalizeTitle(column.title(item, index));
  }

  if (isTitleValue(cellContent)) {
    return normalizeTitle(cellContent);
  }

  const value = (item as Record<string, unknown>)[String(column.key)];

  if (isTitleValue(value)) {
    return normalizeTitle(value);
  }

  return undefined;
}

function isRowNumberColumn<T extends ListItem>(column: ListColumn<T>) {
  return column.key === "index" || column.isRowNumber === true;
}

function isTitleValue(value: unknown): value is string | number | boolean {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function normalizeTitle(value: string | number | boolean | undefined) {
  if (value === undefined) {
    return undefined;
  }

  const title = String(value).trim();

  return title.length > 0 ? title : undefined;
}
