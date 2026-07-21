import { ApiClientError, type BackendErrorPayload } from "@/lib/errorHandling";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const STREAM_FALLBACK_MESSAGE =
  "AI 응답을 불러오지 못했습니다.\n잠시 후 다시 시도해 주세요.";

export interface ChatStreamHandlers {
  onToken: (text: string) => void;
  onRoom?: (roomId: number) => void;
  onStatus?: (status: { tool?: string; message: string }) => void;
  onDone?: (usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  }) => void;
  onError?: (err: { code: string; message: string }) => void;
}

export async function streamChat(
  path: string,
  body: unknown,
  handlers: ChatStreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    credentials: "include", // accessToken 쿠키 자동 동봉
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(body),
    signal,
  });

  // 스트림 시작 전 에러(401/403/404 등)는 JSON 본문으로 옴
  if (!res.ok || !res.body) {
    const text = await res.text();
    throw createStreamStartError(res, text, path);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // 빈 줄(\n\n)로 프레임 분리, 마지막 미완성 조각은 버퍼에 남김
      const frames = buffer.split(/\r?\n\r?\n/);
      buffer = frames.pop() ?? "";
      for (const frame of frames) {
        const event = handleFrame(frame, handlers);

        if (event === "message") {
          await waitForNextPaint();
        }
      }
    }
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }

    if (buffer.trim()) {
      handleFrame(buffer, handlers);
      buffer = "";
    }

    throw error;
  }

  if (buffer.trim()) {
    handleFrame(buffer, handlers);
  }
}

function handleFrame(raw: string, h: ChatStreamHandlers) {
  let event = "";
  let data = "";
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) data += line.slice(5).replace(/^ /, "");
  }
  if (!data) return null;

  const parsed = JSON.parse(data);

  if (event === "room") h.onRoom?.(parsed.roomId);
  else if (event === "status") h.onStatus?.(parsed);
  else if (event === "done") h.onDone?.(parsed);
  else if (event === "error") h.onError?.(parsed);
  else h.onToken(parsed.t ?? ""); // 본문 토큰 {"t":"..."}

  return event || "message";
}

function waitForNextPaint() {
  return new Promise<void>((resolve) => {
    if (document.visibilityState === "visible") {
      requestAnimationFrame(() => resolve());
      return;
    }

    window.setTimeout(resolve, 0);
  });
}

function createStreamStartError(
  response: Response,
  text: string,
  path: string,
) {
  if (!text) {
    return new ApiClientError(
      {
        status: response.status,
        message: STREAM_FALLBACK_MESSAGE,
        path,
      },
      STREAM_FALLBACK_MESSAGE,
    );
  }

  try {
    const payload = JSON.parse(text) as BackendErrorPayload;

    return new ApiClientError(
      {
        ...payload,
        status: payload.status ?? response.status,
        path: payload.path ?? path,
      },
      STREAM_FALLBACK_MESSAGE,
    );
  } catch {
    return new ApiClientError(
      {
        status: response.status,
        message: text || STREAM_FALLBACK_MESSAGE,
        path,
      },
      STREAM_FALLBACK_MESSAGE,
    );
  }
}
