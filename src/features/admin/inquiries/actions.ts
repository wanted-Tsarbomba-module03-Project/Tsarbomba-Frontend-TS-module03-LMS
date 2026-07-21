import { requestAdminOperation } from "@/features/admin/operations/api";

import type { AdminInquiryListParams, AdminInquiryPageResponse } from "./types";

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
