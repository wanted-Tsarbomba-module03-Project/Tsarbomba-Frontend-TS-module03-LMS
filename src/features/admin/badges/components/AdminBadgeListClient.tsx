"use client";

// CSR - 관리자 배지 목록: 운영자가 등록 직후 목록을 갱신하고 등록 화면으로 이동하는 관리 화면임
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { optimizedImageProps } from "@/components/common/imageOptimization";
import OneButtonModal from "@/components/common/OneButtonModal";
import { handleClientError } from "@/lib/errorHandling";

import { getAdminBadges } from "../actions";
import type { AdminBadge } from "../types";

const badgeListClasses = {
  page: "box-border min-h-screen w-full bg-bg-main p-8 max-md:p-4",
  header:
    "mb-6 flex items-center justify-between gap-4 max-md:flex-col max-md:items-stretch",
  title: "m-0 text-2xl font-bold text-text-primary",
  registerButton:
    "cursor-pointer rounded-lg bg-button-blue-bg px-4 py-2 text-sm font-medium text-text-white shadow-sm transition hover:bg-button-blue-hover-bg max-md:w-full",
  grid: "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4",
  card:
    "cursor-pointer overflow-hidden rounded-xl border border-border-light bg-bg-box shadow-sm transition hover:shadow-md",
  imageWrap:
    "relative flex aspect-[4/3] min-h-40 items-center justify-center overflow-hidden bg-bg-navbar",
  image: "h-full w-full object-cover",
  fallbackImage:
    "flex h-24 w-24 items-center justify-center rounded-full border border-border-light bg-bg-box text-description text-text-secondary",
  body: "p-4",
  meta: "mb-2 flex items-center justify-between gap-2",
  status:
    "rounded px-2 py-1 text-xs font-semibold",
  activeStatus: "bg-[#e8f5e9] text-[#166534]",
  inactiveStatus: "bg-bg-navbar text-text-secondary",
  point: "text-xs font-semibold text-text-blue",
  name: "mt-0 mb-1 line-clamp-1 text-lg font-bold text-text-primary",
  description: "m-0 line-clamp-2 text-sm leading-5 text-text-secondary",
  date: "mt-3 text-xs text-text-placeholder",
  empty:
    "rounded-base border border-border-light bg-bg-box px-4 py-24 text-center text-description text-text-placeholder max-md:py-16",
} as const;

const modalInitialState = { open: false, title: "", content: "" };

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getBadgeStatusLabel(status: string) {
  return status === "ACTIVE" ? "활성" : "비활성";
}

export default function AdminBadgeListClient() {
  const router = useRouter();
  const [badges, setBadges] = useState<AdminBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(modalInitialState);

  useEffect(() => {
    let isMounted = true;

    const fetchBadges = async () => {
      try {
        setLoading(true);
        const nextBadges = await getAdminBadges();

        if (isMounted) {
          setBadges(nextBadges);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        handleClientError(error, {
          router,
          fallbackTitle: "배지 목록 조회 실패",
          fallbackMessage:
            "배지 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
          showModal: (title, content) => setModal({ open: true, title, content }),
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchBadges();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <main className={badgeListClasses.page}>
      <div className={badgeListClasses.header}>
        <h1 className={badgeListClasses.title}>뱃지 관리</h1>
        <Link
          className={badgeListClasses.registerButton}
          href="/admin/badges/new"
        >
          등록하기
        </Link>
      </div>

      {loading ? (
        <div className={badgeListClasses.empty}>배지 목록을 불러오는 중입니다.</div>
      ) : badges.length === 0 ? (
        <div className={badgeListClasses.empty}>등록된 배지가 없습니다.</div>
      ) : (
        <div className={badgeListClasses.grid}>
          {badges.map((badge) => {
            const isActive = badge.status === "ACTIVE";

            return (
              <Link
                className="block text-inherit no-underline"
                href={`/admin/badges/${badge.badgeId}/edit`}
                key={badge.badgeId}
              >
                <article className={badgeListClasses.card}>
                <div className={badgeListClasses.imageWrap}>
                  {badge.imageUrl ? (
                    <Image
                      alt={badge.badgeName}
                      className={badgeListClasses.image}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                      src={badge.imageUrl}
                      {...optimizedImageProps}
                    />
                  ) : (
                    <span className={badgeListClasses.fallbackImage}>
                      이미지 없음
                    </span>
                  )}
                </div>

                <div className={badgeListClasses.body}>
                  <div className={badgeListClasses.meta}>
                    <span
                      className={`${badgeListClasses.status} ${
                        isActive
                          ? badgeListClasses.activeStatus
                          : badgeListClasses.inactiveStatus
                      }`}
                    >
                      {getBadgeStatusLabel(badge.status)}
                    </span>
                    <span className={badgeListClasses.point}>
                      {badge.requiredPoint.toLocaleString()}P
                    </span>
                  </div>

                  <h2 className={badgeListClasses.name}>{badge.badgeName}</h2>
                  <p className={badgeListClasses.description}>
                    {badge.description || "등록된 배지 설명이 없습니다."}
                  </p>
                  <p className={badgeListClasses.date}>
                    등록일 {formatDate(badge.createdAt)}
                  </p>
                </div>
                </article>
              </Link>
            );
          })}
        </div>
      )}

      <OneButtonModal
        isOpen={modal.open}
        modalContent={modal.content}
        modalTitle={modal.title}
        onClose={() => setModal(modalInitialState)}
      />
    </main>
  );
}
