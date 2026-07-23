export const problemFormPageClasses = {
  bottomButtonGroup: "flex justify-end gap-[15px]",
  cancelButton:
    "min-w-[92px] cursor-pointer rounded-base border border-border-light bg-bg-box px-[30px] py-3 text-[15px] font-semibold text-text-primary hover:not-disabled:bg-bg-box-hover disabled:cursor-not-allowed disabled:opacity-60",
  container: "min-h-screen bg-bg-main p-[30px]",
  draftAnswerBox: "rounded-base border border-[#bfdbfe] bg-[#eff6ff] p-4",
  draftAnswerText:
    "mt-2 mb-0 whitespace-pre-wrap break-keep text-body leading-6 text-text-primary",
  draftAnswerTitle: "m-0 text-description font-bold text-[#1d4ed8]",
  draftBadge: "rounded-full bg-bg-navbar px-3 py-1",
  draftButton:
    "flex h-10 min-w-[112px] cursor-pointer items-center justify-center gap-1.5 rounded-base border border-button-blue-bg bg-bg-box px-4 text-body font-semibold text-button-blue-bg transition-colors hover:not-disabled:bg-button-blue-bg hover:not-disabled:text-text-white disabled:cursor-not-allowed disabled:border-border-light disabled:bg-bg-gray-box disabled:text-text-muted",
  draftButtonSpinner:
    "h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-text-white motion-reduce:animate-[spin_1.6s_linear_infinite]",
  draftCloseButton:
    "flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-text-secondary transition-colors hover:not-disabled:bg-bg-box-hover hover:not-disabled:text-text-primary disabled:cursor-not-allowed disabled:opacity-50",
  draftCodeBlock:
    "mt-2 max-h-56 overflow-auto whitespace-pre-wrap rounded-base border border-border-light bg-bg-box p-3 font-mono text-description leading-5 text-text-primary",
  draftDescription:
    "mt-1.5 mb-0 text-description leading-5 text-text-secondary",
  draftFieldLabel: "mt-4 mb-1 text-description font-semibold text-text-secondary",
  draftFileButton:
    "flex h-[46px] min-w-0 flex-1 cursor-pointer items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap rounded-base bg-bg-gray-box px-3 text-text-primary hover:bg-bg-gray-box-hover",
  draftFileRemoveButton:
    "h-[46px] shrink-0 cursor-pointer rounded-base border border-button-red-bg bg-bg-box px-4 text-description font-semibold text-text-red hover:not-disabled:bg-button-red-bg hover:not-disabled:text-text-white disabled:cursor-not-allowed disabled:opacity-50 max-md:w-full",
  draftFileRow: "flex items-center gap-2.5 max-md:flex-col max-md:items-stretch",
  draftFooterCancelButton:
    "h-11 min-w-[104px] cursor-pointer rounded-lg bg-bg-navbar px-5 text-sm font-medium text-[#364153] transition-colors hover:not-disabled:bg-[#e5e7eb] disabled:cursor-not-allowed disabled:opacity-60",
  draftFooterPrimaryButton:
    "flex h-11 min-w-[104px] items-center justify-center gap-2 rounded-lg bg-button-blue-bg px-5 text-sm font-medium text-text-white transition-colors hover:not-disabled:bg-button-blue-hover-bg disabled:cursor-not-allowed disabled:opacity-60",
  draftFull: "col-span-2 max-md:col-span-1",
  draftGrid: "grid grid-cols-2 gap-4 max-md:grid-cols-1",
  draftHeaderTextWrap: "flex min-w-0 flex-col",
  draftHelpText: "m-0 text-description leading-5 text-text-secondary",
  draftInputGroup:
    "flex flex-col gap-2 [&_label]:text-description [&_label]:font-semibold [&_label]:text-text-primary [&_input]:h-[46px] [&_input]:rounded-base [&_input]:border [&_input]:border-border-light [&_input]:bg-bg-box [&_input]:px-3 [&_input]:text-body [&_input]:text-text-primary [&_input]:outline-none [&_input]:focus:border-text-blue [&_input]:placeholder:text-text-placeholder [&_select]:h-[46px] [&_select]:appearance-none [&_select]:rounded-base [&_select]:border [&_select]:border-border-light [&_select]:bg-bg-box [&_select]:px-3 [&_select]:text-body [&_select]:text-text-primary [&_select]:outline-none [&_select]:focus:border-text-blue [&_textarea]:min-h-[118px] [&_textarea]:resize-y [&_textarea]:rounded-base [&_textarea]:border [&_textarea]:border-border-light [&_textarea]:bg-bg-box [&_textarea]:p-3 [&_textarea]:text-body [&_textarea]:leading-6 [&_textarea]:text-text-primary [&_textarea]:outline-none [&_textarea]:focus:border-text-blue [&_textarea]:placeholder:text-text-placeholder",
  draftMeta: "mt-4 flex flex-wrap gap-2 text-description text-text-secondary",
  draftModalBody:
    "flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5 max-md:px-4",
  draftModalFooter:
    "flex justify-end gap-2.5 border-t border-border-light px-6 py-4 max-md:px-4",
  draftModalHeader:
    "flex items-start justify-between gap-4 border-b border-border-light px-6 py-5 max-md:px-4",
  draftModalOverlay:
    "fixed inset-0 z-[900] flex h-dvh w-dvw items-center justify-center bg-[rgba(16,24,40,0.45)] px-4 py-6",
  draftModalPanel:
    "flex max-h-[calc(100dvh-48px)] w-[min(760px,100%)] flex-col overflow-hidden rounded-2xl bg-bg-box shadow-[0_18px_44px_rgba(15,23,42,0.22)]",
  draftPreviewOverlay:
    "fixed inset-0 z-[900] flex h-dvh w-dvw items-center justify-center bg-[rgba(16,24,40,0.45)] px-4 py-6",
  draftPreviewPanel:
    "flex max-h-[calc(100dvh-48px)] w-[min(840px,100%)] flex-col overflow-hidden rounded-2xl bg-bg-box shadow-[0_18px_44px_rgba(15,23,42,0.22)]",
  draftProblemItem: "rounded-base border border-border-light bg-bg-box p-4",
  draftProblemList: "m-0 flex list-none flex-col gap-4 p-0",
  draftProblemText:
    "mt-2 mb-0 whitespace-pre-wrap break-keep text-body leading-6 text-text-primary",
  draftProblemTitle: "m-0 text-body font-bold text-text-primary",
  draftSection: "rounded-base border border-border-light bg-bg-box p-4",
  draftSectionTitle: "m-0 mb-3 text-body font-bold text-text-primary",
  draftTitle: "m-0 text-lg font-semibold text-text-primary",
  draftTitleRow: "flex items-center gap-2",
  pageTitle: "mt-0 mb-5 text-title-lg font-bold text-text-primary",
  submitButton:
    "min-w-[92px] cursor-pointer rounded-base border border-button-blue-bg bg-button-blue-bg px-[30px] py-3 text-[15px] font-semibold text-text-white hover:not-disabled:bg-button-blue-hover-bg disabled:cursor-not-allowed disabled:opacity-60",
  titleBar:
    "mb-5 flex items-center justify-between gap-3 max-md:flex-col max-md:items-stretch",
} as const;
