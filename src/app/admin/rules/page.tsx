// CSR - 규칙 관리: 관리자가 입력값과 활성 상태를 즉시 수정하는 상호작용 화면이 필요함
import RulesClient from "@/features/admin/operations/components/RulesClient";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  description: "codebomba 관리자 운영 규칙과 활성화 상태를 관리하는 페이지입니다.",
  noIndex: true,
  path: "/admin/rules",
  title: "규칙 관리",
});

export default function RulesPage() {
  return (
    <main className="box-border p-6 text-text-primary">
      <h1 className="m-0 text-2xl font-bold">규칙 관리</h1>
      <RulesClient />
    </main>
  );
}
