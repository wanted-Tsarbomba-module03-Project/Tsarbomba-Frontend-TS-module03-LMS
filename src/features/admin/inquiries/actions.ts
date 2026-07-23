import { requestAdminOperation } from "@/features/admin/operations/api";

import type {
  AdminInquiryClassificationRequest,
  AdminInquiryDetail,
  AdminInquiryFilterRequest,
  AdminInquiryListParams,
  AdminInquiryPageResponse,
  AdminInquiryReplyRequest,
  AdminInquirySummary,
} from "./types";

export async function getAdminInquiries(
  {
    isFiltered,
    domain = "",
    severity = "",
    status = "",
    page = 0,
    size = 20,
  }: AdminInquiryListParams,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({
    isFiltered: String(isFiltered),
    page: String(page),
    size: String(size),
  });

  if (domain) {
    params.set("domain", domain);
  }

  if (severity) {
    params.set("severity", severity);
  }

  if (status) {
    params.set("status", status);
  }

  return requestAdminOperation<AdminInquiryPageResponse>(
    `/api/v1/admin/inquiries?${params.toString()}`,
    { signal },
  );
}

export async function updateAdminInquiryClassification(
  inquiryId: number,
  payload: AdminInquiryClassificationRequest,
) {
  return requestAdminOperation<AdminInquirySummary>(
    `/api/v1/admin/inquiries/${inquiryId}/classification`,
    {
      body: JSON.stringify(payload),
      method: "PATCH",
    },
  );
}

export async function getAdminInquiryDetail(
  inquiryId: number | string,
  signal?: AbortSignal,
) {
  return requestAdminOperation<AdminInquiryDetail>(
    `/api/v1/admin/inquiries/${inquiryId}`,
    { signal },
  );
}

export async function replyAdminInquiry(
  inquiryId: number | string,
  payload: AdminInquiryReplyRequest,
) {
  return requestAdminOperation<AdminInquiryDetail>(
    `/api/v1/admin/inquiries/${inquiryId}/reply`,
    {
      body: JSON.stringify(payload),
      method: "POST",
    },
  );
}

export async function updateAdminInquiryFilter(
  inquiryId: number | string,
  payload: AdminInquiryFilterRequest,
) {
  return requestAdminOperation<AdminInquiryDetail>(
    `/api/v1/admin/inquiries/${inquiryId}/filter`,
    {
      body: JSON.stringify(payload),
      method: "PATCH",
    },
  );
}
