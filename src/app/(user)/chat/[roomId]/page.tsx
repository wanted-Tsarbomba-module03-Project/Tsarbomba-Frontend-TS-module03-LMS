// CSR - 범용 챗봇 상세: 기존 채팅방 메시지를 불러오고 이어서 대화해야 하는 개인화 화면
import GeneralChatClient from "@/features/chat/components/GeneralChatClient";
import { createPageMetadata } from "@/lib/seo";

interface GeneralChatRoomPageProps {
  params: Promise<{
    roomId: string;
  }>;
}

export async function generateMetadata({ params }: GeneralChatRoomPageProps) {
  const { roomId } = await params;

  return createPageMetadata({
    description:
      "codebomba AI 챗봇 대화방에서 이전 질문과 답변 흐름을 이어서 확인하세요.",
    noIndex: true,
    path: `/chat/${roomId}`,
    title: "AI 챗봇 대화방",
  });
}

export default async function GeneralChatRoomPage({
  params,
}: GeneralChatRoomPageProps) {
  const { roomId } = await params;

  return <GeneralChatClient roomId={roomId} />;
}
