"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";

export type FilterDropdownValue = string | boolean;

export interface FilterDropdownOption<T extends FilterDropdownValue> {
  label: string;
  value: T;
  swatchClassName?: string;
}

type MenuPosition = {
  left: number;
  top: number;
  minWidth: number;
  maxHeight: number;
};

interface FilterDropdownProps<T extends FilterDropdownValue> {
  /** 트리거 버튼에 적용할 클래스 (컨텍스트별 스타일 주입) */
  buttonClassName: string;
  /** 래퍼(div)에 추가할 클래스 (폭/정렬/`[&_button]:` 오버라이드 등) */
  className?: string;
  /** true면 선택값만(전체일 땐 label만) 표시, false면 `label: 값` 형태 */
  compactTrigger?: boolean;
  /** "전체" 옵션 포함 여부 */
  includeAll?: boolean;
  label: string;
  /** 드롭다운 메뉴 최소 폭(px) */
  menuMinWidth?: number;
  onChange: (value: T | "") => void;
  options: Array<FilterDropdownOption<T>>;
  value: T | "";
}

const filterDropdownClasses = {
  wrap: "relative min-w-0",
  menu: "fixed z-50 overflow-y-auto rounded-base border border-border-light bg-white p-1.5 text-left shadow-[0_14px_32px_rgba(15,23,42,0.18)]",
  option:
    "flex w-full cursor-pointer items-center gap-2 rounded-base px-2.5 py-2 text-left text-description font-semibold text-text-primary transition hover:bg-[#eef2ff] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1a237e]",
  optionActive: "bg-[#eef2ff] text-[#1a237e]",
  swatch: "h-2.5 w-2.5 shrink-0 rounded-full",
  label: "truncate min-w-0",
  caret: "ml-0.5 text-[10px] leading-none text-text-secondary",
} as const;

export default function FilterDropdown<T extends FilterDropdownValue>({
  buttonClassName,
  className = "",
  compactTrigger = false,
  includeAll = true,
  label,
  menuMinWidth = 160,
  onChange,
  options,
  value,
}: FilterDropdownProps<T>) {
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const pendingFocusRef = useRef(false);

  const selectedOption = options.find((option) => option.value === value);
  const dropdownOptions: Array<{
    label: string;
    value: T | "";
    swatchClassName?: string;
  }> = includeAll ? [{ label: "전체", value: "" }, ...options] : options;
  const selectedIndex = Math.max(
    dropdownOptions.findIndex((option) => option.value === value),
    0,
  );

  const updateMenuPosition = useCallback(() => {
    const button = buttonRef.current;

    if (!button) {
      return;
    }

    const rect = button.getBoundingClientRect();
    const minWidth = Math.max(menuMinWidth, rect.width);
    const horizontalPadding = 8;
    const menuMaxHeight = 256;
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const opensUp = spaceBelow < 140 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(
      120,
      Math.min(menuMaxHeight, opensUp ? spaceAbove : spaceBelow),
    );
    const unclampedLeft = rect.left + rect.width / 2;
    const minLeft = horizontalPadding + minWidth / 2;
    const maxLeft = window.innerWidth - horizontalPadding - minWidth / 2;

    setMenuPosition({
      left: Math.min(Math.max(unclampedLeft, minLeft), maxLeft),
      top: opensUp ? Math.max(8, rect.top - maxHeight - 6) : rect.bottom + 6,
      minWidth,
      maxHeight,
    });
  }, [menuMinWidth]);

  const closeAndReturnFocus = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  const focusOptionAt = useCallback((index: number) => {
    const count = optionRefs.current.length;

    if (count === 0) {
      return;
    }

    const nextIndex = ((index % count) + count) % count;

    optionRefs.current[nextIndex]?.focus();
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (
        !wrapRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeAndReturnFocus();
      }
    };

    updateMenuPosition();

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open, updateMenuPosition, closeAndReturnFocus]);

  // 메뉴가 열려 위치가 잡히면 선택된(없으면 첫) 옵션으로 포커스 이동 - 스크롤/리사이즈로 인한 재포커스는 방지
  useEffect(() => {
    if (open && menuPosition && pendingFocusRef.current) {
      pendingFocusRef.current = false;
      optionRefs.current[selectedIndex]?.focus();
    }
  }, [open, menuPosition, selectedIndex]);

  const openMenu = () => {
    pendingFocusRef.current = true;
    setOpen(true);
  };

  const handleTriggerClick = () => {
    if (open) {
      setOpen(false);
    } else {
      openMenu();
    }
  };

  const handleTriggerKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
  ) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();

      if (open) {
        focusOptionAt(event.key === "ArrowDown" ? 0 : dropdownOptions.length - 1);
      } else {
        openMenu();
      }
    }
  };

  const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const currentIndex = optionRefs.current.findIndex(
      (element) => element === document.activeElement,
    );

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusOptionAt(currentIndex + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusOptionAt(currentIndex - 1);
        break;
      case "Home":
        event.preventDefault();
        focusOptionAt(0);
        break;
      case "End":
        event.preventDefault();
        focusOptionAt(dropdownOptions.length - 1);
        break;
      case "Tab":
        event.preventDefault();
        closeAndReturnFocus();
        break;
      default:
        break;
    }
  };

  const handleSelect = (nextValue: T | "") => {
    onChange(nextValue);
    closeAndReturnFocus();
  };

  const triggerText = compactTrigger
    ? (selectedOption?.label ?? label)
    : `${label}: ${selectedOption?.label ?? "전체"}`;

  const filterMenu =
    open && menuPosition && typeof document !== "undefined"
      ? createPortal(
          <div
            aria-label={`${label} 필터 옵션`}
            className={filterDropdownClasses.menu}
            id={menuId}
            onKeyDown={handleMenuKeyDown}
            ref={menuRef}
            role="listbox"
            style={{
              left: menuPosition.left,
              top: menuPosition.top,
              minWidth: menuPosition.minWidth,
              maxHeight: menuPosition.maxHeight,
              transform: "translateX(-50%)",
            }}
          >
            {dropdownOptions.map((option, index) => {
              const selected = option.value === value;

              return (
                <button
                  aria-selected={selected}
                  className={`${filterDropdownClasses.option} ${
                    selected ? filterDropdownClasses.optionActive : ""
                  }`}
                  key={String(option.value)}
                  onClick={() => handleSelect(option.value)}
                  ref={(element) => {
                    optionRefs.current[index] = element;
                  }}
                  role="option"
                  tabIndex={-1}
                  type="button"
                >
                  {option.swatchClassName && (
                    <span
                      aria-hidden="true"
                      className={`${filterDropdownClasses.swatch} ${option.swatchClassName}`}
                    />
                  )}
                  {option.label}
                </button>
              );
            })}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={`${filterDropdownClasses.wrap} ${className}`} ref={wrapRef}>
      <button
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`${label} 필터 선택`}
        className={buttonClassName}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        ref={buttonRef}
        title={`${label} 필터: ${selectedOption?.label ?? "전체"}`}
        type="button"
      >
        {selectedOption?.swatchClassName && (
          <span
            aria-hidden="true"
            className={`${filterDropdownClasses.swatch} ${selectedOption.swatchClassName}`}
          />
        )}
        <span className={filterDropdownClasses.label}>{triggerText}</span>
        <span aria-hidden="true" className={filterDropdownClasses.caret}>
          ▼
        </span>
      </button>
      {filterMenu}
    </div>
  );
}
