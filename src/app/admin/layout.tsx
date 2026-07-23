import type { Metadata } from "next";
import type { ReactNode } from "react";

import AdminOpsChatWidget from "@/features/admin/ops-chat/AdminOpsChatWidget";
import ProblemDraftGenerationStatus from "@/features/problems/components/ProblemDraftGenerationStatus";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  description: "codebomba 관리자 전용 운영 화면입니다.",
  noIndex: true,
  path: "/admin",
  title: "관리자",
});

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ProblemDraftGenerationStatus />
      <AdminOpsChatWidget />
    </>
  );
}
