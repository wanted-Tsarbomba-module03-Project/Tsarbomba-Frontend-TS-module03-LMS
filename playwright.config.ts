import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // 참고 프로젝트와 동일하게 tests 폴더 아래의 spec 파일을 실행합니다.
  testDir: "./tests",
  // 각 페이지가 독립 mock을 사용하므로 병렬 실행해도 서로 상태가 섞이지 않습니다.
  fullyParallel: true,
  // CI에서 실수로 남긴 test.only가 배포 파이프라인을 통과하지 않도록 막습니다.
  forbidOnly: Boolean(process.env.CI),
  // CI에서는 일시적 렌더링 지연에 대비해 재시도를 허용합니다.
  retries: process.env.CI ? 2 : 0,
  // CI 리소스 사용량을 줄이기 위해 worker를 하나로 제한합니다.
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "node tests/mock-api-server.mjs",
      reuseExistingServer: true,
      timeout: 120 * 1000,
      url: "http://localhost:4010/health",
    },
    {
      command: "npm run dev",
      env: {
        API_PROXY_TARGET: "http://localhost:4010",
        NEXT_PUBLIC_API_URL: "http://localhost:4010",
      },
      reuseExistingServer: false,
      timeout: 120 * 1000,
      url: "http://localhost:3001",
    },
  ],
});
