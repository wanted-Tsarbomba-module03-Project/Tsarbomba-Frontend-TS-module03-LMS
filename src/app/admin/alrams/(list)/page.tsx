// CSR - 알람 전체조회: 필터 변경마다 최신 운영 알람을 사용자 세션 기준으로 조회함
import AlramsClient from "@/features/admin/operations/components/AlramsClient";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  description:
    "codebomba 관리자 알람 목록과 처리 상태를 확인하는 운영 페이지입니다.",
  noIndex: true,
  path: "/admin/alrams",
  title: "알람 관리",
});

export default function AlramsPage() {
  return <AlramsClient />;
}
