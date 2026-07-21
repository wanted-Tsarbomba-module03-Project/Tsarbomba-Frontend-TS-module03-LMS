// 보안 요약 콘솔 스타일 — 기존 admin UI 문법(네이비 #1a237e · 흰 카드 · pill) 준수
const NAVY = "#1a237e";

export const securityClasses = {
  container:
    "box-border flex flex-col gap-5 px-6 pb-6 pt-1 text-text-primary max-md:px-4 max-md:pb-4",

  // 헤더 (제목 + 생성 시각 + 다시 생성 버튼)
  header: "flex items-start justify-between gap-4 max-md:flex-col",
  titleGroup: "flex flex-col gap-1",
  title: "m-0 text-2xl font-bold text-text-primary",
  subMeta: "m-0 text-description text-text-secondary",
  regenerateButton:
    "inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-button-blue-bg bg-bg-box px-4 text-body font-semibold text-button-blue-bg transition hover:not-disabled:bg-button-blue-bg hover:not-disabled:text-text-white disabled:cursor-not-allowed disabled:opacity-60",

  // 기간 탭 (오늘/7일/2개월)
  periodTabs: "flex gap-2",
  periodTab:
    "h-9 min-w-[68px] cursor-pointer rounded-lg border border-button-blue-bg bg-bg-box px-4 text-body font-medium text-text-primary transition hover:bg-bg-navbar",
  periodTabActive:
    "h-9 min-w-[68px] cursor-pointer rounded-lg border-0 bg-button-blue-bg px-4 text-body font-semibold text-text-white",

  // 공용 카드
  card: "rounded-xl border border-border-light bg-bg-box p-5",
  cardHeader: "mb-4 flex items-center justify-between",
  cardTitle: "m-0 text-lg font-bold text-text-primary",
  cardBadge:
    "inline-flex items-center rounded-full border border-border-light px-3 py-1 text-xs font-medium text-text-secondary",

  // AI 브리핑
  briefingTag:
    "inline-flex items-center rounded-full bg-[#eef2ff] px-2.5 py-0.5 text-xs font-semibold text-button-blue-bg",
  briefingHeadline:
    "border-l-4 border-button-blue-bg pl-3 text-base font-bold leading-7 text-text-primary",
  briefingNarrative:
    "break-keep text-pretty text-body leading-7 text-text-secondary",
  triCardGrid: "grid grid-cols-3 gap-3 max-md:grid-cols-1",
  triCardAction: "rounded-lg bg-[#fdecec] p-4",
  triCardWatch: "rounded-lg bg-[#fdf6e3] p-4",
  triCardHealthy: "rounded-lg bg-[#e9f6ee] p-4",
  triCardTitle: "m-0 text-body font-bold",
  triCardItemTitle: "font-semibold text-text-primary",
  triCardDetail: "m-0 break-keep text-description leading-6 text-text-secondary",

  // KPI 타일
  kpiGrid: "grid grid-cols-6 gap-3 max-lg:grid-cols-3 max-sm:grid-cols-2",
  kpiTile: "rounded-xl border border-border-light bg-bg-box p-4",
  kpiLabel: "m-0 text-description text-text-secondary",
  kpiValue: "m-0 mt-1 text-2xl font-bold text-text-primary",
  kpiValueDanger: "m-0 mt-1 text-2xl font-bold text-text-red",
  kpiValueSuccess: "m-0 mt-1 text-2xl font-bold text-[#15803d]",
  kpiDelta: "m-0 mt-1 text-xs text-text-secondary",

  // 2단 그리드 (도메인 / HTTP)
  twoColGrid: "grid grid-cols-2 gap-4 max-md:grid-cols-1",

  // 도메인별 이벤트 바
  domainRow: "flex items-center gap-3",
  domainLabel: "w-16 shrink-0 text-description text-text-secondary",
  domainTrack: "h-2.5 flex-1 overflow-hidden rounded-full bg-bg-gray-box",
  domainFill: "h-full rounded-full",
  domainCount: "w-12 shrink-0 text-right text-description font-semibold",

  // HTTP 예외 신호 — pill 은 고정폭·줄바꿈 금지·안 눌림, 긴 라우트만 접힘
  httpRow: "flex items-start justify-between gap-3 py-2",
  httpRoute:
    "min-w-0 break-words pt-1 font-mono text-description text-text-primary",
  httpPillGroup: "flex shrink-0 flex-col items-end gap-1",
  // 접기/펼치기 토글 pill — 라벨 중앙 + 화살표는 우측에 absolute. 단일 pill 과 동일 크기.
  httpTogglePillDanger:
    "relative inline-flex h-7 min-w-[108px] shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-md border border-text-red px-2.5 text-xs font-semibold text-text-red transition hover:bg-[#fdecec]",
  httpTogglePillWarn:
    "relative inline-flex h-7 min-w-[108px] shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-md border border-[#b45309] px-2.5 text-xs font-semibold text-[#b45309] transition hover:bg-[#fdf6e3]",
  httpToggleCaret:
    "pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] leading-none",
  httpPillDanger:
    "inline-flex h-7 min-w-[108px] shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-text-red px-2.5 text-xs font-semibold text-text-red",
  httpPillWarn:
    "inline-flex h-7 min-w-[108px] shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-[#b45309] px-2.5 text-xs font-semibold text-[#b45309]",
  httpEmpty: "text-description text-text-secondary",

  // 위험 IP 드릴다운 테이블
  table: "w-full border-collapse text-body",
  th: "border-b border-border-light bg-bg-gray-box px-4 py-3 text-left text-description font-semibold text-text-secondary",
  td: "border-b border-border-light px-4 py-4 text-text-primary",
  tdDanger: "border-b border-border-light px-4 py-4 font-bold text-text-red",
  // 표적 계정 — 계정별로 각 행 전개, IP/이벤트/타입은 rowspan 으로 묶음
  targetEmpty: "text-text-secondary",
  actionGroup: "flex items-center gap-2",
  // rowspan 으로 묶이는 그룹 셀(위 정렬) + 그룹 첫 행 상단 구분선
  tdGroup:
    "border-b border-border-light px-4 py-4 align-top text-text-primary",
  tdGroupDanger:
    "border-b border-border-light px-4 py-4 align-top font-bold text-text-red",
  rowGroupStart: "[&>td]:border-t [&>td]:border-border-light",
  ipCountry: "ml-1 text-xs text-text-secondary",
  lockButton:
    "inline-flex h-8 min-w-[64px] cursor-pointer items-center justify-center rounded-base border border-text-red bg-bg-box px-3 text-description font-semibold text-text-red transition hover:not-disabled:bg-text-red hover:not-disabled:text-text-white disabled:cursor-not-allowed disabled:opacity-60",
  investigateButton:
    "inline-flex h-8 min-w-[64px] cursor-pointer items-center justify-center rounded-base border border-button-blue-bg bg-bg-box px-3 text-description font-semibold text-button-blue-bg transition hover:not-disabled:bg-button-blue-bg hover:not-disabled:text-text-white",

  // 빈/로딩/에러 상태
  stateBox:
    "flex min-h-[120px] items-center justify-center rounded-xl border border-border-light bg-bg-box p-6 text-description text-text-secondary",
} as const;

// 도메인 막대 색 — 색은 경보에만: security(보안)만 빨강, 나머지는 네이비 단색으로 통일
export const DOMAIN_BAR_DEFAULT = NAVY;
export const DOMAIN_BAR_COLORS: Record<string, string> = {
  security: "#c0392b",
};
