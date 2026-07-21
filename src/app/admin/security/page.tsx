// Server - 관리자(ADMIN/MASTER) 로그인 후 보안 요약 콘솔 랜딩
import SecuritySummaryClient from "@/features/admin/security/components/SecuritySummaryClient";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  description: "codebomba 운영/보안 요약과 AI 브리핑을 확인하는 관리자 페이지입니다.",
  noIndex: true,
  path: "/admin/security",
  title: "보안 요약",
});

export default function AdminSecurityPage() {
  return <SecuritySummaryClient />;
}
