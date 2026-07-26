"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * TanStack Query 전역 프로바이더.
 *
 * 컴포넌트마다 흩어져 있던 useEffect + fetch + useState 3종 세트를
 * useQuery/useMutation 으로 대체하기 위한 진입점. 캐싱·중복 요청 제거·
 * 자동 재시도·백그라운드 갱신을 기본 제공한다.
 *
 * QueryClient 는 렌더마다 재생성되지 않도록 useState 초기화로 1회만 만든다.
 */
export default function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 401 등 인증 오류는 재시도 무의미 → 1회만 재시도, 창 포커스 자동 refetch 는 끔.
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 30_000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
