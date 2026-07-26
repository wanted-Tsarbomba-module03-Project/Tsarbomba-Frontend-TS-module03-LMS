"use client";

import dynamic from "next/dynamic";

// react-markdown + remark-gfm + react-syntax-highlighter(무거움)를 별도 청크로 분리해
// 채팅/문제 상세 라우트의 초기 번들(First Load JS)에서 제외한다.
// 메시지가 실제 렌더될 때 한 번만 로드되며 이후 캐시된다.
const ChatMarkdown = dynamic(() => import("./ChatMarkdown"), {
  ssr: false,
  loading: () => (
    <span
      aria-live="polite"
      className="inline-flex min-h-5 items-center text-description text-text-secondary"
      role="status"
    >
      답변을 표시하는 중입니다.
    </span>
  ),
});

export default ChatMarkdown;
