"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import BluebombLogo from "../../../public/assets/img/bluebomb-Icon.svg";
import BadgeSelectModal from "@/features/badge/components/BadgeSelectModal";
import { optimizedImageProps } from "@/components/common/imageOptimization";
import { equipBadge, getMyBadges, syncMyBadges } from "@/features/badge/actions";
import type { MyBadge } from "@/features/badge/types";
import OneButtonModal from "@/components/common/OneButtonModal";
import { ChatRoomListSkeleton } from "@/features/chat/components/ChatPageSkeleton";
import { mobileSidebarClasses } from "./mobileSidebarClasses";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

type ProblemState = "LOCKED" | "UNSOLVED" | "CORRECT" | "WRONG";

interface ChatRoom {
  roomId: number;
  title: string;
  updatedAt: string;
}

interface SidebarProps {
  isOpen?: boolean;
  userNickname?: string;
  variant?: "default" | "problem-detail";
  problemSet?: {
    problems?: Array<{ problemId?: number; title: string }>;
  };
  currentIndex?: number;
  problemStates?: ProblemState[];
  canMoveProblem?: (index: number) => boolean;
  moveProblem?: (index: number) => void;
  getProblemButtonClass?: (
    state: ProblemState | undefined,
    isCurrent: boolean,
  ) => string;
}

function getStoredValue(key: string) {
  if (typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem(key) || "";
}

export default function Sidebar({
  isOpen = false,
  userNickname: propsNickname,
  variant,
  problemSet,
  currentIndex = 0,
  problemStates = [],
  canMoveProblem,
  moveProblem,
  getProblemButtonClass,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isAdminPath = pathname.startsWith("/admin");
  const isMypage = pathname.startsWith("/user/profile");
  const isChatPage =
    pathname.startsWith("/chat") || pathname.startsWith("/user/chat");

  const [nickname, setNickname] = useState(propsNickname || "닉네임");
  const [userRole, setUserRole] = useState("");
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [chatRoomsLoading, setChatRoomsLoading] = useState(isChatPage);
  const [myBadges, setMyBadges] = useState<MyBadge[]>([]);
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [badgesLoading, setBadgesLoading] = useState(false);
  const [badgesFetchFailed, setBadgesFetchFailed] = useState(false);
  const [equipError, setEquipError] = useState("");
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const updateUserInfo = () => {
      setNickname(propsNickname || getStoredValue("userNickname") || "닉네임");
      setUserRole(getStoredValue("userRole"));
    };

    updateUserInfo(); // 마운트 직후 1회 주입 (hydration 이후라 안전)
    window.addEventListener("loginSuccess", updateUserInfo);
    window.addEventListener("storage", updateUserInfo);

    return () => {
      window.removeEventListener("loginSuccess", updateUserInfo);
      window.removeEventListener("storage", updateUserInfo);
    };
  }, [propsNickname]);

  useEffect(() => {
    if (!isMypage) return;

    const fetchBadges = async () => {
      try {
        setBadgesLoading(true);
        setBadgesFetchFailed(false);
        const badges = await getMyBadges();

        setMyBadges(badges);
        const equipped = badges.find((b) => b.isEquipped);
        localStorage.setItem("equippedBadgeUrl", equipped?.imageUrl ?? "");
        window.dispatchEvent(new Event("badgeChanged"));
      } catch {
        setBadgesFetchFailed(true);
      } finally {
        setBadgesLoading(false);
      }
    };

    void fetchBadges();
  }, [isMypage]);

  useEffect(() => {
    if (!isChatPage) return;

    const fetchChatRooms = async (showLoading: boolean) => {
      try {
        if (showLoading) {
          setChatRoomsLoading(true);
        }

        const response = await fetch(`${BASE_URL}/api/v1/chat/list`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("채팅방 목록 조회 실패");
        }

        const result = (await response.json()) as { data?: ChatRoom[] };
        const sortedRooms = [...(result.data ?? [])].sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );

        setChatRooms(sortedRooms);
      } catch (error) {
        console.error(error);
      } finally {
        setChatRoomsLoading(false);
      }
    };
    const refreshChatRooms = () => {
      void fetchChatRooms(false);
    };

    void fetchChatRooms(true);
    window.addEventListener("chatRoomUpdated", refreshChatRooms);

    return () => {
      window.removeEventListener("chatRoomUpdated", refreshChatRooms);
    };
  }, [isChatPage]);

  const equippedBadge = myBadges.find((b) => b.isEquipped);

  const handleBadgeSelect = async (badge: MyBadge) => {
    try {
      const updated = await equipBadge(badge.badgeId);
      setMyBadges((prev) =>
        prev.map((b) => ({ ...b, isEquipped: b.badgeId === updated.badgeId })),
      );
      localStorage.setItem("equippedBadgeUrl", updated.imageUrl ?? "");
      window.dispatchEvent(new Event("badgeChanged"));
      setBadgeModalOpen(false);
    } catch {
      setEquipError("뱃지 장착에 실패했어요. 다시 시도해 주세요.");
    }
  };

  // 수동 동기화 — 서버에서 뱃지 재계산 후 최신 목록 재조회 (자동 등록 누락 대비)
  const handleBadgeSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await syncMyBadges();
      const badges = await getMyBadges();
      setMyBadges(badges);
      const equipped = badges.find((b) => b.isEquipped);
      localStorage.setItem("equippedBadgeUrl", equipped?.imageUrl ?? "");
      window.dispatchEvent(new Event("badgeChanged"));
    } catch {
      setEquipError("뱃지 동기화에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setSyncing(false);
    }
  };

  const itemBaseClass =
    "block w-full text-left px-4 py-2.5 rounded-lg text-base font-semibold text-[#4b5563] hover:bg-[#f3f4f6] hover:text-[#1a237e] transition-all cursor-pointer";
  const itemActiveClass =
    "block w-full text-left px-4 py-2.5 rounded-lg text-base font-bold bg-[#1a237e] text-white transition-all cursor-pointer";

  const adminMenu = (
    <div className="w-full flex flex-col gap-5">
      <div className="flex flex-col items-start px-2 py-1">
        <span className="text-lg font-bold text-[#1f2937]">관리자 메뉴</span>
      </div>
      <hr className="border-[#f3f4f6] -mt-2" />

      <ul className="flex flex-col gap-1">
        {userRole === "OPERATOR" && (
          <>
            <li>
              <Link
                className={
                  pathname === "/admin/courses"
                    ? itemActiveClass
                    : itemBaseClass
                }
                href="/admin/courses"
              >
                강좌 관리
              </Link>
            </li>
            <li>
              <Link
                className={
                  pathname === "/admin/problems"
                    ? itemActiveClass
                    : itemBaseClass
                }
                href="/admin/problems"
              >
                문제 관리
              </Link>
            </li>
            <li>
              <Link
                className={
                  pathname.startsWith("/admin/badges")
                    ? itemActiveClass
                    : itemBaseClass
                }
                href="/admin/badges"
              >
                뱃지 관리
              </Link>
            </li>
          </>
        )}

        {(userRole === "MASTER" || userRole === "ADMIN") && (
          <>
            <li>
              <Link
                className={
                  pathname === "/admin/rules" ? itemActiveClass : itemBaseClass
                }
                href="/admin/rules"
              >
                규칙 관리
              </Link>
            </li>
            <li>
              <Link
                className={
                  pathname === "/admin/alrams" ? itemActiveClass : itemBaseClass
                }
                href="/admin/alrams"
              >
                알람 관리
              </Link>
            </li>
            <li>
              <Link
                className={
                  pathname === "/admin/users" ? itemActiveClass : itemBaseClass
                }
                href="/admin/users"
              >
                회원 관리
              </Link>
            </li>
            {userRole === "MASTER" && (
              <li>
                <Link
                  className={
                    pathname === "/admin/master"
                      ? itemActiveClass
                      : itemBaseClass
                  }
                  href="/admin/master"
                >
                  관리자 관리
                </Link>
              </li>
            )}
          </>
        )}
      </ul>
    </div>
  );

  const mypageMenu = (
    <div className="w-full flex flex-col gap-5">
      <div className="flex items-center gap-3 px-2 py-1">
        <button
          aria-label="대표 뱃지 변경"
          className="w-12 h-12 rounded-full bg-bg-box border border-border-light flex items-center justify-center overflow-hidden shrink-0 shadow-sm cursor-pointer hover:ring-2 hover:ring-text-blue transition-all"
          onClick={() => setBadgeModalOpen(true)}
          type="button"
        >
          {equippedBadge?.imageUrl ? (
            <Image
              alt="장착 뱃지"
              className="w-full h-full object-cover"
              height={48}
              src={equippedBadge.imageUrl}
              width={48}
              sizes="48px"
              {...optimizedImageProps}
            />
          ) : (
            <Image
              alt="프로필"
              className="w-8 h-8 object-contain text-[#1a237e]"
              src={BluebombLogo}
            />
          )}
        </button>
        <span className="text-lg font-bold text-[#1f2937] tracking-tight">
          {nickname}
        </span>
      </div>
      <hr className="border-[#f3f4f6] -mt-2" />

      <ul className="flex flex-col gap-1">
        <li>
          <Link
            className={
              pathname === "/user/profile" ? itemActiveClass : itemBaseClass
            }
            href="/user/profile"
          >
            프로필 정보
          </Link>
        </li>
        <li>
          <Link
            className={
              pathname === "/user/profile/security"
                ? itemActiveClass
                : itemBaseClass
            }
            href="/user/profile/security"
          >
            보안
          </Link>
        </li>
      </ul>
    </div>
  );

  const problemDetailMenu = (
    <div className="w-full flex flex-col gap-4">
      <h3 className="text-base font-bold text-[#1f2937] px-2">
        전체 문제 {currentIndex + 1}/{problemSet?.problems?.length ?? 0}
      </h3>
      <ul className="flex flex-col gap-1.5 max-h-[60vh] overflow-y-auto pr-1">
        {problemSet?.problems?.map((problem, index) => {
          const state = problemStates[index];
          const locked = canMoveProblem ? !canMoveProblem(index) : false;
          const buttonClass =
            getProblemButtonClass?.(state, currentIndex === index) ?? "";

          return (
            <li key={problem.problemId ?? index}>
              <button
                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors font-medium flex items-center justify-between cursor-pointer ${buttonClass} ${
                  locked
                    ? "bg-[#f3f4f6] text-[#9ca3af] cursor-not-allowed opacity-60"
                    : ""
                }`}
                disabled={locked}
                onClick={() => moveProblem?.(index)}
                type="button"
              >
                <span className="truncate">{problem.title}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );

  const chatMenu = (
    <div className="w-full flex flex-col gap-4">
      <button
        className="w-full h-11 bg-[#1a237e] text-white rounded-lg flex items-center justify-center font-semibold text-sm cursor-pointer hover:bg-[#111751] transition-colors shadow-sm"
        onClick={() => router.push("/chat")}
        type="button"
      >
        + 새 대화 시작
      </button>
      <h3 className="text-sm font-bold text-[#6b7280] px-2 mt-2">기존 대화</h3>
      <ul className="flex flex-col gap-1 max-h-[50vh] overflow-y-auto">
        {chatRoomsLoading ? (
          <ChatRoomListSkeleton />
        ) : (
          chatRooms.map((room) => (
            <li key={room.roomId}>
              <Link
                className={
                  pathname === `/chat/${room.roomId}` ||
                  pathname === `/user/chat/${room.roomId}`
                    ? itemActiveClass
                    : itemBaseClass
                }
                href={`/chat/${room.roomId}`}
              >
                <span className="block truncate">{room.title}</span>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );

  if (variant === "problem-detail") {
    return (
      <aside
        className={`w-65 shrink-0 bg-white border border-[#e8e8e8] rounded-xl p-5 sticky top-20 transition-all duration-300 ${
          isOpen
            ? mobileSidebarClasses.overlayAsideOpen
            : mobileSidebarClasses.overlayAsideClosed
        }`}
      >
        {problemDetailMenu}
      </aside>
    );
  }

  if (!isAdminPath && !isMypage && !isChatPage) {
    return null;
  }

  return (
    <>
      {badgeModalOpen && (
        <BadgeSelectModal
          badges={myBadges}
          fetchFailed={badgesFetchFailed}
          loading={badgesLoading}
          syncing={syncing}
          onClose={() => setBadgeModalOpen(false)}
          onSelect={handleBadgeSelect}
          onSync={handleBadgeSync}
        />
      )}
      <OneButtonModal
        isOpen={!!equipError}
        modalTitle="뱃지 알림"
        modalContent={equipError}
        onClose={() => setEquipError("")}
      />
      <aside
        className={`w-60 shrink-0 bg-white border border-[#e8e8e8] rounded-xl p-5 h-fit mt-10 sticky top-24 transition-all duration-300 ${
          isOpen
            ? mobileSidebarClasses.overlayAsideOpen
            : mobileSidebarClasses.overlayAsideClosed
        }`}
      >
        {isAdminPath && adminMenu}
        {isMypage && mypageMenu}
        {isChatPage && chatMenu}
      </aside>
    </>
  );
}
