// CSR - 범용 챗봇: 사용자의 입력과 응답, 채팅방 생성/전환이 즉시 반영되는 대화형 화면
import GeneralChatClient from "@/features/chat/components/GeneralChatClient";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  description:
    "codebomba AI 챗봇에서 학습 질문을 이어가고 이전 대화방을 관리하세요.",
  noIndex: true,
  path: "/chat",
  title: "AI 챗봇",
});

export default function GeneralChatPage() {
  return <GeneralChatClient />;
}
