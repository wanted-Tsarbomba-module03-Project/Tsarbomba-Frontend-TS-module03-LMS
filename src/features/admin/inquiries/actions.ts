import { requestAdminOperation } from "@/features/admin/operations/api";

import type {
  AdminInquiryClassificationRequest,
  AdminInquiryListParams,
  AdminInquiryPageResponse,
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
