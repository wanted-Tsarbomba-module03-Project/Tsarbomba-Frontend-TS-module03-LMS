"use client";

// CSR - 관리자 배지 수정: 기존 배지 정보를 불러온 뒤 이미지 교체와 상태 변경을 즉시 편집함
import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { optimizedImageProps } from "@/components/common/imageOptimization";
import OneButtonModal from "@/components/common/OneButtonModal";
import TwoButtonModal from "@/components/common/TwoButtonModal";
import WarningModal from "@/components/common/WarningModal";
import { handleClientError } from "@/lib/errorHandling";

import {
  deleteAdminBadge,
  getAdminBadgeDetail,
  updateAdminBadge,
} from "../actions";
import type { AdminBadge, BadgeStatus } from "../types";

const badgeFormClasses = {
  page: "min-h-screen bg-bg-main",
  header: "border-b border-border-light px-8 py-6",
  title: "m-0 text-xl font-bold text-text-primary",
  content: "max-w-6xl px-8 py-6",
  section: "mb-8",
  grid: "grid grid-cols-2 gap-8 max-lg:grid-cols-1",
  imageButton:
    "relative flex min-h-[320px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-base border border-border-light bg-bg-navbar text-description text-text-secondary transition hover:bg-bg-hover-gray",
  previewImage: "h-full w-full object-cover",
  hiddenInput: "hidden",
  fieldGroup: "flex flex-col gap-5",
  label: "mb-2 block text-body font-semibold text-text-primary",
  input:
    "h-11 w-full rounded-base border border-border-light bg-bg-box px-4 text-body text-text-primary outline-none placeholder:text-text-placeholder focus:border-button-blue-bg",
  select:
    "h-11 w-full cursor-pointer rounded-base border border-border-light bg-bg-box px-4 text-body text-text-primary outline-none focus:border-button-blue-bg",
  textarea:
    "min-h-[150px] w-full resize-y rounded-base border border-border-light bg-bg-box p-4 text-body text-text-primary outline-none placeholder:text-text-placeholder focus:border-button-blue-bg",
  helper: "mt-2 text-description text-text-secondary",
  buttonGroup:
    "mt-10 flex justify-end gap-3 border-t border-border-light pt-6 max-sm:flex-col",
  submitButton:
    "cursor-pointer rounded-lg bg-button-blue-bg px-8 py-2.5 text-body font-medium text-text-white transition hover:bg-button-blue-hover-bg disabled:cursor-not-allowed disabled:opacity-60",
  deleteButton:
    "cursor-pointer rounded-lg bg-button-red-bg px-8 py-2.5 text-body font-medium text-text-white transition hover:bg-button-red-hover-bg disabled:cursor-not-allowed disabled:opacity-60",
  cancelButton:
    "cursor-pointer rounded-lg border border-border-light bg-bg-box px-8 py-2.5 text-body font-medium text-text-secondary transition hover:bg-bg-hover-gray disabled:cursor-not-allowed disabled:opacity-60",
  loading:
    "rounded-base border border-border-light bg-bg-box py-24 text-center text-description text-text-placeholder",
} as const;

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const initialModal = {
  open: false,
  title: "",
  content: "",
  moveToListOnClose: false,
};

interface AdminBadgeEditClientProps {
  badgeId: string;
}

function ImageInsertIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="56"
      viewBox="0 0 56 56"
      width="56"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        fill="none"
        height="36"
        rx="4"
        stroke="#C8C8C8"
        strokeWidth="2"
        width="48"
        x="4"
        y="10"
      />
      <path
        d="M4 38l13-14 10 10 8-8 17 18"
        fill="none"
        stroke="#C8C8C8"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <circle cx="18" cy="24" fill="#C8C8C8" r="4" />
    </svg>
  );
}

export default function AdminBadgeEditClient({ badgeId }: AdminBadgeEditClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [badge, setBadge] = useState<AdminBadge | null>(null);
  const [badgeName, setBadgeName] = useState("");
  const [description, setDescription] = useState("");
  const [requiredPoint, setRequiredPoint] = useState("");
  const [status, setStatus] = useState<BadgeStatus>("ACTIVE");
  const [badgeImage, setBadgeImage] = useState<File | null>(null);
  const [badgeImagePreview, setBadgeImagePreview] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState(initialModal);

  const parsedRequiredPoint = useMemo(() => {
    const nextPoint = Number(requiredPoint);

    return Number.isFinite(nextPoint) ? nextPoint : 0;
  }, [requiredPoint]);

  useEffect(() => {
    let isMounted = true;

    const loadBadge = async () => {
      try {
        setLoading(true);
        const detail = await getAdminBadgeDetail(badgeId);

        if (!isMounted || !detail) {
          return;
        }

        setBadge(detail);
        setBadgeName(detail.badgeName ?? "");
        setDescription(detail.description ?? "");
        setRequiredPoint(String(detail.requiredPoint ?? 0));
        setStatus(detail.status ?? "ACTIVE");
        setBadgeImagePreview(detail.imageUrl ?? "");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        handleClientError(error, {
          router,
          fallbackTitle: "뱃지 조회 실패",
          fallbackMessage:
            "뱃지 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
          showModal: (title, content) =>
            setModal({ open: true, title, content, moveToListOnClose: true }),
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadBadge();

    return () => {
      isMounted = false;
    };
  }, [badgeId, router]);

  useEffect(() => {
    return () => {
      if (badgeImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(badgeImagePreview);
      }
    };
  }, [badgeImagePreview]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setModal({
        open: true,
        title: "이미지 형식 확인",
        content: "jpg, jpeg, png, webp 형식의 이미지만 등록할 수 있습니다.",
        moveToListOnClose: false,
      });
      event.target.value = "";
      return;
    }

    if (badgeImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(badgeImagePreview);
    }

    setBadgeImage(file);
    setBadgeImagePreview(URL.createObjectURL(file));
  };

  const validate = () => {
    if (!badgeName.trim()) return "배지 이름을 입력해 주세요.";
    if (!description.trim()) return "배지 설명을 입력해 주세요.";
    if (!requiredPoint.trim() || parsedRequiredPoint < 0) {
      return "지급 기준 포인트를 0 이상으로 입력해 주세요.";
    }
    if (!Number.isInteger(parsedRequiredPoint)) {
      return "지급 기준 포인트는 정수로 입력해 주세요.";
    }

    return null;
  };

  const handleSubmitClick = () => {
    const validationMessage = validate();

    if (validationMessage) {
      setModal({
        open: true,
        title: "입력 오류",
        content: validationMessage,
        moveToListOnClose: false,
      });
      return;
    }

    setConfirmOpen(true);
  };

  const handleUpdate = async () => {
    if (submitting) return;

    setConfirmOpen(false);
    setSubmitting(true);

    try {
      await updateAdminBadge(
        badgeId,
        {
          badgeName: badgeName.trim(),
          description: description.trim(),
          requiredPoint: parsedRequiredPoint,
          status,
        },
        badgeImage,
      );

      setModal({
        open: true,
        title: "수정 완료",
        content: "뱃지가 수정되었습니다.",
        moveToListOnClose: true,
      });
    } catch (error) {
      setModal({
        open: true,
        title: "수정 실패",
        content:
          error instanceof Error
            ? error.message
            : "뱃지를 수정하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        moveToListOnClose: false,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (submitting) return;

    setDeleteOpen(false);
    setSubmitting(true);

    try {
      await deleteAdminBadge(badgeId);
      setModal({
        open: true,
        title: "삭제 완료",
        content: "뱃지가 삭제되었습니다.",
        moveToListOnClose: true,
      });
    } catch (error) {
      setModal({
        open: true,
        title: "삭제 실패",
        content:
          error instanceof Error
            ? error.message
            : "뱃지를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        moveToListOnClose: false,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalClose = () => {
    const shouldMoveList = modal.moveToListOnClose;

    setModal(initialModal);

    if (shouldMoveList) {
      router.push("/admin/badges");
    }
  };

  if (loading) {
    return (
      <main className={badgeFormClasses.page}>
        <div className={badgeFormClasses.header}>
          <h1 className={badgeFormClasses.title}>뱃지 수정</h1>
        </div>
        <div className={badgeFormClasses.content}>
          <div className={badgeFormClasses.loading}>뱃지 정보를 불러오는 중입니다.</div>
        </div>
        <OneButtonModal
          isOpen={modal.open}
          modalContent={modal.content}
          modalTitle={modal.title}
          onClose={handleModalClose}
        />
      </main>
    );
  }

  if (!badge) {
    return (
      <main className={badgeFormClasses.page}>
        <div className={badgeFormClasses.header}>
          <h1 className={badgeFormClasses.title}>뱃지 수정</h1>
        </div>
        <div className={badgeFormClasses.content}>
          <div className={badgeFormClasses.loading}>뱃지 정보를 찾을 수 없습니다.</div>
        </div>
        <OneButtonModal
          isOpen={modal.open}
          modalContent={modal.content}
          modalTitle={modal.title}
          onClose={handleModalClose}
        />
      </main>
    );
  }

  return (
    <main className={badgeFormClasses.page}>
      <div className={badgeFormClasses.header}>
        <h1 className={badgeFormClasses.title}>뱃지 수정</h1>
      </div>

      <div className={badgeFormClasses.content}>
        <section className={badgeFormClasses.section}>
          <div className={badgeFormClasses.grid}>
            <div>
              <label className={badgeFormClasses.label} htmlFor="badge-image">
                배지 이미지
              </label>
              <button
                className={badgeFormClasses.imageButton}
                onClick={() => document.getElementById("badge-image")?.click()}
                type="button"
              >
                {badgeImagePreview ? (
                  <Image
                    alt="배지 이미지 미리보기"
                    className={badgeFormClasses.previewImage}
                    src={badgeImagePreview}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    unoptimized
                    {...optimizedImageProps}
                  />
                ) : (
                  <ImageInsertIcon />
                )}
              </button>
              <input
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                className={badgeFormClasses.hiddenInput}
                id="badge-image"
                onChange={handleImageChange}
                type="file"
              />
              <p className={badgeFormClasses.helper}>
                이미지를 바꾸지 않으면 기존 이미지가 유지됩니다.
              </p>
            </div>

            <div className={badgeFormClasses.fieldGroup}>
              <div>
                <label className={badgeFormClasses.label} htmlFor="badgeName">
                  배지 이름 *
                </label>
                <input
                  className={badgeFormClasses.input}
                  id="badgeName"
                  onChange={(event) => setBadgeName(event.target.value)}
                  value={badgeName}
                />
              </div>

              <div>
                <label
                  className={badgeFormClasses.label}
                  htmlFor="requiredPoint"
                >
                  지급 기준 포인트 *
                </label>
                <input
                  className={badgeFormClasses.input}
                  id="requiredPoint"
                  min={0}
                  onChange={(event) => setRequiredPoint(event.target.value)}
                  type="number"
                  value={requiredPoint}
                />
              </div>

              <div>
                <label className={badgeFormClasses.label} htmlFor="status">
                  상태 *
                </label>
                <select
                  className={badgeFormClasses.select}
                  id="status"
                  onChange={(event) => setStatus(event.target.value)}
                  value={status}
                >
                  <option value="ACTIVE">활성</option>
                  <option value="INACTIVE">비활성</option>
                </select>
              </div>

              <div>
                <label className={badgeFormClasses.label} htmlFor="description">
                  배지 설명 *
                </label>
                <textarea
                  className={badgeFormClasses.textarea}
                  id="description"
                  onChange={(event) => setDescription(event.target.value)}
                  value={description}
                />
              </div>
            </div>
          </div>
        </section>

        <div className={badgeFormClasses.buttonGroup}>
          <button
            className={badgeFormClasses.deleteButton}
            disabled={submitting}
            onClick={() => setDeleteOpen(true)}
            type="button"
          >
            삭제
          </button>
          <button
            className={badgeFormClasses.submitButton}
            disabled={submitting}
            onClick={handleSubmitClick}
            type="button"
          >
            {submitting ? "처리 중..." : "수정하기"}
          </button>
          <button
            className={badgeFormClasses.cancelButton}
            disabled={submitting}
            onClick={() => router.back()}
            type="button"
          >
            취소
          </button>
        </div>
      </div>

      <TwoButtonModal
        confirmDisabled={submitting}
        isOpen={confirmOpen}
        modalContent="뱃지 정보를 수정하시겠습니까?"
        modalTitle="뱃지 수정"
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleUpdate}
      />

      <WarningModal
        confirmDisabled={submitting}
        isOpen={deleteOpen}
        modalContent="삭제한 뱃지는 학생 화면에 노출되지 않습니다."
        modalTitle="뱃지를 삭제하시겠습니까?"
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />

      <OneButtonModal
        isOpen={modal.open}
        modalContent={modal.content}
        modalTitle={modal.title}
        onClose={handleModalClose}
      />
    </main>
  );
}
