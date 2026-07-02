// Server - 최고관리자 전용: MASTER 권한만 접근 가능한 관리자 관리 진입 화면임
import MasterAccountsClient from "@/features/admin/operations/components/MasterAccountsClient";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  description: "codebomba 최고 관리자 계정과 권한을 관리하는 페이지입니다.",
  noIndex: true,
  path: "/admin/master",
  title: "관리자 관리",
});

export default function AdminMasterPage() {
  return <MasterAccountsClient />;
}
