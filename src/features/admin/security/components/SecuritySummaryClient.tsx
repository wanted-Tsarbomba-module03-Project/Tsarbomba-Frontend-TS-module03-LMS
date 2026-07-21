"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import LoadingIndicator from "@/components/common/LoadingIndicator";
import OneButtonModal from "@/components/common/OneButtonModal";
import TwoButtonModal from "@/components/common/TwoButtonModal";
import { ApiClientError, handleClientError } from "@/lib/errorHandling";

import {
  getSecurityBriefing,
  getSecuritySummary,
  regenerateSecurityBriefing,
  toggleUserLock,
} from "../actions";
import type { Briefing, SecurityPeriod, SecuritySummary } from "../types";
import { securityClasses as s } from "../styles";
import AiBriefingCard from "./AiBriefingCard";
import DomainEventBar from "./DomainEventBar";
import HttpAnomalyList from "./HttpAnomalyList";
import RiskIpTable from "./RiskIpTable";
import SecurityKpiTiles from "./SecurityKpiTiles";

const PERIOD_TABS: { value: SecurityPeriod; label: string }[] = [
  { value: "today", label: "오늘" },
  { value: "week", label: "7일" },
  { value: "2m", label: "2개월" },
];

// ISO → "HH:mm"
function timeLabel(iso?: string): string {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

interface ModalState {
  title: string;
  content: string;
}

export default function SecuritySummaryClient() {
  const router = useRouter();

  const [period, setPeriod] = useState<SecurityPeriod>("today");
  const [summary, setSummary] = useState<SecuritySummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(false);

  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const [lockTarget, setLockTarget] = useState<{
    ip: string;
    userId: number;
  } | null>(null);
  const [lockingKey, setLockingKey] = useState<string | null>(null);
  const [resultModal, setResultModal] = useState<ModalState | null>(null);

  // 기간 탭 전환 시 summary만 재호출 (브리핑은 탭 무관 최신본 유지)
  useEffect(() => {
    const controller = new AbortController();

    const fetchSummary = async () => {
      setSummaryLoading(true);
      setSummaryError(false);
      try {
        const res = await getSecuritySummary(period, controller.signal);
        setSummary(res.data ?? null);
      } catch (error) {
        if (controller.signal.aborted) return;
        setSummaryError(true);
        // 공용 에러 처리 — 페이지 에러(401/403/404/500)는 공용 에러 페이지로,
        // 그 외(네트워크 등)는 공용 모달로 안내
        handleClientError(error, {
          router,
          fallbackTitle: "보안 요약을 불러오지 못했어요",
          fallbackMessage: "잠시 후 다시 시도해 주세요.",
          showModal: (title, content) => setResultModal({ title, content }),
        });
      } finally {
        if (!controller.signal.aborted) setSummaryLoading(false);
      }
    };

    void fetchSummary();
    return () => controller.abort();
  }, [period, router]);

  // 브리핑은 진입 시 1회만 조회
  useEffect(() => {
    const controller = new AbortController();

    const fetchBriefing = async () => {
      setBriefingLoading(true);
      try {
        const res = await getSecurityBriefing(controller.signal);
        setBriefing(res.data ?? null);
      } catch {
        if (!controller.signal.aborted) setBriefing(null);
      } finally {
        if (!controller.signal.aborted) setBriefingLoading(false);
      }
    };

    void fetchBriefing();
    return () => controller.abort();
  }, []);

  const handleRegenerate = useCallback(async () => {
    if (regenerating) return;
    setRegenerating(true);
    try {
      const res = await regenerateSecurityBriefing();
      if (res.data) setBriefing(res.data);
      setResultModal({
        title: "브리핑 재생성 완료",
        content: "최신 상황으로 브리핑을 다시 생성했어요.",
      });
    } catch (error) {
      if (error instanceof ApiClientError && error.code === "SEC-001") {
        setResultModal({
          title: "잠시 후 다시 시도해 주세요",
          content: "브리핑 재생성은 분당 1회만 가능해요.",
        });
      } else if (error instanceof ApiClientError && error.code === "SEC-002") {
        setResultModal({
          title: "재생성에 실패했어요",
          content: "AI 생성에 실패해 기존 브리핑을 그대로 유지했어요.",
        });
      } else {
        setResultModal({
          title: "재생성에 실패했어요",
          content: "잠시 후 다시 시도해 주세요.",
        });
      }
    } finally {
      setRegenerating(false);
    }
  }, [regenerating]);

  // 선택한 계정 하나를 정지 (기존 계정 정지 API 재사용)
  const confirmLock = useCallback(async () => {
    if (!lockTarget) return;
    const target = lockTarget;
    setLockTarget(null);
    setLockingKey(`${target.ip}:${target.userId}`);
    try {
      await toggleUserLock(String(target.userId), true);
      setResultModal({
        title: "계정을 정지했어요",
        content: `user ${target.userId} 계정을 정지하고 즉시 로그아웃 처리했어요.`,
      });
    } catch {
      setResultModal({
        title: "정지에 실패했어요",
        content: "잠시 후 다시 시도하거나 회원 관리에서 처리해 주세요.",
      });
    } finally {
      setLockingKey(null);
    }
  }, [lockTarget]);

  const briefingMeta =
    briefing && !briefingLoading
      ? `마지막 생성 ${timeLabel(briefing.generatedAt)} · 다음 생성 ${timeLabel(
          briefing.nextScheduledAt,
        )}`
      : "브리핑 정보를 불러오는 중…";

  return (
    <div className={s.container}>
      {/* 헤더 */}
      <div className={s.header}>
        <div className={s.titleGroup}>
          <h1 className={s.title}>보안 요약</h1>
          <p className={s.subMeta}>{briefingMeta}</p>
        </div>

        <button
          className={s.regenerateButton}
          disabled={regenerating}
          onClick={handleRegenerate}
          type="button"
        >
          {regenerating ? "생성 중…" : "↻ 다시 생성"}
        </button>
      </div>

      {/* 기간 탭 */}
      <div className={s.periodTabs}>
        {PERIOD_TABS.map((tab) => (
          <button
            className={period === tab.value ? s.periodTabActive : s.periodTab}
            key={tab.value}
            onClick={() => setPeriod(tab.value)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* AI 브리핑 */}
      {briefingLoading ? (
        <LoadingIndicator message="브리핑을 불러오는 중입니다." />
      ) : (
        <AiBriefingCard briefing={briefing} />
      )}

      {/* summary 의존 영역 */}
      {summaryLoading ? (
        <LoadingIndicator message="보안 요약을 불러오는 중입니다." />
      ) : summaryError || !summary ? (
        <div className={s.stateBox}>
          보안 요약을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
        </div>
      ) : (
        <>
          <SecurityKpiTiles kpi={summary.kpi} />
          <div className={s.twoColGrid}>
            <DomainEventBar domainCounts={summary.domainCounts} />
            <HttpAnomalyList httpAnomalies={summary.httpAnomalies} />
          </div>
          <RiskIpTable
            lockingKey={lockingKey}
            onLock={(ip, userId) => setLockTarget({ ip, userId })}
            riskIps={summary.riskIps}
          />
        </>
      )}

      {/* 잠금 확인 다이얼로그 */}
      <TwoButtonModal
        cancelDisabled={lockingKey !== null}
        confirmDisabled={lockingKey !== null}
        isOpen={lockTarget !== null}
        modalContent={
          lockTarget
            ? `대상 계정: user ${lockTarget.userId}\n즉시 강제 로그아웃됩니다.`
            : ""
        }
        modalTitle="이 계정을 정지하시겠어요?"
        onClose={() => setLockTarget(null)}
        onConfirm={confirmLock}
      />

      {/* 결과/에러 안내 */}
      <OneButtonModal
        isOpen={resultModal !== null}
        modalContent={resultModal?.content}
        modalTitle={resultModal?.title ?? ""}
        onClose={() => setResultModal(null)}
      />
    </div>
  );
}
