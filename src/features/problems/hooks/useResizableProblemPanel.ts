"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

// 문제풀이 화면의 좌우 패널(문제 내용 | 풀이 영역) 드래그 리사이즈 로직.
// UserProblemDetailClient 와 동일 동작을 공유하기 위해 훅으로 추출.
const MIN_PROBLEM_PANEL_WIDTH = 260;
const MIN_SOLVE_PANEL_WIDTH = 400;
const RESIZE_HANDLE_RESERVED_WIDTH = 32;
const DEFAULT_PROBLEM_PANEL_PERCENT = 33.3333;

export function useResizableProblemPanel() {
  const [problemPanelPercent, setProblemPanelPercent] = useState(
    DEFAULT_PROBLEM_PANEL_PERCENT,
  );
  const [isPanelSplitAvailable, setIsPanelSplitAvailable] = useState(false);
  const contentAreaRef = useRef<HTMLElement | null>(null);
  // 진행 중인 드래그 정리 함수 — 드래그 도중 언마운트 시 리스너/전역 커서 정리용.
  const dragCleanupRef = useRef<(() => void) | null>(null);

  // 언마운트 시 진행 중 드래그가 있으면 정리 (리스너 누수 + body 커서/선택 잠김 방지).
  useEffect(() => {
    return () => {
      dragCleanupRef.current?.();
    };
  }, []);

  // 패널 너비를 CSS 변수로 전달 (스타일의 --problem-panel-percent 사용).
  const problemPanelStyle = useMemo(
    () =>
      ({
        "--problem-panel-percent": `${problemPanelPercent}%`,
      }) as CSSProperties & Record<"--problem-panel-percent", string>,
    [problemPanelPercent],
  );

  // 컨테이너 폭이 두 패널 최소폭보다 좁으면 분할 불가(세로 적층) → 분할 가능 여부를 추적.
  useEffect(() => {
    const container = contentAreaRef.current;
    if (!container) return;

    const updateSplitAvailability = () => {
      const width = container.getBoundingClientRect().width;
      const canSplit =
        width >=
        MIN_PROBLEM_PANEL_WIDTH +
          MIN_SOLVE_PANEL_WIDTH +
          RESIZE_HANDLE_RESERVED_WIDTH;

      setIsPanelSplitAvailable(canSplit);

      if (!canSplit) {
        setProblemPanelPercent(DEFAULT_PROBLEM_PANEL_PERCENT);
        return;
      }

      const minPercent = (MIN_PROBLEM_PANEL_WIDTH / width) * 100;
      const maxPercent =
        ((width - MIN_SOLVE_PANEL_WIDTH - RESIZE_HANDLE_RESERVED_WIDTH) /
          width) *
        100;

      setProblemPanelPercent((prev) =>
        Math.min(Math.max(prev, minPercent), maxPercent),
      );
    };

    updateSplitAvailability();

    const resizeObserver = new ResizeObserver(updateSplitAvailability);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  const handlePanelResizeStart = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (!isPanelSplitAvailable) return;

      const container = contentAreaRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const maxProblemWidth =
        rect.width - MIN_SOLVE_PANEL_WIDTH - RESIZE_HANDLE_RESERVED_WIDTH;
      if (maxProblemWidth < MIN_PROBLEM_PANEL_WIDTH) return;

      const updatePanelWidth = (clientX: number) => {
        const nextWidth = Math.min(
          Math.max(clientX - rect.left, MIN_PROBLEM_PANEL_WIDTH),
          maxProblemWidth,
        );
        setProblemPanelPercent((nextWidth / rect.width) * 100);
      };

      const handlePointerMove = (pointerEvent: PointerEvent) => {
        updatePanelWidth(pointerEvent.clientX);
      };
      const cleanup = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        dragCleanupRef.current = null;
      };
      function handlePointerUp() {
        cleanup();
      }

      updatePanelWidth(event.clientX);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp, { once: true });
      // 드래그 도중 언마운트되면 unmount effect 가 이 cleanup 을 호출.
      dragCleanupRef.current = cleanup;
    },
    [isPanelSplitAvailable],
  );

  return {
    contentAreaRef,
    isPanelSplitAvailable,
    problemPanelStyle,
    handlePanelResizeStart,
  };
}
