// 홈(강좌 목록) 로딩 스켈레톤 — CategoryNav + CourseItem 그리드 골격을 미리 잡아
// Suspense 대기 중 빈 화면 → 팝인 깜빡임을 막는다.

const PILL_WIDTHS = ["w-14", "w-20", "w-16", "w-24", "w-16"];

function CardSkeleton() {
  return (
    <div className="border border-[#e8e8e8] rounded-xl overflow-hidden bg-white shadow-sm">
      {/* 썸네일 (CourseItem 과 동일 반응형 높이) */}
      <div className="h-48 w-full bg-bg-gray-box animate-pulse md:h-36 lg:h-36" />
      <div className="p-4">
        {/* 카테고리 태그 */}
        <div className="h-5 w-16 rounded bg-bg-gray-box animate-pulse" />
        {/* 제목 */}
        <div className="mt-2 h-6 w-3/4 rounded bg-bg-gray-box animate-pulse" />
        {/* 설명 2줄 */}
        <div className="mt-2 h-4 w-full rounded bg-bg-gray-box animate-pulse" />
        <div className="mt-1 h-4 w-5/6 rounded bg-bg-gray-box animate-pulse" />
      </div>
    </div>
  );
}

export default function CourseListSkeleton() {
  return (
    <>
      {/* 카테고리 네브 */}
      <nav
        aria-hidden="true"
        className="w-full border-b bg-white border-[#e8e8e8] py-3 mb-4"
      >
        <div className="flex items-center gap-3 overflow-x-auto">
          {PILL_WIDTHS.map((w, i) => (
            <div
              key={i}
              className={`h-[42px] shrink-0 rounded-lg bg-bg-gray-box animate-pulse ${w}`}
            />
          ))}
        </div>
      </nav>

      {/* 강좌 카드 그리드 */}
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </>
  );
}
