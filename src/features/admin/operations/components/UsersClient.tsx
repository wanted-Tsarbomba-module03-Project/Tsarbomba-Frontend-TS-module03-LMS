"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  List,
  ListSkeleton,
  OneButtonModal,
  Pagination,
  Searchbar,
  type ListColumn,
} from "@/components/common";
import { handleClientError } from "@/lib/errorHandling";

import { getAdminUsers, getAllAdminUsers } from "../actions";
import {
  ACCOUNT_LOCK_STATUS_LABEL,
  ADMIN_USER_LIST_COLUMN_LABELS,
  ADMIN_USER_PAGE_SIZE,
} from "../constants";
import { adminUserListClasses } from "../styles";
import type { AdminUserSummary } from "../types";

const userColumns: ListColumn<AdminUserSummary>[] = [
  { key: "index", label: ADMIN_USER_LIST_COLUMN_LABELS[0] },
  { key: "name", label: ADMIN_USER_LIST_COLUMN_LABELS[1] },
  { key: "nickname", label: ADMIN_USER_LIST_COLUMN_LABELS[2] },
  { key: "email", label: ADMIN_USER_LIST_COLUMN_LABELS[3] },
  {
    key: "createdAt",
    label: ADMIN_USER_LIST_COLUMN_LABELS[4],
    render: (user) => formatDate(user.createdAt),
  },
  {
    key: "isLocked",
    label: ADMIN_USER_LIST_COLUMN_LABELS[5],
    render: (user) =>
      user.isLocked
        ? ACCOUNT_LOCK_STATUS_LABEL.locked
        : ACCOUNT_LOCK_STATUS_LABEL.unlocked,
  },
];

function matchesUserName(user: AdminUserSummary, keyword: string) {
  const normalizedKeyword = keyword.trim().toLowerCase();

  if (!normalizedKeyword) {
    return true;
  }

  return (user.name ?? "").toLowerCase().includes(normalizedKeyword);
}

export default function UsersClient() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [searchUsers, setSearchUsers] = useState<AdminUserSummary[] | null>(
    null,
  );
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [noticeModal, setNoticeModal] = useState({
    isOpen: false,
    title: "",
    content: "",
  });

  useEffect(() => {
    if (keyword.trim()) {
      return;
    }

    const controller = new AbortController();

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const result = await getAdminUsers(
          page,
          ADMIN_USER_PAGE_SIZE,
          controller.signal,
        );

        if (controller.signal.aborted) {
          return;
        }

        setUsers(result.data?.content ?? []);
        setSearchUsers(null);
        setTotalPages(result.data?.totalPages ?? 1);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("회원 목록 조회 실패:", error);
        handleClientError(error, {
          router,
          fallbackTitle: "회원 목록을 불러오지 못했습니다",
          fallbackMessage: "잠시 후 다시 시도해 주세요.",
          showModal: (title, content) =>
            setNoticeModal({
              isOpen: true,
              title,
              content,
            }),
        });
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void fetchUsers();

    return () => {
      controller.abort();
    };
  }, [keyword, page, router]);

  useEffect(() => {
    const normalizedKeyword = keyword.trim();

    if (!normalizedKeyword) {
      return;
    }

    const controller = new AbortController();

    const fetchUsers = async () => {
      try {
        setLoading(true);
        setSearchUsers([]);
        setTotalPages(1);
        const allUsers = await getAllAdminUsers(
          ADMIN_USER_PAGE_SIZE,
          controller.signal,
        );

        if (controller.signal.aborted) {
          return;
        }

        const filteredUsers = allUsers.filter((user) =>
          matchesUserName(user, normalizedKeyword),
        );

        setSearchUsers(filteredUsers);
        setTotalPages(
          Math.max(Math.ceil(filteredUsers.length / ADMIN_USER_PAGE_SIZE), 1),
        );
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setSearchUsers([]);
        setTotalPages(1);
        console.error("회원 목록 조회 실패:", error);
        handleClientError(error, {
          router,
          fallbackTitle: "회원 목록을 불러오지 못했습니다",
          fallbackMessage: "잠시 후 다시 시도해 주세요.",
          showModal: (title, content) =>
            setNoticeModal({
              isOpen: true,
              title,
              content,
            }),
        });
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void fetchUsers();

    return () => {
      controller.abort();
    };
  }, [keyword, router]);

  const visibleUsers = useMemo(() => {
    if (!keyword.trim()) {
      return users;
    }

    const start = page * ADMIN_USER_PAGE_SIZE;

    return (searchUsers ?? []).slice(start, start + ADMIN_USER_PAGE_SIZE);
  }, [keyword, page, searchUsers, users]);

  const handleSearch = (nextKeyword: string) => {
    setPage(0);
    setKeyword(nextKeyword);
  };

  return (
    <>
      <div className={adminUserListClasses.container}>
        <div className={adminUserListClasses.header}>
          <h1 className={adminUserListClasses.title}>회원 관리</h1>

          <div className={adminUserListClasses.searchWrap}>
            <Searchbar
              className="max-w-[260px]"
              onChange={setSearchInput}
              onSearch={handleSearch}
              placeholder="회원 이름 검색"
              value={searchInput}
            />
          </div>
        </div>

        {loading ? (
          <ListSkeleton
            columns={[...ADMIN_USER_LIST_COLUMN_LABELS]}
            rowCount={ADMIN_USER_PAGE_SIZE}
            statusMessage="회원 목록을 불러오는 중입니다."
          />
        ) : (
          <List
            columns={userColumns}
            data={visibleUsers}
            emptyMessage={
              keyword.trim()
                ? "검색 조건에 맞는 회원이 없습니다."
                : "조회된 회원이 없습니다."
            }
            onRowClick={(user) => router.push(`/admin/users/${user.userId}`)}
            pagination={
              <Pagination
                currentPage={page}
                disabled={loading}
                onPageChange={setPage}
                totalPages={totalPages}
              />
            }
            rowNumberOffset={page * ADMIN_USER_PAGE_SIZE}
            rowKey={(user) => user.userId}
          />
        )}
      </div>

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

function formatDate(value?: string | null) {
  return value?.split("T")[0] ?? "-";
}
