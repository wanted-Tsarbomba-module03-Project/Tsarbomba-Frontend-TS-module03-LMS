import AdminInquiriesClient from "@/features/admin/inquiries/components/AdminInquiriesClient";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  description:
    "codebomba 관리자 문의사항 목록과 처리 상태를 확인하는 운영 페이지입니다.",
  noIndex: true,
  path: "/admin/cs",
  title: "문의사항 관리",
});

export default function CsPage() {
  return <AdminInquiriesClient />;
}
