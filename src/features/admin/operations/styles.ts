export const adminUserListClasses = {
  container: "box-border p-6 text-text-primary max-md:p-4",
  header:
    "mb-5 flex items-center justify-between gap-4 max-md:flex-col max-md:items-stretch",
  searchWrap: "flex flex-wrap items-center justify-end gap-3 max-md:justify-start",
  title: "m-0 text-2xl font-bold",
} as const;

export const adminAlramListClasses = {
  container: "box-border p-6 text-text-primary max-md:p-4",
  header:
    "mb-5 flex items-center justify-between gap-4 max-md:flex-col max-md:items-stretch [&_h1]:m-0 [&_h1]:text-2xl [&_h1]:font-bold",
  statusSelect:
    "h-9 w-[120px] rounded-base border border-button-blue-bg bg-bg-box px-2.5 text-description text-text-primary max-md:w-full",
  typeButtonGroup: "mb-5 flex flex-wrap gap-2.5",
  typeButton:
    "h-9 w-[88px] cursor-pointer rounded-base border border-button-blue-bg bg-bg-box text-center text-body font-medium leading-6 text-text-primary",
  active: "border-0 bg-button-blue-bg text-text-white",
} as const;

export const adminRuleClasses = {
  container: "box-border flex w-[min(100%,1463px)] flex-col gap-4 p-6 max-md:p-4",
  ruleBlock: "flex w-full flex-col gap-2",
  ruleHeader:
    "flex w-[min(100%,960px)] items-center justify-between gap-3 max-[560px]:flex-col max-[560px]:items-stretch",
  ruleLabel: "m-0 text-body font-medium leading-6 text-text-primary",
  ruleInputBox:
    "box-border flex min-h-[100px] w-[min(100%,960px)] flex-wrap items-center gap-5 rounded border border-black/10 bg-bg-box px-4 py-2 max-md:gap-3 max-md:px-3",
  ruleItem: "flex flex-wrap items-center gap-2.5 max-[560px]:w-full",
  ruleText: "text-body font-medium leading-6 text-black",
  ruleInput:
    "box-border h-11 w-[162px] rounded-[10px] border border-[#d9d9d9] px-2.5 text-description outline-none focus:border-[#4f46e5] max-[560px]:w-full",
  toggleButton:
    "h-10 min-w-[90px] cursor-pointer rounded-[10px] border-0 px-3 text-description font-semibold transition duration-200 ease-in-out",
  enabled: "bg-button-blue-bg text-text-white hover:opacity-90",
  disabled: "bg-[#e5e7eb] text-[#374151] hover:bg-[#d1d5db]",
  submitWrapper: "mt-3 mb-10 flex w-[min(100%,960px)] justify-center",
  submitButton:
    "h-[50px] w-[180px] cursor-pointer rounded-[10px] border-0 bg-button-blue-bg text-body font-semibold text-text-white transition duration-200 ease-in-out hover:not-disabled:bg-button-blue-hover-bg disabled:cursor-not-allowed disabled:bg-[#6b7280] disabled:text-text-white disabled:opacity-100 max-[560px]:w-full",
} as const;

export const adminMasterClasses = {
  container: "box-border p-6 text-text-primary max-md:p-4",
  header: "mb-5 [&_h1]:m-0 [&_h1]:text-2xl [&_h1]:font-bold",
  permissionActive:
    "inline-flex h-8 min-w-[76px] cursor-pointer items-center justify-center rounded-base border border-button-blue-bg bg-button-blue-bg px-3 text-description font-semibold text-text-white transition hover:bg-button-blue-hover-bg disabled:cursor-not-allowed disabled:opacity-60",
  permissionInactive:
    "inline-flex h-8 min-w-[76px] cursor-pointer items-center justify-center rounded-base border border-text-red bg-bg-box px-3 text-description font-semibold text-text-red transition hover:bg-text-red hover:text-text-white disabled:cursor-not-allowed disabled:opacity-60",
} as const;

export const adminCategoryClasses = {
  container: "box-border p-6 text-text-primary max-md:p-4",
  header:
    "mb-5 flex items-center justify-between gap-4 max-md:flex-col max-md:items-stretch",
  title: "m-0 text-2xl font-bold",
  createButton:
    "inline-flex h-10 min-w-[92px] cursor-pointer items-center justify-center rounded-[10px] border-0 bg-button-blue-bg px-4 text-body font-semibold text-text-white transition hover:not-disabled:bg-button-blue-hover-bg disabled:cursor-not-allowed disabled:bg-[#6b7280] disabled:text-text-white",
  actionGroup: "flex items-center justify-center gap-2",
  editButton:
    "inline-flex h-8 min-w-[60px] cursor-pointer items-center justify-center rounded-base border border-button-blue-bg bg-button-blue-bg px-3 text-description font-semibold text-text-white transition hover:not-disabled:bg-button-blue-hover-bg disabled:cursor-not-allowed disabled:bg-[#6b7280] disabled:border-[#6b7280] disabled:text-text-white",
  deleteButton:
    "inline-flex h-8 min-w-[60px] cursor-pointer items-center justify-center rounded-base border border-text-red bg-bg-box px-3 text-description font-semibold text-text-red transition hover:not-disabled:bg-text-red hover:not-disabled:text-text-white disabled:cursor-not-allowed disabled:border-[#9ca3af] disabled:bg-[#e5e7eb] disabled:text-[#6b7280]",
  cancelButton:
    "inline-flex h-8 min-w-[60px] cursor-pointer items-center justify-center rounded-base border border-[#d1d5db] bg-bg-box px-3 text-description font-semibold text-[#374151] transition hover:not-disabled:bg-[#e5e7eb] disabled:cursor-not-allowed disabled:opacity-60",
  nameInput:
    "box-border h-9 w-full rounded-[10px] border border-[#d1d5db] bg-bg-box px-3 text-description text-text-primary outline-none transition focus:border-button-blue-bg focus:ring-2 focus:ring-button-blue-bg/20 disabled:cursor-not-allowed disabled:bg-[#f3f4f6]",
  statusActive:
    "inline-flex h-8 min-w-[64px] items-center justify-center rounded-full bg-[#e0f2fe] px-3 text-description font-semibold text-[#075985]",
  statusInactive:
    "inline-flex h-8 min-w-[64px] items-center justify-center rounded-full bg-[#f3f4f6] px-3 text-description font-semibold text-[#6b7280]",
  inactiveRow: "[&_td]:bg-[#fafafa] [&_td]:text-[#6b7280]",
  modalOverlay:
    "fixed inset-0 z-[999] flex h-dvh w-dvw items-center justify-center bg-[rgba(16,24,40,0.45)] px-4 py-6",
  modalContainer:
    "box-border flex w-[min(420px,100%)] flex-col gap-3 rounded-2xl bg-bg-box p-6 shadow-xl",
  modalTitle: "m-0 text-xl font-semibold text-[#101828]",
  modalLabel: "text-description font-semibold text-[#364153]",
  modalInput:
    "box-border h-11 w-full rounded-[10px] border border-[#d1d5db] bg-bg-box px-3 text-body text-text-primary outline-none transition focus:border-button-blue-bg focus:ring-2 focus:ring-button-blue-bg/20",
  modalActions: "mt-4 flex justify-end gap-3 max-[520px]:flex-col",
  modalPrimaryButton:
    "h-11 min-w-[96px] cursor-pointer rounded-[10px] border-0 bg-button-blue-bg px-4 text-body font-semibold text-text-white transition hover:not-disabled:bg-button-blue-hover-bg disabled:cursor-not-allowed disabled:bg-[#6b7280]",
  modalCancelButton:
    "h-11 min-w-[96px] cursor-pointer rounded-[10px] border-0 bg-bg-navbar px-4 text-body font-semibold text-[#364153] transition hover:bg-[#e5e7eb]",
} as const;
