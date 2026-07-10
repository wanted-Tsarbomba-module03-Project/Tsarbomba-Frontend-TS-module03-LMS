"use client";

function Footer() {
  return (
    <footer className="w-full min-h-12.5 bg-[#f3f4f6] flex items-center justify-center mt-3.75">
      <div className="w-full max-w-300 flex flex-col items-center justify-center box-border px-4 py-2">
        <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-1 text-center text-xs sm:text-sm lg:text-[11px] text-[#6b7280]">
          <span className="cursor-pointer hover:underline hover:underline-offset-[3px]">
            이용약관
          </span>
          <span>|</span>
          <span className="cursor-pointer hover:underline hover:underline-offset-[3px]">
            개인정보처리방침
          </span>
          <span>|</span>
          <span className="cursor-pointer hover:underline hover:underline-offset-[3px]">
            코드붐바정책
          </span>
          <span>|</span>
          <span className="cursor-pointer hover:underline hover:underline-offset-[3px]">
            고객센터
          </span>
        </div>

        <p className="mt-1.25 flex justify-center items-center text-center text-xs sm:text-sm lg:text-[11px] text-[#6b7280] cursor-pointer">
          © 2026 Tsarbomba All rights reserved
        </p>
      </div>
    </footer>
  );
}

export default Footer;
