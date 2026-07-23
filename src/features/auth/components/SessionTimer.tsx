"use client";

import { useEffect, useRef, useState } from "react";

import { extendSession, getSession } from "../actions";

interface SessionTimerProps {
  /** 잔여 시간이 0이 되었을 때 호출 (자동 로그아웃 처리용) */
  onExpire?: () => void;
}

/** 초 → "MM:SS" 포맷 */
function formatTime(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * 로그인 세션의 잔여 시간을 표시하고, 임계값 이하로 떨어지면 연장 버튼을 노출한다.
 * 최초 진입 시 서버에서 잔여 시간을 받아오고, 이후 1초 단위로 클라이언트에서 카운트다운한다.
 */
export default function SessionTimer({ onExpire }: SessionTimerProps) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [extendable, setExtendable] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const expiredRef = useRef(false);

  // 최초 세션 조회
  useEffect(() => {
    let active = true;
    getSession()
      .then((data) => {
        if (!active) return;
        setRemaining(data.remainingSeconds);
        setExtendable(data.extendable);
      })
      .catch(() => {
        // 세션 조회 실패(비로그인·만료 등)는 타이머를 숨김 처리
        if (active) setRemaining(null);
      });
    return () => {
      active = false;
    };
  }, []);

  // 1초 단위 카운트다운
  useEffect(() => {
    if (remaining === null) return;
    intervalRef.current = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          if (intervalRef.current) window.clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [remaining === null]);

  // 잔여 시간이 0에 도달하면 1회만 만료 콜백 실행
  useEffect(() => {
    if (remaining === 0 && !expiredRef.current) {
      expiredRef.current = true;
      onExpire?.();
    }
  }, [remaining, onExpire]);

  const handleExtend = async () => {
    if (isExtending) return;
    setIsExtending(true);
    try {
      const data = await extendSession();
      expiredRef.current = false;
      setRemaining(data.remainingSeconds);
      setExtendable(data.extendable);
    } catch {
      // 연장 실패 시 잔여 시간은 그대로 유지
    } finally {
      setIsExtending(false);
    }
  };

  if (remaining === null) return null;

  const isUrgent = remaining <= 60;
  const showExtend = extendable && remaining > 0;

  return (
    <div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
      <svg
        className={`w-4 h-4 shrink-0 ${isUrgent ? "text-[#fb2c36]" : "text-[#6b7280]"}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
      <span
        className={`font-semibold tabular-nums ${isUrgent ? "text-[#fb2c36]" : "text-[#1f2937]"}`}
        aria-label={`세션 잔여 시간 ${formatTime(remaining)}`}
      >
        {formatTime(remaining)}
      </span>
      {showExtend && (
        <button
          type="button"
          onClick={handleExtend}
          disabled={isExtending}
          className="ml-1 min-w-16 text-center rounded-md border border-[#1a237e] px-2 py-0.5 text-xs font-medium text-[#1a237e] hover:bg-[#1a237e] hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isExtending ? "연장 중…" : "연장"}
        </button>
      )}
    </div>
  );
}
