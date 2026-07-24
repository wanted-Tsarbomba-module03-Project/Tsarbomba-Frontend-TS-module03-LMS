export const BADGE_FALLBACK_SRC = "/assets/img/bluebomb-Icon.svg";
export const MY_RANKING_ROW_CLASS = "[&_td]:!bg-[#eaf2ff]";

export const rankingClasses = {
  page: "mx-auto box-border flex min-h-[calc(100vh-220px)] w-full max-w-[1080px] flex-col px-5 py-14 max-md:px-4 max-md:py-8",
  header:
    "mb-6 flex items-center justify-between gap-4 max-md:flex-col max-md:items-stretch",
  titleGroup: "min-w-0 space-y-2",
  title: "text-title-lg font-bold text-text-primary",
  description: "text-description text-text-secondary",
  toggleGroup:
    "inline-flex rounded-base border border-border-light bg-bg-box p-1 max-md:w-full",
  toggleButton:
    "h-10 cursor-pointer rounded-base px-4 text-body font-semibold text-text-secondary transition-colors hover:bg-bg-box-hover disabled:cursor-not-allowed disabled:opacity-60 max-md:flex-1",
  toggleButtonActive: "bg-button-blue-bg text-text-white hover:bg-button-blue-bg",
  listShell:
    "[&_tbody_td]:h-[86px] [&_thead_th]:h-[52px] max-md:[&_tbody_td]:h-[72px]",
  rank: "text-body text-text-primary",
  badgeWrap: "flex items-center justify-center",
  badgeImage: "h-11 w-11 object-contain",
  userName: "text-text-primary",
  point: "text-text-primary",
  myRanking:
    "sticky bottom-16 z-20 mt-5 grid min-h-[76px] grid-cols-5 items-center rounded-base border border-[#cfd9ea] bg-[#eaf2ff] text-center shadow-[0_10px_24px_rgba(26,35,126,0.12)] max-md:bottom-4 max-md:grid-cols-2 max-md:gap-3 max-md:px-4 max-md:py-4",
  myCell: "box-border flex items-center justify-center p-2",
  myLabel: "text-body font-bold text-text-primary",
  myEmpty:
    "sticky bottom-16 z-20 mt-5 rounded-base border border-border-light bg-bg-navbar px-5 py-5 text-center text-body text-text-secondary max-md:bottom-4",
} as const;
