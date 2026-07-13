// 채팅 응답을 한 글자씩 출력하는 타자기(typewriter) 효과 유틸리티.
// 스트리밍 토큰을 큐에 버퍼링하여 일정한 속도로 화면에 흘려보낸다.

interface ChatTypewriterOptions {
  intervalMs?: number; // 글자 간 출력 간격(ms)
  onUpdate: (content: string) => void; // 현재까지 표시된 문자열을 전달하는 콜백(UI 갱신용)
  signal?: AbortSignal; // 외부에서 애니메이션을 중단시키는 신호
}

const DEFAULT_TYPEWRITER_INTERVAL_MS = 18;

// 한글 자소가 조합 중간 상태로 깨지지 않도록 grapheme(완성 글자) 단위로 분할한다.
// Intl.Segmenter를 지원하지 않는 환경에서는 null로 두고 Array.from으로 폴백한다.
const graphemeSegmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter("ko", { granularity: "grapheme" })
    : null;

export function createChatTypewriter({
  intervalMs = DEFAULT_TYPEWRITER_INTERVAL_MS,
  onUpdate,
  signal,
}: ChatTypewriterOptions) {
  let displayedContent = ""; // 현재까지 화면에 표시된 문자열
  let queuedCharacters: string[] = []; // 아직 출력되지 않은 대기 문자 버퍼
  let timerId: ReturnType<typeof setTimeout> | null = null; // 다음 tick 예약 타이머
  let stopped = false; // 중단 여부
  let flushResolvers: Array<() => void> = []; // flush() 완료를 기다리는 resolver 목록

  // 큐가 비고 타이머도 없으면(=출력 완료) 대기 중인 flush Promise를 모두 해결한다.
  const resolveFlush = () => {
    if (queuedCharacters.length > 0 || timerId) {
      return;
    }

    flushResolvers.forEach((resolve) => resolve());
    flushResolvers = [];
  };

  // 예약된 타이머를 정리한다.
  const clearTimer = () => {
    if (!timerId) {
      return;
    }

    clearTimeout(timerId);
    timerId = null;
  };

  // 애니메이션을 즉시 중단하고 남은 버퍼를 비운다.
  const stop = () => {
    stopped = true;
    queuedCharacters = [];
    clearTimer();
    resolveFlush();
  };

  // 한 글자를 화면에 반영하고, 남은 글자가 있으면 다음 tick을 예약한다.
  const tick = () => {
    timerId = null;

    if (stopped || signal?.aborted) {
      stop();
      return;
    }

    const nextCharacter = queuedCharacters.shift();

    if (nextCharacter) {
      displayedContent += nextCharacter;
      onUpdate(displayedContent);
    }

    if (queuedCharacters.length > 0) {
      timerId = setTimeout(tick, intervalMs);
      return;
    }

    resolveFlush();
  };

  // 출력할 글자가 있고 타이머가 없을 때만 타이머를 시작한다(중복 예약 방지).
  const schedule = () => {
    if (stopped || signal?.aborted || timerId || queuedCharacters.length === 0) {
      return;
    }

    timerId = setTimeout(tick, intervalMs);
  };

  return {
    // 큐의 모든 글자가 출력될 때까지 기다리는 Promise를 반환한다.
    flush() {
      if (queuedCharacters.length === 0 && !timerId) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        flushResolvers.push(resolve);
      });
    },
    // 새 텍스트 토큰을 글자 단위로 쪼개 큐에 넣고 애니메이션을 시작한다.
    push(token: string) {
      if (stopped || signal?.aborted || !token) {
        return;
      }

      queuedCharacters.push(...splitCharacters(token));
      schedule();
    },
    stop,
  };
}

// 문자열을 grapheme 단위로 분할한다(Segmenter 미지원 시 코드포인트 단위로 폴백).
function splitCharacters(value: string) {
  if (!graphemeSegmenter) {
    return Array.from(value);
  }

  return Array.from(graphemeSegmenter.segment(value), (item) => item.segment);
}
