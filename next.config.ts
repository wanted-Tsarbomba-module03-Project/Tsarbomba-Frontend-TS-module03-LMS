import type { NextConfig } from "next";

// 프록시 대상 BE 주소 — 서버 전용 API_PROXY_TARGET 우선, 없으면 NEXT_PUBLIC_API_URL.
// 프로덕션(ALB)에서는 둘 다 비우고 브라우저가 상대경로 /api 를 ALB로 직접 보낸다 → Next rewrite 불필요.
// 값이 있을 때(로컬 개발 등)만 Next 프록시 rewrite 를 건다.
const apiProxyTarget =
  process.env.API_PROXY_TARGET ?? process.env.NEXT_PUBLIC_API_URL ?? "";
const imageRemotePatterns = resolveImageRemotePatterns([
  process.env.NEXT_PUBLIC_API_URL,
  process.env.API_PROXY_TARGET,
  ...(process.env.NEXT_IMAGE_REMOTE_PATTERNS ?? "").split(","),
]);

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: imageRemotePatterns,
  },
  async rewrites() {
    if (!apiProxyTarget) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

function resolveImageRemotePatterns(values: Array<string | undefined>) {
  const patternMap = new Map<
    string,
    {
      hostname: string;
      pathname: string;
      port?: string;
      protocol: "https";
    }
  >();

  values.forEach((value) => {
    const pattern = toHttpsImageRemotePattern(value);

    if (!pattern) {
      return;
    }

    patternMap.set(
      `${pattern.protocol}:${pattern.hostname}:${pattern.port ?? ""}:${pattern.pathname}`,
      pattern,
    );
  });

  return Array.from(patternMap.values());
}

function toHttpsImageRemotePattern(value?: string) {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return null;
  }

  try {
    const url = new URL(
      normalizedValue.includes("://")
        ? normalizedValue
        : `https://${normalizedValue}`,
    );

    if (url.protocol !== "https:") {
      return null;
    }

    const pathname =
      url.pathname && url.pathname !== "/"
        ? `${url.pathname.replace(/\/$/, "")}/**`
        : "/**";

    return {
      hostname: url.hostname,
      pathname,
      port: url.port || undefined,
      protocol: "https" as const,
    };
  } catch {
    return null;
  }
}
