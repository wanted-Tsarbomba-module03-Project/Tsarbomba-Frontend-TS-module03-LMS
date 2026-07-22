import { ApiClientError, type BackendErrorPayload } from "@/lib/errorHandling";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const FALLBACK_MESSAGE =
  "문의 요청 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.";

interface ApiResponse<T> {
  status?: number;
  message?: string;
  data?: T;
}

export interface CreateInquiryRequest {
  content: string;
  sourceUrl: string;
}

export interface ActiveInquiryReply {
  inquiryId: number;
  title: string;
  content: string;
  adminReply: string;
  repliedAt: string;
}

export interface ActiveInquiryRepliesResponse {
  replies: ActiveInquiryReply[];
}

export interface InquiryReplyVisibilityResponse {
  inquiryId: number;
  replyVisible: boolean;
}

export async function createInquiry(payload: CreateInquiryRequest) {
  return requestInquiry<unknown>("/api/v1/inquiries", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function getActiveInquiryReplies(signal?: AbortSignal) {
  return requestInquiry<ActiveInquiryRepliesResponse>(
    "/api/v1/inquiries/me/replies/active",
    { signal },
  );
}

export async function markInquiryReplyVisible(inquiryId: number) {
  return requestInquiry<InquiryReplyVisibilityResponse>(
    `/api/v1/inquiries/${inquiryId}/reply-visibility`,
    { method: "PATCH" },
  );
}

async function requestInquiry<T>(path: string, init: RequestInit = {}) {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
  } catch (error) {
    throw new ApiClientError(
      {
        message: error instanceof Error ? error.message : FALLBACK_MESSAGE,
        path,
      },
      FALLBACK_MESSAGE,
    );
  }

  const text = await response.text();

  if (!response.ok) {
    throw createApiError(response, text, path);
  }

  if (!text) {
    return { data: undefined };
  }

  try {
    return JSON.parse(text) as ApiResponse<T>;
  } catch {
    throw new ApiClientError(
      {
        message: FALLBACK_MESSAGE,
        path,
      },
      FALLBACK_MESSAGE,
    );
  }
}

function createApiError(response: Response, text: string, requestPath: string) {
  if (!text) {
    return new ApiClientError(
      {
        status: response.status,
        message: FALLBACK_MESSAGE,
        path: requestPath,
      },
      FALLBACK_MESSAGE,
    );
  }

  try {
    const payload = JSON.parse(text) as BackendErrorPayload;

    return new ApiClientError(
      {
        ...payload,
        status: payload.status ?? response.status,
        path: payload.path ?? requestPath,
      },
      FALLBACK_MESSAGE,
    );
  } catch {
    return new ApiClientError(
      {
        status: response.status,
        message: text || FALLBACK_MESSAGE,
        path: requestPath,
      },
      FALLBACK_MESSAGE,
    );
  }
}
