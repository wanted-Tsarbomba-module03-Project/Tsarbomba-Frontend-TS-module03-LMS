import { expect, test } from "@playwright/test";

import { setupMockedPage } from "./fixtures";

test.describe("공개/개인화 주요 페이지 E2E", () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트는 로그인된 사용자 상태와 공통 API mock을 먼저 준비합니다.
    await setupMockedPage(page);
  });

  test("에러 페이지가 상태 메시지와 복구 버튼을 보여준다.", async ({ page }) => {
    // Given: 에러 정보를 query string으로 전달한 공통 에러 페이지에 진입합니다.
    await page.goto("/error-page?status=500&message=테스트%20오류&path=/ranking");

    // Then: 에러 화면의 주요 heading과 홈 이동 버튼이 렌더링되는지 확인합니다.
    await expect(page.getByRole("main").last()).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("button").last()).toBeVisible();
  });

  test("범용 챗봇 페이지가 대화 입력 영역을 렌더링한다.", async ({ page }) => {
    // Given: 새 범용 챗봇 화면에 진입합니다.
    await page.goto("/chat");

    // Then: 채팅 제목, 메시지 입력창, 전송 버튼이 보여야 합니다.
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("textarea")).toBeVisible();
    await expect(page.getByRole("button").last()).toBeVisible();
  });

  test("기존 범용 챗봇 대화방이 이전 메시지를 불러온다.", async ({ page }) => {
    // Given: mock API에 존재하는 채팅방 상세 URL로 진입합니다.
    await page.goto("/chat/301");

    // Then: 서버에서 받은 이전 사용자 메시지와 AI 답변이 렌더링됩니다.
    await expect(page.getByText("Explain this problem.")).toBeVisible();
    await expect(page.getByText("This is a mock answer.")).toBeVisible();
  });

  test("회원 문제풀이 목록에서 문제 목록과 상세 링크를 확인한다.", async ({ page }) => {
    // Given: 문제풀이 목록 페이지에 진입합니다.
    await page.goto("/problems");

    // Then: mock 문제 데이터가 표에 표시되고 상세 페이지 링크가 존재해야 합니다.
    await expect(page.getByRole("heading", { name: "문제풀이" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Pandas Data Analysis/ })).toBeVisible();
  });

  test("문제 상세 페이지에서 문제풀이방 챗봇을 열 수 있다.", async ({ page }) => {
    // Given: 문제 상세 페이지에 진입합니다.
    await page.goto("/problems/101");

    // When: 상단 문제챗봇 버튼을 클릭합니다.
    await page.getByRole("button", { name: /문제챗봇|챗봇/ }).click();

    // Then: 문제풀이방 챗봇 패널과 질문 입력창이 표시됩니다.
    await expect(page.getByText(/문제풀이 챗봇|문제.*챗봇/)).toBeVisible();
    await expect(page.locator("textarea").last()).toBeVisible();
  });

  test("랭킹 페이지가 전체 랭킹과 내 랭킹 정보를 보여준다.", async ({ page }) => {
    // Given: 랭킹 페이지에 진입합니다.
    await page.goto("/ranking");

    // Then: 전체 랭킹 목록과 mock 사용자 닉네임이 표시됩니다.
    await expect(page.getByRole("heading", { name: "랭킹" })).toBeVisible();
    await expect(page.getByText("code-master")).toBeVisible();
  });
});
