import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  authors: [{ name: "codebomba" }],
  creator: SITE_NAME,
  description:
    "codebomba에서 강의, 문제풀이, 랭킹, AI 챗봇을 통해 학습 흐름을 이어가세요.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    description:
      "codebomba에서 강의, 문제풀이, 랭킹, AI 챗봇을 통해 학습 흐름을 이어가세요.",
    locale: "ko_KR",
    siteName: SITE_NAME,
    title: SITE_NAME,
    type: "website",
    url: "/",
  },
  publisher: SITE_NAME,
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  twitter: {
    card: "summary",
    description:
      "codebomba에서 강의, 문제풀이, 랭킹, AI 챗봇을 통해 학습 흐름을 이어가세요.",
    title: SITE_NAME,
  },
};

export default function UserLayout({ children }: { children: ReactNode }) {
  return children;
}
