"use client";

// CSR - 관리자 배지 등록: 이미지 파일 미리보기와 입력 검증이 필요한 운영자 폼 화면임
import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { optimizedImageProps } from "@/components/common/imageOptimization";
import OneButtonModal from "@/components/common/OneButtonModal";
import TwoButtonModal from "@/components/common/TwoButtonModal";

import { createAdminBadge } from "../actions";

const badgeFormClasses = {
  page: "min-h-screen bg-bg-main",
  header: "border-b border-border-light px-8 py-6",
  title: "m-0 text-xl font-bold text-text-primary",
  content: "max-w-6xl px-8 py-6",
  section: "mb-8",
  sectionTitle: "mb-5 mt-0 text-lg font-semibold text-text-primary",
  grid: "grid grid-cols-2 gap-8 max-lg:grid-cols-1",
  imageButton:
    "relative flex min-h-[320px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-base border border-border-light bg-bg-navbar text-description text-text-secondary transition hover:bg-bg-hover-gray",
  previewImage: "h-full w-full object-cover",
  hiddenInput: "hidden",
  fieldGroup: "flex flex-col gap-5",
  label: "mb-2 block text-body font-semibold text-text-primary",
  input:
    "h-11 w-full rounded-base border border-border-light bg-bg-box px-4 text-body text-text-primary outline-none placeholder:text-text-placeholder focus:border-button-blue-bg",
  textarea:
    "min-h-[150px] w-full resize-y rounded-base border border-border-light bg-bg-box p-4 text-body text-text-primary outline-none placeholder:text-text-placeholder focus:border-button-blue-bg",
  helper: "mt-2 text-description text-text-secondary",
  buttonGroup: "mt-10 flex justify-end gap-3 border-t border-border-light pt-6",
  submitButton:
    "cursor-pointer rounded-lg bg-button-blue-bg px-8 py-2.5 text-body font-medium text-text-white transition hover:bg-button-blue-hover-bg disabled:cursor-not-allowed disabled:opacity-60",
  cancelButton:
    "cursor-pointer rounded-lg border border-border-light bg-bg-box px-8 py-2.5 text-body font-medium text-text-secondary transition hover:bg-bg-hover-gray disabled:cursor-not-allowed disabled:opacity-60",
} as const;

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface ResultModalState {
  open: boolean;
  title: string;
  content: string;
  success: boolean;
}

const initialResultModal: ResultModalState = {
  open: false,
  title: "",
  content: "",
  success: false,
};

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

export default function AdminBadgeCreateClient() {
  const router = useRouter();
  const [badgeName, setBadgeName] = useState("");
  const [description, setDescription] = useState("");
  const [requiredPoint, setRequiredPoint] = useState("");
  const [badgeImage, setBadgeImage] = useState<File | null>(null);
  const [badgeImagePreview, setBadgeImagePreview] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resultModal, setResultModal] =
    useState<ResultModalState>(initialResultModal);

  const parsedRequiredPoint = useMemo(() => {
    const nextPoint = Number(requiredPoint);

    return Number.isFinite(nextPoint) ? nextPoint : 0;
  }, [requiredPoint]);

  useEffect(() => {
    return () => {
      if (badgeImagePreview) {
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
      setResultModal({
        open: true,
        title: "이미지 형식 확인",
        content: "jpg, jpeg, png, webp 형식의 이미지만 등록할 수 있습니다.",
        success: false,
      });
      event.target.value = "";
      return;
    }

    if (badgeImagePreview) {
      URL.revokeObjectURL(badgeImagePreview);
    }

    setBadgeImage(file);
    setBadgeImagePreview(URL.createObjectURL(file));
  };

  const validate = () => {
    if (!badgeName.trim()) {
      return "배지 이름을 입력해 주세요.";
    }

    if (!description.trim()) {
      return "배지 설명을 입력해 주세요.";
    }

    if (!requiredPoint.trim() || parsedRequiredPoint < 0) {
      return "지급 기준 포인트를 0 이상으로 입력해 주세요.";
    }

    if (!Number.isInteger(parsedRequiredPoint)) {
      return "지급 기준 포인트는 정수로 입력해 주세요.";
    }

    if (!badgeImage) {
      return "배지 이미지를 등록해 주세요.";
    }

    return null;
  };

  const handleSubmitClick = () => {
    const validationMessage = validate();

    if (validationMessage) {
      setResultModal({
        open: true,
        title: "입력 오류",
        content: validationMessage,
        success: false,
      });
      return;
    }

    setConfirmOpen(true);
  };

  const handleSubmit = async () => {
    if (!badgeImage || submitting) {
      return;
    }

    setConfirmOpen(false);
    setSubmitting(true);

    try {
      await createAdminBadge(
        {
          badgeName: badgeName.trim(),
          description: description.trim(),
          requiredPoint: parsedRequiredPoint,
        },
        badgeImage,
      );

      setResultModal({
        open: true,
        title: "등록 완료",
        content: "배지가 등록되었습니다.",
        success: true,
      });
    } catch (error) {
      setResultModal({
        open: true,
        title: "등록 실패",
        content:
          error instanceof Error
            ? error.message
            : "배지를 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        success: false,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResultModalClose = () => {
    const shouldMoveList = resultModal.success;

    setResultModal(initialResultModal);

    if (shouldMoveList) {
      router.push("/admin/badges");
    }
  };

  return (
    <main className={badgeFormClasses.page}>
      <div className={badgeFormClasses.header}>
        <h1 className={badgeFormClasses.title}>뱃지 등록</h1>
      </div>

      <div className={badgeFormClasses.content}>
        <section className={badgeFormClasses.section}>
          <div className={badgeFormClasses.grid}>
            <div>
              <label className={badgeFormClasses.label} htmlFor="badge-image">
                배지 이미지 *
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
                jpg, jpeg, png, webp 형식을 사용할 수 있습니다.
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
                  placeholder="예: 첫 정답 배지"
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
                  placeholder="예: 10"
                  type="number"
                  value={requiredPoint}
                />
              </div>

              <div>
                <label className={badgeFormClasses.label} htmlFor="description">
                  배지 설명 *
                </label>
                <textarea
                  className={badgeFormClasses.textarea}
                  id="description"
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="배지 지급 조건이나 설명을 입력해 주세요."
                  value={description}
                />
              </div>
            </div>
          </div>
        </section>

        <div className={badgeFormClasses.buttonGroup}>
          <button
            className={badgeFormClasses.submitButton}
            disabled={submitting}
            onClick={handleSubmitClick}
            type="button"
          >
            {submitting ? "등록 중..." : "등록하기"}
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
        modalContent={"등록한 배지는 사용자 랭킹과 배지 화면에서 사용될 수 있습니다.\n등록하시겠습니까?"}
        modalTitle="뱃지 등록"
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleSubmit}
      />

      <OneButtonModal
        isOpen={resultModal.open}
        modalContent={resultModal.content}
        modalTitle={resultModal.title}
        onClose={handleResultModalClose}
      />
    </main>
  );
}
