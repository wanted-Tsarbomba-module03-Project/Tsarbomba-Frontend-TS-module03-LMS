import { Skeleton } from "primereact/skeleton";

import { problemDetailClasses } from "../problemDetailStyles";

const skeletonClasses = {
  nav:
    "w-full border-b border-border-light bg-bg-box py-3 mb-4 animate-pulse",
  navInner:
    "mx-auto flex max-w-300 items-center justify-between px-6 max-md:px-4",
  mainArea:
    "relative flex min-h-[calc(80vh-80px)] gap-4 overflow-hidden py-3.5 max-lg:flex-col",
  contentArea: "flex min-w-0 flex-1 items-stretch gap-3 max-[1180px]:flex-col",
  problemBox:
    "relative min-w-[260px] flex-[0_0_33.3333%] max-w-[33.3333%] rounded-base border border-border-light bg-bg-box p-4 max-[1180px]:w-full max-[1180px]:max-w-full max-[1180px]:min-w-0 max-[1180px]:flex-auto",
  solveBox:
    "min-w-[400px] flex-1 rounded-base border border-border-light bg-bg-box p-4 max-[1180px]:min-w-0",
  resizeHandle:
    "w-2 shrink-0 rounded-base bg-border-light max-[1180px]:hidden",
  textBlock: "mt-4 flex flex-col gap-3",
  tabs: "mt-3 mb-2 grid min-w-0 grid-cols-4 gap-2 max-[560px]:gap-1.5",
  editorFrame:
    "relative mt-3 h-[280px] min-h-[220px] overflow-hidden rounded-base border border-[#111751] bg-[#1e1e1e] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]",
  editorToggle:
    "absolute right-2 top-2 z-10 h-8 w-16 rounded-base border border-[#1a237e] bg-[#eef2ff]",
  editorLines: "flex flex-col gap-3 px-4 pt-14",
  tabButton:
    "h-[42px] rounded-base border border-[#1a237e] bg-[#fff]",
  tabButtonActive:
    "h-[42px] rounded-base border border-button-blue-bg bg-button-blue-bg",
  tabButtonDisabled:
    "h-[42px] rounded-base border border-[#cbd5e1] bg-[#f1f5f9]",
  submitWrap: "mt-3 flex justify-end",
  problemListToggle:
    "mb-3 flex h-11 w-full items-center justify-between rounded-base border border-[#1a237e] bg-white px-4",
} as const;

function SkeletonLine({
  height = "1rem",
  width,
}: {
  height?: string;
  width: string;
}) {
  return <Skeleton borderRadius="8px" height={height} width={width} />;
}

function CodeEditorSkeleton() {
  return (
    <div className={skeletonClasses.editorFrame}>
      <div className={skeletonClasses.editorToggle} />
      <div className={skeletonClasses.editorLines}>
        <Skeleton borderRadius="8px" height="16px" width="68%" />
        <Skeleton borderRadius="8px" height="16px" width="54%" />
        <Skeleton borderRadius="8px" height="16px" width="76%" />
        <Skeleton borderRadius="8px" height="16px" width="46%" />
        <Skeleton borderRadius="8px" height="16px" width="62%" />
        <Skeleton borderRadius="8px" height="16px" width="38%" />
      </div>
    </div>
  );
}

function ResultTabsSkeleton() {
  return (
    <div className={skeletonClasses.tabs}>
      <div className={skeletonClasses.tabButtonActive} />
      <div className={skeletonClasses.tabButton} />
      <div className={skeletonClasses.tabButtonDisabled} />
      <div className={skeletonClasses.tabButtonDisabled} />
    </div>
  );
}

export default function ProblemDetailSkeleton() {
  return (
    <main
      aria-label="문제풀이 화면을 불러오는 중입니다."
      aria-busy="true"
      className={problemDetailClasses.container}
    >
      <nav className={skeletonClasses.nav}>
        <div className={skeletonClasses.navInner}>
          <Skeleton borderRadius="8px" height="42px" width="92px" />
          <div className="flex gap-2">
            <Skeleton borderRadius="8px" height="42px" width="92px" />
            <Skeleton borderRadius="8px" height="42px" width="92px" />
          </div>
        </div>
      </nav>

      <div className={skeletonClasses.mainArea}>
        <section className={skeletonClasses.contentArea}>
          <article className={skeletonClasses.problemBox}>
            <div className={skeletonClasses.problemListToggle}>
              <SkeletonLine height="1rem" width="112px" />
              <Skeleton borderRadius="8px" height="18px" width="18px" />
            </div>

            <div className="flex items-center justify-between gap-3">
              <SkeletonLine height="1.25rem" width="110px" />
              <Skeleton borderRadius="8px" height="36px" width="36px" />
            </div>

            <div className={skeletonClasses.textBlock}>
              <SkeletonLine width="92%" />
              <SkeletonLine width="84%" />
              <SkeletonLine width="78%" />
              <SkeletonLine width="88%" />
              <SkeletonLine width="64%" />
            </div>
          </article>

          <div className={skeletonClasses.resizeHandle} />

          <section className={skeletonClasses.solveBox}>
            <SkeletonLine height="1.25rem" width="132px" />
            <CodeEditorSkeleton />

            <ResultTabsSkeleton />

            <Skeleton borderRadius="8px" height="180px" width="100%" />

            <div className={skeletonClasses.submitWrap}>
              <Skeleton borderRadius="8px" height="44px" width="120px" />
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
