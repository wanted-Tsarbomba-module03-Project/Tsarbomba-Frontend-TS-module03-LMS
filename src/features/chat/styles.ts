export const chatClasses = {
  page: "relative flex h-[74vh] max-h-[840px] min-h-[540px] w-full min-w-0 flex-col overflow-hidden rounded-base border border-border-light bg-bg-box text-text-primary max-md:h-[calc(100dvh-96px)] max-md:max-h-none max-md:min-h-0 max-md:rounded-none",
  header:
    "flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-border-light bg-bg-box px-6 py-2.5 text-title-lg font-bold text-text-primary max-md:min-h-[52px] max-md:flex-wrap max-md:px-4 max-md:text-title-md",
  titleGroup: "flex min-w-0 flex-1 flex-col gap-1",
  title: "m-0 min-w-0 truncate",
  linkedProblemTitle:
    "min-w-0 truncate text-description font-semibold text-text-secondary",
  titleInput:
    "min-w-0 flex-1 rounded-base border border-border-light bg-bg-box px-3 py-2 text-body font-semibold text-text-primary outline-none focus:border-button-blue-bg",
  headerActions: "flex shrink-0 flex-wrap items-center justify-end gap-2 max-[560px]:w-full",
  moveButton:
    "shrink-0 cursor-pointer rounded-base border border-button-blue-bg bg-button-blue-bg px-3.5 py-2 text-body font-semibold text-text-white hover:bg-button-blue-hover-bg disabled:cursor-not-allowed disabled:opacity-60 max-[560px]:flex-1",
  editButton:
    "shrink-0 cursor-pointer rounded-base border border-button-blue-bg bg-bg-box px-3.5 py-2 text-body font-semibold text-text-blue hover:bg-button-blue-bg hover:text-text-white disabled:cursor-not-allowed disabled:opacity-60 max-[560px]:flex-1",
  deleteButton:
    "shrink-0 cursor-pointer rounded-base border border-button-red-bg bg-bg-box px-3.5 py-2 text-body font-semibold text-text-red hover:bg-button-red-bg hover:text-text-white disabled:cursor-not-allowed disabled:opacity-60 max-[560px]:flex-1",
  cancelEditButton:
    "shrink-0 cursor-pointer rounded-base border border-border-light bg-bg-box px-3.5 py-2 text-body font-semibold text-text-primary hover:bg-bg-box-hover disabled:cursor-not-allowed disabled:opacity-60",
  messageContainer:
    "flex flex-1 flex-col gap-4 overflow-y-auto bg-bg-box p-6 pb-28 [scrollbar-color:#cbd5e1_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#cbd5e1] [&::-webkit-scrollbar-track]:bg-transparent max-md:p-5 max-md:pb-28",
  messageWrapper: "flex w-full",
  assistantWrapper: "justify-start",
  userWrapper: "justify-end",
  message:
    "max-w-[70%] whitespace-pre-wrap break-words rounded-base px-[18px] py-3.5 text-body leading-[1.6] text-text-primary max-md:max-w-[90%]",
  assistantMessage: "bg-[#bfd3ef]",
  userMessage: "border border-border-light bg-bg-box",
  errorMessage: "text-text-red",
  spinnerWrap: "flex items-center gap-2",
  spinner:
    "h-4 w-4 animate-spin rounded-full border-2 border-[#93a9c8] border-t-button-blue-bg",
  spinnerText: "text-body text-text-primary",
  inputAreaBase:
    "absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-bg-box from-[70%] via-bg-box/75 via-[86%] to-transparent px-6 pt-5 pb-4 max-md:px-5 max-md:pb-3.5",
  inputRow: "flex items-end gap-3 max-[560px]:gap-2",
  input:
    "box-border max-h-36 min-h-[52px] flex-1 resize-none overflow-y-hidden rounded-base border border-border-light bg-bg-box px-4 py-3.5 text-body leading-normal text-text-primary outline-none placeholder:text-text-placeholder focus:border-button-blue-bg disabled:bg-bg-gray disabled:text-text-secondary max-md:min-h-12",
  sendButton:
    "h-[52px] min-w-[88px] cursor-pointer rounded-base border-0 bg-button-blue-bg px-3 text-body font-bold text-text-white hover:not-disabled:bg-button-blue-hover-bg disabled:cursor-not-allowed disabled:opacity-50 max-md:h-12 max-md:min-w-[68px]",
} as const;

export const problemChatClasses = {
  chatPanel:
    "absolute right-0 top-3.5 z-20 flex h-[calc(100%-28px)] min-h-[620px] w-[min(420px,calc(100%-32px))] flex-col rounded-base border border-border-light bg-bg-box shadow-[0_12px_32px_rgba(15,23,42,0.16)] transition-[opacity,transform] duration-200 ease-in-out max-md:fixed max-md:inset-x-3 max-md:bottom-3 max-md:top-[max(74px,calc(env(safe-area-inset-top)+12px))] max-md:h-auto max-md:min-h-0 max-md:w-auto max-[380px]:inset-x-2",
  closed: "pointer-events-none translate-x-6 opacity-0",
  open: "pointer-events-auto translate-x-0 opacity-100",
  chatHeader:
    "relative flex min-h-[86px] flex-col justify-center gap-2 border-b border-border-light px-5 pt-4 pr-14 pb-2 text-text-primary",
  chatHeaderTitle: "text-title-md font-bold leading-6",
  closeButton:
    "absolute right-4 top-4 inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-base border border-border-light bg-bg-box text-xl leading-none text-text-primary hover:bg-bg-hover-gray",
  chatRoomTitleRow: "flex min-h-8 max-w-full items-center gap-2",
  chatRoomTitle: "min-w-0 truncate text-description text-text-secondary",
  chatRoomTitleInput:
    "h-8 min-w-0 flex-1 rounded-base border border-border-light bg-bg-box px-2 text-description text-text-primary outline-none focus:border-button-blue-bg",
  editTitleButton:
    "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-base border-0 bg-transparent hover:bg-bg-box-hover disabled:cursor-not-allowed disabled:opacity-50",
  titleActionButton:
    "h-8 shrink-0 cursor-pointer rounded-base border border-button-blue-bg bg-bg-box px-2 text-description font-semibold text-text-blue hover:bg-button-blue-bg hover:text-text-white disabled:cursor-not-allowed disabled:opacity-50",
  titleCancelButton:
    "h-8 shrink-0 cursor-pointer rounded-base border border-border-light bg-bg-box px-2 text-description font-semibold text-text-primary hover:bg-bg-box-hover disabled:cursor-not-allowed disabled:opacity-50",
  chatMessages:
    "flex-1 overflow-y-auto p-[18px] [scrollbar-color:#cbd5e1_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#cbd5e1] [&::-webkit-scrollbar-track]:bg-transparent",
  chatMessageWrap: "mb-2.5 flex",
  assistantMessageWrap: "justify-start",
  userMessageWrap: "justify-end",
  chatMessage:
    "max-w-[86%] whitespace-pre-wrap break-words rounded-base px-3 py-2.5 leading-[1.6] text-text-primary",
  assistantMessage: "bg-[#bfd3ef]",
  userMessage: "border border-border-light bg-bg-box",
  errorMessage: "text-text-red",
  spinnerWrap: "flex items-center gap-2",
  spinner:
    "h-4 w-4 animate-spin rounded-full border-2 border-[#93a9c8] border-t-button-blue-bg",
  spinnerText: "text-body text-text-primary",
  chatInputWrap:
    "flex items-end gap-2 border-t border-border-light p-3.5 max-[380px]:p-2.5 [&_textarea]:box-border [&_textarea]:max-h-36 [&_textarea]:min-h-11 [&_textarea]:min-w-0 [&_textarea]:flex-1 [&_textarea]:resize-none [&_textarea]:overflow-y-hidden [&_textarea]:rounded-base [&_textarea]:border [&_textarea]:border-border-light [&_textarea]:p-2.5 [&_textarea]:leading-normal [&_textarea]:text-text-primary [&_textarea]:outline-none [&_button]:h-11 [&_button]:min-w-[72px] [&_button]:cursor-pointer [&_button]:rounded-base [&_button]:border [&_button]:border-button-blue-bg [&_button]:bg-button-blue-bg [&_button]:px-3 [&_button]:text-text-white [&_button:disabled]:cursor-not-allowed [&_button:disabled]:opacity-60 max-[380px]:[&_button]:min-w-[60px]",
} as const;
