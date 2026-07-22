import AdminInquiryDetailClient from "@/features/admin/inquiries/components/AdminInquiryDetailClient";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  description:
    "codebomba 관리자 문의사항 상세 내용과 관리자 답변을 확인하는 운영 페이지입니다.",
  noIndex: true,
  path: "/admin/cs",
  title: "문의사항 상세",
});

export default function AdminInquiryDetailPage() {
  return <AdminInquiryDetailClient />;
}
