import Image from "next/image";
import Link from "next/link";

import StepCard from "./StepCard";

/**
 * 비로그인 방문자에게 홈(`/`)에서 노출되는 서비스 가이드형 랜딩 페이지.
 * "이 사이트에서는 이렇게 학습합니다" 를 첫 화면에서 자연스럽게 안내한다.
 * (로그인 사용자는 강좌 목록을 보므로 이 컴포넌트는 렌더되지 않는다)
 *
 * 스크린샷은 public/assets/img/guide/ 에 정해진 파일명으로 저장한다(README 참고).
 */

// targetId — 클릭 시 아래 FLOW(실제 화면으로 살펴보기)의 대응 항목으로 스크롤
const STEPS = [
  {
    no: "01",
    emoji: "🎬",
    title: "강의 시청",
    desc: "관심 있는 강의를 골라 학습하세요.",
    targetId: "flow-lecture",
  },
  {
    no: "02",
    emoji: "💻",
    title: "문제 풀이",
    desc: "학습한 내용을 문제로 확인하세요.",
    targetId: "flow-problem-catalog",
  },
  {
    no: "03",
    emoji: "🏅",
    title: "배지 획득",
    desc: "학습 목표를 달성하고 배지를 모으세요.",
    targetId: "flow-correct",
  },
  {
    no: "04",
    emoji: "🏆",
    title: "랭킹 확인",
    desc: "누적 점수로 순위를 비교하세요.",
    targetId: "flow-done",
  },
];

// 실제 화면 캡처로 보여주는 학습 흐름
const FLOW = [
  {
    img: "lecture.png",
    step: "STEP 1",
    title: "강의 시청",
    desc: "관심 있는 강의를 영상으로 학습해요. 영상을 끝까지 봐야 다음 강의가 열립니다.",
  },
  {
    img: "problem-catalog.png",
    step: "STEP 2",
    title: "문제 확인",
    desc: "문제풀이 목록에서 카테고리별로 원하는 문제를 골라요. 난이도와 정답률도 한눈에 확인할 수 있어요.",
  },
  {
    img: "code-run.png",
    step: "STEP 3",
    title: "코드 작성 & 실행",
    desc: "pandas로 분석 코드를 작성하고, 정답을 result 변수에 담아 실행해 결과를 확인해요.",
  },
  {
    img: "problem-chatbot.png",
    step: "막힐 땐",
    title: "AI 문제풀이 챗봇",
    desc: "풀다가 막히면 문제풀이 챗봇에게 물어보세요. 문제 맥락에 맞춰 어떻게 접근하면 되는지 알려줘요.",
  },
  {
    img: "correct.png",
    step: "STEP 4",
    title: "제출 & 채점",
    desc: "제출하면 자동으로 채점돼요. 정답을 맞히면 점수를 얻고 랭킹에 반영됩니다.",
  },
  {
    img: "explanation.png",
    step: "막힐 땐",
    title: "힌트 · 해설",
    desc: "문제가 어려우면 힌트와 해설로 학습을 이어갈 수 있어요. (해설을 보면 점수는 미획득)",
  },
  {
    img: "done.png",
    step: "완료",
    title: "학습 완료",
    desc: "문제세트를 모두 풀면 완료! 획득한 점수가 랭킹에 반영돼요.",
  },
];

export default function HomeLandingGuide() {
  return (
    <div className="flex flex-col gap-20 pt-10 pb-10">
      {/* 1. 최상단 — 웹사이트 요약 + CTA */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a237e] to-[#111751] px-6 py-16 text-center sm:px-12 sm:py-20">
        <span className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold text-white">
          Codebomba 학습 가이드
        </span>
        <h1 className="mt-6 text-3xl font-extrabold leading-tight text-white sm:text-5xl">
          강의를 듣고, 문제를 풀고,
          <br />
          점수와 배지를 모으며 성장하세요
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
          codebomba는 강의 · 문제풀이 · 랭킹 · AI 챗봇으로
          <br />
          학습 흐름이 자연스럽게 이어지는 데이터 분석 학습 플랫폼이에요.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/auth/login"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-white px-8 text-base font-bold text-[#1a237e] transition-colors hover:bg-[#f3f4f6]"
          >
            학습 시작하기
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-white/40 px-8 text-base font-semibold text-white transition-colors hover:bg-white/10"
          >
            회원가입
          </Link>
        </div>
      </section>

      {/* 2. 4단계 학습 흐름 요약 — 히어로와 간격을 더 벌린다 */}
      <section className="mt-10">
        <SectionHeading
          eyebrow="HOW IT WORKS"
          title="이렇게 학습합니다"
          desc="강의부터 랭킹까지 4단계로 자연스럽게 이어져요."
        />
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <StepCard
              key={step.no}
              no={step.no}
              emoji={step.emoji}
              title={step.title}
              desc={step.desc}
              targetId={step.targetId}
            />
          ))}
        </div>
      </section>

      {/* 3. 실제 화면으로 보는 학습 흐름 */}
      <section>
        <SectionHeading
          eyebrow="STEP BY STEP"
          title="실제 화면으로 살펴보기"
          desc="강의 시청부터 문제 제출까지, 실제 학습 화면을 따라가 보세요."
        />
        <div className="mt-12 flex flex-col gap-14">
          {FLOW.map((s, i) => (
            <div
              key={s.img}
              id={`flow-${s.img.replace(/\.png$/, "")}`}
              className={`scroll-mt-28 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10 ${
                i % 2 === 1 ? "sm:flex-row-reverse" : ""
              }`}
            >
              <div className="sm:w-3/5">
                <Shot
                  src={`/assets/img/guide/${s.img}`}
                  alt={`${s.title} 화면`}
                />
              </div>
              <div className="sm:w-2/5">
                <span className="inline-block rounded-full bg-[#eff6ff] px-3 py-1 text-sm font-bold text-[#1d4ed8]">
                  {s.step}
                </span>
                <h3 className="mt-3 text-xl font-extrabold text-[#1f2937]">
                  {s.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-[#6b7280]">
                  {splitDescLines(s.desc).map((sentence, si) => (
                    <span key={si}>
                      {si > 0 && <br />}
                      {sentence}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. 문제 구성 & 데이터셋 */}
      <section className="rounded-3xl bg-[#f3f4f6] px-6 py-14 sm:px-12">
        <SectionHeading
          eyebrow="HOW PROBLEMS WORK"
          title="문제는 이렇게 구성돼요"
          desc="실제 데이터를 코드로 분석하며 배우는 문제 구성이에요."
        />
        <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#e8e8e8] bg-white p-6">
            <h3 className="text-lg font-bold text-[#1f2937]">
              📦 대문제 · 소문제
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[#6b7280]">
              문제세트(대문제) 하나는 데이터셋 하나와 여러 개의 소문제로
              이뤄져요. 소문제는 난이도·배점별로 나뉘어 있어 단계적으로 풀어나갈
              수 있어요.
            </p>
          </div>
          <div className="rounded-2xl border border-[#e8e8e8] bg-white p-6">
            <h3 className="text-lg font-bold text-[#1f2937]">
              📊 진짜 데이터로 연습
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[#6b7280]">
              교과서 예제가 아니라 공공·의료·금융 등 실제 데이터를 다뤄요.
              결혼이민자 현황·경제지표·흡연단속 실적 같은 데이터로 실무 감각을
              키워요.
            </p>
          </div>
        </div>
      </section>

      {/* 5. 랭킹 */}
      <section className="rounded-3xl bg-[#f3f4f6] px-6 py-14 sm:px-12">
        <SectionHeading
          eyebrow="RANKING"
          title="다른 학습자와 함께 성장하세요"
          desc="누적 점수 기반 랭킹으로 나의 위치를 확인하고 동기부여를 받아요."
        />
        <div className="mx-auto mt-10 max-w-2xl">
          <Shot
            src="/assets/img/guide/ranking-board.png"
            alt="랭킹 페이지 화면"
          />
        </div>
      </section>

      {/* 6. 마무리 CTA */}
      <section className="text-center">
        <h2 className="text-2xl font-extrabold text-[#1f2937] sm:text-3xl">
          지금 바로 학습을 시작해보세요
        </h2>
        <p className="mt-3 text-base text-[#6b7280]">
          로그인하면 강좌를 수강하고 점수를 모을 수 있어요.
        </p>
        <Link
          href="/auth/login"
          className="mt-7 inline-flex h-12 items-center justify-center rounded-lg bg-[#1a237e] px-8 text-base font-bold text-white transition-colors hover:bg-[#111751]"
        >
          학습 시작하기
        </Link>
      </section>
    </div>
  );
}

// 마침표(.)·쉼표(,) 기준으로 문장을 나눈다. 구두점은 앞 조각에 유지하고, 뒤따르는 공백은 제거.
// 각 조각을 새 줄로 렌더해 긴 설명이 마침표/쉼표에서 줄바꿈되도록 한다.
function splitDescLines(text: string): string[] {
  return text
    .split(/(?<=[.,])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function SectionHeading({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="text-center">
      <span className="text-sm font-bold tracking-widest text-[#1a237e]">
        {eyebrow}
      </span>
      <h2 className="mt-3 text-2xl font-extrabold text-[#1f2937] sm:text-3xl">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-[#6b7280]">
        {desc}
      </p>
    </div>
  );
}

// 스크린샷 프레임 — 파일이 아직 없으면 빈 프레임(placeholder)만 보인다.
function Shot({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-[#e8e8e8] bg-white shadow-sm">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-contain"
        sizes="(max-width: 768px) 100vw, 700px"
      />
    </div>
  );
}
