"use client";

import type { KeyboardEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  List,
  ListSkeleton,
  OneButtonModal,
  TwoButtonModal,
  WarningModal,
  type ListColumn,
} from "@/components/common";
import { handleClientError } from "@/lib/errorHandling";

import {
  createAdminProblemCategory,
  deleteAdminProblemCategory,
  getAdminProblemCategories,
  updateAdminProblemCategory,
} from "../actions";
import { adminCategoryClasses } from "../../operations/styles";
import type { AdminProblemCategory } from "../../operations/types";

const CATEGORY_COLUMNS = ["번호", "카테고리 이름", "상태", "관리"] as const;
const CATEGORY_NAME_MAX_LENGTH = 50;

type NoticeModalState = {
  isOpen: boolean;
  title: string;
  content: string;
};

type EditConfirmState = {
  category: AdminProblemCategory;
  categoryName: string;
} | null;

type DeleteConfirmState = AdminProblemCategory | null;

function getStatusLabel(status: AdminProblemCategory["status"]) {
  return status === "ACTIVE" ? "활성" : "비활성";
}

function normalizeName(value: string) {
  return value.trim();
}

function hasCategoryNameChanged(
  category: AdminProblemCategory,
  nextCategoryName: string,
) {
  return normalizeName(nextCategoryName) !== category.categoryName;
}

function upsertCategory(
  categories: AdminProblemCategory[],
  category: AdminProblemCategory,
) {
  const exists = categories.some(
    (item) => item.categoryId === category.categoryId,
  );

  if (!exists) {
    return [category, ...categories];
  }

  return categories.map((item) =>
    item.categoryId === category.categoryId ? category : item,
  );
}

export default function AdminCategoryClient() {
  const router = useRouter();
  const [categories, setCategories] = useState<AdminProblemCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(
    null,
  );
  const [editName, setEditName] = useState("");
  const [editConfirm, setEditConfirm] = useState<EditConfirmState>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>(null);
  const [noticeModal, setNoticeModal] = useState<NoticeModalState>({
    isOpen: false,
    title: "",
    content: "",
  });

  useEffect(() => {
    const controller = new AbortController();

    const fetchCategories = async () => {
      try {
        setLoading(true);
        const result = await getAdminProblemCategories(controller.signal);

        if (controller.signal.aborted) {
          return;
        }

        setCategories(result.data ?? []);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        handleClientError(error, {
          router,
          fallbackTitle: "카테고리 조회 실패",
          fallbackMessage:
            "카테고리 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
          showModal: (title, content) =>
            setNoticeModal({ isOpen: true, title, content }),
        });
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void fetchCategories();

    return () => {
      controller.abort();
    };
  }, [router]);

  const startEdit = (category: AdminProblemCategory) => {
    setEditingCategoryId(category.categoryId);
    setEditName(category.categoryName);
  };

  const cancelEdit = () => {
    setEditingCategoryId(null);
    setEditName("");
    setEditConfirm(null);
  };

  const requestEdit = (category: AdminProblemCategory) => {
    const nextName = normalizeName(editName);

    if (!nextName || nextName === category.categoryName) {
      cancelEdit();
      return;
    }

    setEditConfirm({ category, categoryName: nextName });
  };

  const handleEditKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    category: AdminProblemCategory,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      requestEdit(category);
    }

    if (event.key === "Escape") {
      cancelEdit();
    }
  };

  const handleCreateKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void handleCreateCategory();
    }

    if (event.key === "Escape" && !processing) {
      closeCreateModal();
    }
  };

  const closeCreateModal = () => {
    setCreateModalOpen(false);
    setCreateName("");
  };

  const handleCreateCategory = async () => {
    const nextName = normalizeName(createName);

    if (!nextName || processing) {
      return;
    }

    setProcessing(true);

    try {
      const result = await createAdminProblemCategory(nextName);

      if (result.data) {
        setCategories((prev) => upsertCategory(prev, result.data!));
      }

      closeCreateModal();
      setNoticeModal({
        isOpen: true,
        title: "카테고리 등록 완료",
        content: "새 카테고리가 등록되었습니다.",
      });
    } catch (error) {
      handleClientError(error, {
        router,
        fallbackTitle: "카테고리 등록 실패",
        fallbackMessage:
          "카테고리를 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        showModal: (title, content) =>
          setNoticeModal({ isOpen: true, title, content }),
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editConfirm || processing) {
      return;
    }

    setProcessing(true);

    try {
      const result = await updateAdminProblemCategory(
        editConfirm.category.categoryId,
        editConfirm.categoryName,
      );
      const updatedCategory = result.data ?? {
        ...editConfirm.category,
        categoryName: editConfirm.categoryName,
      };

      setCategories((prev) => upsertCategory(prev, updatedCategory));
      cancelEdit();
      setNoticeModal({
        isOpen: true,
        title: "카테고리 수정 완료",
        content: "카테고리 이름이 수정되었습니다.",
      });
    } catch (error) {
      setEditConfirm(null);
      handleClientError(error, {
        router,
        fallbackTitle: "카테고리 수정 실패",
        fallbackMessage:
          "카테고리 이름을 수정하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        showModal: (title, content) =>
          setNoticeModal({ isOpen: true, title, content }),
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteConfirm || processing) {
      return;
    }

    setProcessing(true);

    try {
      const result = await deleteAdminProblemCategory(deleteConfirm.categoryId);
      const deletedCategory = result.data ?? {
        ...deleteConfirm,
        status: "INACTIVE" as const,
      };

      setCategories((prev) => upsertCategory(prev, deletedCategory));
      setDeleteConfirm(null);
      setNoticeModal({
        isOpen: true,
        title: "카테고리 삭제 완료",
        content: "카테고리가 비활성 처리되었습니다.",
      });
    } catch (error) {
      setDeleteConfirm(null);
      handleClientError(error, {
        router,
        fallbackTitle: "카테고리 삭제 실패",
        fallbackMessage:
          "카테고리를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        showModal: (title, content) =>
          setNoticeModal({ isOpen: true, title, content }),
      });
    } finally {
      setProcessing(false);
    }
  };

  const categoryColumns: ListColumn<AdminProblemCategory>[] = [
    {
      key: "index",
      label: CATEGORY_COLUMNS[0],
      width: "72px",
    },
    {
      key: "categoryName",
      label: CATEGORY_COLUMNS[1],
      render: (category) =>
        editingCategoryId === category.categoryId ? (
          <input
            aria-label="카테고리 이름"
            autoFocus
            className={adminCategoryClasses.nameInput}
            disabled={processing}
            maxLength={CATEGORY_NAME_MAX_LENGTH}
            onChange={(event) => setEditName(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => handleEditKeyDown(event, category)}
            value={editName}
          />
        ) : (
          category.categoryName
        ),
    },
    {
      key: "status",
      label: CATEGORY_COLUMNS[2],
      render: (category) => (
        <span
          className={
            category.status === "ACTIVE"
              ? adminCategoryClasses.statusActive
              : adminCategoryClasses.statusInactive
          }
        >
          {getStatusLabel(category.status)}
        </span>
      ),
      width: "120px",
    },
    {
      key: "actions",
      label: CATEGORY_COLUMNS[3],
      render: (category) => {
        const isEditing = editingCategoryId === category.categoryId;

        if (isEditing) {
          return (
            <div className={adminCategoryClasses.actionGroup}>
              <button
                className={adminCategoryClasses.editButton}
                disabled={
                  processing ||
                  !normalizeName(editName) ||
                  !hasCategoryNameChanged(category, editName)
                }
                onClick={(event) => {
                  event.stopPropagation();
                  requestEdit(category);
                }}
                type="button"
              >
                저장
              </button>
              <button
                className={adminCategoryClasses.cancelButton}
                disabled={processing}
                onClick={(event) => {
                  event.stopPropagation();
                  cancelEdit();
                }}
                type="button"
              >
                취소
              </button>
            </div>
          );
        }

        return (
          <div className={adminCategoryClasses.actionGroup}>
            <button
              className={adminCategoryClasses.editButton}
              disabled={processing}
              onClick={(event) => {
                event.stopPropagation();
                startEdit(category);
              }}
              type="button"
            >
              수정
            </button>
            <button
              className={adminCategoryClasses.deleteButton}
              disabled={processing || category.status === "INACTIVE"}
              onClick={(event) => {
                event.stopPropagation();
                setDeleteConfirm(category);
              }}
              type="button"
            >
              삭제
            </button>
          </div>
        );
      },
      width: "180px",
    },
  ];

  return (
    <>
      <section className={adminCategoryClasses.container}>
        <div className={adminCategoryClasses.header}>
          <h1 className={adminCategoryClasses.title}>카테고리 관리</h1>
          <button
            className={adminCategoryClasses.createButton}
            disabled={loading || processing}
            onClick={() => setCreateModalOpen(true)}
            type="button"
          >
            등록하기
          </button>
        </div>

        {loading ? (
          <ListSkeleton
            columns={[...CATEGORY_COLUMNS]}
            rowCount={8}
            statusMessage="카테고리 목록을 불러오는 중입니다."
          />
        ) : (
          <List
            columns={categoryColumns}
            data={categories}
            emptyMessage="조회된 카테고리가 없습니다."
            rowClassName={(category) =>
              category.status === "INACTIVE"
                ? adminCategoryClasses.inactiveRow
                : ""
            }
            rowKey={(category) => category.categoryId}
          />
        )}
      </section>

      <CategoryNameModal
        disabled={processing || !normalizeName(createName)}
        isOpen={createModalOpen}
        onChange={setCreateName}
        onClose={() => {
          if (!processing) {
            closeCreateModal();
          }
        }}
        onConfirm={handleCreateCategory}
        onKeyDown={handleCreateKeyDown}
        title="카테고리 등록"
        value={createName}
      />

      <TwoButtonModal
        cancelDisabled={processing}
        confirmDisabled={processing}
        isOpen={Boolean(editConfirm)}
        modalContent={
          editConfirm
            ? `카테고리 이름을 "${editConfirm.categoryName}"(으)로 변경합니다.`
            : ""
        }
        modalTitle="카테고리 이름을 수정하시겠습니까?"
        onClose={() => {
          if (!processing) {
            setEditConfirm(null);
          }
        }}
        onConfirm={handleUpdateCategory}
      />

      <WarningModal
        cancelDisabled={processing}
        confirmDisabled={processing}
        isOpen={Boolean(deleteConfirm)}
        modalContent={
          deleteConfirm
            ? `"${deleteConfirm.categoryName}" 카테고리를 삭제합니다.`
            : ""
        }
        modalTitle="카테고리를 삭제하시겠습니까?"
        onClose={() => {
          if (!processing) {
            setDeleteConfirm(null);
          }
        }}
        onConfirm={handleDeleteCategory}
      />

      <OneButtonModal
        isOpen={noticeModal.isOpen}
        modalContent={noticeModal.content}
        modalTitle={noticeModal.title}
        onClose={() =>
          setNoticeModal({
            isOpen: false,
            title: "",
            content: "",
          })
        }
      />
    </>
  );
}

function CategoryNameModal({
  disabled,
  isOpen,
  onChange,
  onClose,
  onConfirm,
  onKeyDown,
  title,
  value,
}: {
  disabled: boolean;
  isOpen: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  title: string;
  value: string;
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={adminCategoryClasses.modalOverlay} onClick={onClose}>
      <div
        className={adminCategoryClasses.modalContainer}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className={adminCategoryClasses.modalTitle}>{title}</h2>
        <label
          className={adminCategoryClasses.modalLabel}
          htmlFor="categoryName"
        >
          카테고리 이름
        </label>
        <input
          autoFocus
          className={adminCategoryClasses.modalInput}
          id="categoryName"
          maxLength={CATEGORY_NAME_MAX_LENGTH}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="카테고리 이름을 입력하세요"
          value={value}
        />
        <div className={adminCategoryClasses.modalActions}>
          <button
            className={adminCategoryClasses.modalPrimaryButton}
            disabled={disabled}
            onClick={onConfirm}
            type="button"
          >
            등록하기
          </button>
          <button
            className={adminCategoryClasses.modalCancelButton}
            onClick={onClose}
            type="button"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
