import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "./globals.css";

import AppShell from "@/components/layout/AppShell";
import QueryProvider from "@/lib/query/QueryProvider";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

const SITE_DESCRIPTION =
  "codebomba에서 강의, 문제풀이, 랭킹, AI 챗봇을 통해 학습 흐름을 이어가세요.";

// 루트가 서버 컴포넌트로 복원되어 metadata/viewport 를 정석대로 여기서 export 한다.
// (기존엔 루트가 "use client" 라 불가능 → (user)/layout.tsx 로 우회하던 것을 정리)
export const metadata: Metadata = {
  applicationName: SITE_NAME,
  authors: [{ name: "codebomba" }],
  creator: SITE_NAME,
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  openGraph: {
    description: SITE_DESCRIPTION,
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
    description: SITE_DESCRIPTION,
    title: SITE_NAME,
  },
};

export const viewport: Viewport = {
  initialScale: 1,
  width: "device-width",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-white min-h-screen m-0 p-0 antialiased flex flex-col">
        <QueryProvider>
          <AppShell>{children}</AppShell>
        </QueryProvider>
      </body>
    </html>
  );
}
