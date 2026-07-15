import { ApiClientError, type BackendErrorPayload } from "@/lib/errorHandling";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// 상대 경로면 BASE_URL을 붙이고, blob:/data:/절대 URL은 그대로 통과.
export const resolveThumbnailUrl = (url?: string | null): string => {
  if (!url) return "";
  if (
    url.startsWith("http") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  return `${BASE_URL}${url}`;
};

/**
 * 공통 fetch — 쿠키 인증 고정, FormData면 Content-Type 자동, 성공 시 { data } 언래핑.
 */
export async function request<T>(
  path: string,
  init: RequestInit = {},
  fallbackMessage = "요청을 처리하지 못했습니다.",
): Promise<T> {
  const isFormData = init.body instanceof FormData;

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...init.headers,
    },
  });

  const text = await response.text();
  const parsed = text ? JSON.parse(text) : null;

  if (!response.ok) {
    // status/code 를 실은 ApiClientError 로 던져 호출부에서 403/404 등을 구분 처리할 수 있게 함
    // (plain Error 로 던지면 err.status 가 없어 잠김/삭제 분기가 전부 404 로 빠짐)
    const payload = (parsed ?? {}) as BackendErrorPayload;
    throw new ApiClientError(
      {
        ...payload,
        status: payload.status ?? response.status,
        message: payload.message ?? fallbackMessage,
        path: payload.path ?? path,
      },
      fallbackMessage,
    );
  }

  return (parsed?.data ?? parsed) as T;
}
