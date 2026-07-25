import { Skeleton } from "primereact/skeleton";

/**
 * 강좌 상세(courses/[courseId]) 서버 데이터 로딩 중 표시하는 스켈레톤.
 * CourseDetailClient 와 동일한 골격(썸네일·헤더·버튼 영역·강의목록)으로 공간을 미리 잡아
 * 새로고침 시 빈 화면 → 콘텐츠 팝인 / 위아래 점프를 막는다.
 */
export default function CourseDetailSkeleton() {
  return (
    <div className="min-h-screen bg-bg-main">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
        {/* 상단 카드 */}
        <div className="border border-border-light rounded-lg overflow-hidden mb-8">
          {/* 썸네일 (반응형 높이) */}
          <div className="h-48 sm:h-72">
            <Skeleton borderRadius="0" height="100%" width="100%" />
          </div>

          <div className="p-6">
            {/* 강사명 */}
            <Skeleton borderRadius="8px" height="14px" width="120px" />

            <div className="mt-2 flex flex-col sm:flex-row items-start sm:justify-between gap-4">
              {/* 좌: 제목 + 설명 */}
              <div className="flex-1 min-w-0 w-full">
                <Skeleton borderRadius="8px" height="24px" width="60%" />
                <Skeleton
                  borderRadius="8px"
                  className="mt-3"
                  height="14px"
                  width="100%"
                />
                <Skeleton
                  borderRadius="8px"
                  className="mt-1"
                  height="14px"
                  width="90%"
                />
                <Skeleton
                  borderRadius="8px"
                  className="mt-1"
                  height="14px"
                  width="70%"
                />
              </div>

              {/* 우: 버튼 2개 (AI 추천 문제 + 신청/취소/완료) */}
              <div className="flex items-center gap-2 shrink-0">
                <Skeleton borderRadius="8px" height="38px" width="104px" />
                <Skeleton borderRadius="8px" height="38px" width="96px" />
              </div>
            </div>
          </div>
        </div>

        {/* 강의목록 */}
        <section>
          <Skeleton borderRadius="8px" height="22px" width="88px" />
          <div className="mt-4 border border-border-light rounded-lg overflow-hidden">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-5 py-4 ${
                  i < 3 ? "border-b border-border-light" : ""
                }`}
              >
                <Skeleton borderRadius="8px" height="18px" width="45%" />
                <Skeleton borderRadius="6px" height="20px" width="44px" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
