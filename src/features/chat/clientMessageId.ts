// 낙관적 렌더링용 임시 메시지 id (서버 messageId 수신 전 클라이언트 로컬 식별자).
// 문제풀이(User/Course) 채팅 전송에서 공통 사용.
export function createClientMessageId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}
