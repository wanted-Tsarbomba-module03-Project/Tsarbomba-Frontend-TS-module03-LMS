"use client";

import { useEffect, useId } from "react";
import Image from "next/image";

import { optimizedImageProps } from "@/components/common/imageOptimization";
import LoadingIndicator from "@/components/common/LoadingIndicator";
import type { MyBadge } from "../types";

interface BadgeSelectModalProps {
  badges: MyBadge[];
  loading?: boolean;
  fetchFailed?: boolean;
  syncing?: boolean;
  onSelect: (badge: MyBadge) => void;
  onSync: () => void;
  onClose: () => void;
}

export default function BadgeSelectModal({
  badges,
  loading = false,
  fetchFailed = false,
  syncing = false,
  onSelect,
  onSync,
  onClose,
}: BadgeSelectModalProps) {
  const titleId = useId();
  const activeBadges = badges.filter((b) => b.status === "ACTIVE");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="bg-bg-box rounded-2xl p-6 w-[360px] max-h-[80vh] flex flex-col gap-4"
        role="dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary" id={titleId}>
            뱃지 선택
          </h2>
          <div className="flex items-center gap-2">
            {/* 자동 등록이 안 되는 경우를 대비한 수동 동기화 — 새로 획득한 뱃지를 서버에서 재계산 */}
            <button
              className="text-xs font-semibold text-text-blue border border-text-blue rounded-md px-2.5 py-1 hover:bg-bg-navbar transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={onSync}
              disabled={syncing}
              type="button"
            >
              {syncing ? "동기화 중..." : "동기화"}
            </button>
            <button
              aria-label="모달 닫기"
              className="text-text-secondary hover:text-text-primary text-xl cursor-pointer"
              onClick={onClose}
              type="button"
            >
              ✕
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingIndicator message="뱃지 목록을 불러오는 중입니다." />
        ) : fetchFailed ? (
          <p className="text-center text-sm text-text-red py-8">
            뱃지 목록을 불러오지 못했어요. 다시 시도해 주세요.
          </p>
        ) : activeBadges.length === 0 ? (
          <p className="text-center text-sm text-text-secondary py-8">
            아직 획득한 뱃지가 없어요
          </p>
        ) : (
          <ul className="grid grid-cols-3 gap-3 overflow-y-auto">
            {activeBadges.map((badge) => (
              <li key={badge.badgeId}>
                <button
                  className={`w-full flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all cursor-pointer ${
                    badge.isEquipped
                      ? "border-text-blue bg-bg-navbar"
                      : "border-transparent hover:border-border-light hover:bg-bg-navbar"
                  }`}
                  onClick={() => onSelect(badge)}
                  title={badge.badgeName}
                  type="button"
                >
                  <div className="w-14 h-14 rounded-full overflow-hidden border border-border-light bg-bg-gray-box flex items-center justify-center">
                    {badge.imageUrl ? (
                      <Image
                        alt={badge.badgeName}
                        className="w-full h-full object-cover"
                        height={56}
                        src={badge.imageUrl}
                        width={56}
                        sizes="56px"
                        {...optimizedImageProps}
                      />
                    ) : (
                      <span className="text-xs text-text-secondary">없음</span>
                    )}
                  </div>
                  <span className="text-[11px] text-center font-medium text-text-primary leading-tight line-clamp-2">
                    {badge.badgeName}
                  </span>
                  {badge.isEquipped && (
                    <span className="text-[10px] text-text-blue font-bold">
                      착용 중
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
