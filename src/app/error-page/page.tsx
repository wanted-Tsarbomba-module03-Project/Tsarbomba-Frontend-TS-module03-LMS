// SSR - 에러 페이지: URL query로 전달된 에러 정보를 서버에서 읽어 공통 에러 화면을 구성함
import ErrorPageView from "@/components/common/ErrorPageView";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  description:
    "요청 처리 중 발생한 오류 상태와 복구 동선을 안내하는 codebomba 오류 페이지입니다.",
  noIndex: true,
  path: "/error-page",
  title: "오류 안내",
});

interface ErrorPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ErrorPage({ searchParams }: ErrorPageProps) {
  const params = await searchParams;

  return (
    <ErrorPageView
      code={getParam(params.code)}
      message={getParam(params.message)}
      path={getParam(params.path)}
      returnTo={getParam(params.returnTo)}
      status={Number(getParam(params.status) ?? 500)}
      timestamp={getParam(params.timestamp)}
    />
  );
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
