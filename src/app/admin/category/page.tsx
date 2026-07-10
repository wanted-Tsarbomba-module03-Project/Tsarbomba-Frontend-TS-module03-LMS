import { createPageMetadata } from "@/lib/seo";
export const metadata = createPageMetadata({
  description: "codebomba 문제의 카테고리를 관리하는 페이지입니다.",
  noIndex: true,
  path: "/admin/category",
  title: "카테고리 관리",
});
export default function CategoryManagementPage() {
  return null;
}
