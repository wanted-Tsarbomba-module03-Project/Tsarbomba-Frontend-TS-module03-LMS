import AdminBadgeListClient from "@/features/admin/badges/components/AdminBadgeListClient";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  description: "codebomba 관리자 뱃지 목록과 활성 상태를 관리하는 페이지입니다.",
  noIndex: true,
  path: "/admin/badges",
  title: "뱃지 관리",
});

export default function BadgeManagementPage() {
  return <AdminBadgeListClient />;
}
