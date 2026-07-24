"use client";

/**
 * 랜딩 상단 "이렇게 학습합니다" 4단계 카드.
 * 클릭하면 아래 "실제 화면으로 살펴보기(FLOW)"의 해당 항목으로 부드럽게 스크롤한다.
 * (랜딩 본체는 SEO 위해 서버 컴포넌트로 두고, 스크롤 동작만 이 클라이언트 카드가 담당)
 */

interface StepCardProps {
  no: string;
  emoji: string;
  title: string;
  desc: string;
  targetId: string;
}

export default function StepCard({
  no,
  emoji,
  title,
  desc,
  targetId,
}: StepCardProps) {
  const handleClick = () => {
    document
      .getElementById(targetId)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full cursor-pointer rounded-2xl border border-[#e8e8e8] bg-white p-6 text-left transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-[#1a237e]">{no}</span>
        <span className="text-3xl" aria-hidden>
          {emoji}
        </span>
      </div>
      <h3 className="mt-4 text-lg font-bold text-[#1f2937]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#6b7280]">{desc}</p>
    </button>
  );
}
