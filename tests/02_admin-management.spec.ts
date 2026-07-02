import { expect, test } from "@playwright/test";

import { setupMockedPage } from "./fixtures";

test.describe("관리자 운영 페이지 E2E", () => {
  test.beforeEach(async ({ page }) => {
    // 관리자 페이지는 RootLayout의 role 분기를 통과해야 하므로 MASTER 권한을 주입합니다.
    await setupMockedPage(page, "MASTER");
  });

  test("관리자 뱃지 목록 페이지가 뱃지 카드를 보여준다.", async ({ page }) => {
    // Given: 관리자 뱃지 관리 페이지에 진입합니다.
    await page.goto("/admin/badges");

    // Then: 목록 제목, 등록 링크, mock 뱃지 카드가 렌더링됩니다.
    await expect(page.getByRole("heading", { name: "뱃지 관리" })).toBeVisible();
    await expect(page.getByRole("link", { name: "등록하기" })).toBeVisible();
    await expect(page.getByText("Learning Badge")).toBeVisible();
  });

  test("관리자 알람 목록과 상세 페이지를 확인한다.", async ({ page }) => {
    // Given: 알람 목록 페이지에 진입합니다.
    await page.goto("/admin/alrams");

    // Then: 운영 알람 목록의 권장 조치가 표시됩니다.
    await expect(page.getByRole("heading", { name: "알람 관리" })).toBeVisible();
    await expect(page.getByText("Check the answer rate.")).toBeVisible();

    // When: 알람 상세 페이지로 직접 진입합니다.
    await page.goto("/admin/alrams/1");

    // Then: 상세 정보 카드가 표시됩니다.
    await expect(page.getByRole("heading", { name: "알림 정보" })).toBeVisible();
    await expect(page.getByText("Check the answer rate.")).toBeVisible();
  });

  test("관리자 회원 목록과 상세 페이지를 확인한다.", async ({ page }) => {
    // Given: 관리자 회원 목록 페이지에 진입합니다.
    await page.goto("/admin/users");

    // Then: 회원 목록에 mock 회원이 표시됩니다.
    await expect(page.getByRole("heading", { name: "회원 관리" })).toBeVisible();
    await expect(page.getByText("student@example.com")).toBeVisible();

    // When: 회원 상세 페이지로 직접 진입합니다.
    await page.goto("/admin/users/11");

    // Then: 회원 상세조회 화면의 핵심 정보가 표시됩니다.
    await expect(page.getByRole("heading", { name: "회원 상세조회" })).toBeVisible();
    await expect(page.getByText("student@example.com")).toBeVisible();
  });

  test("관리자 규칙 페이지가 자동화 규칙 편집 UI를 보여준다.", async ({ page }) => {
    // Given: 규칙 관리 페이지에 진입합니다.
    await page.goto("/admin/rules");

    // Then: 규칙 제목과 저장 계열 버튼이 표시됩니다.
    await expect(page.getByRole("heading", { name: "규칙 관리" })).toBeVisible();
    await expect(page.getByRole("button").last()).toBeVisible();
  });

  test("관리자 관리 페이지가 관리자 계정 목록을 보여준다.", async ({ page }) => {
    // Given: MASTER 전용 관리자 관리 페이지에 진입합니다.
    await page.goto("/admin/master");

    // Then: 관리자 계정 목록과 권한 버튼이 렌더링됩니다.
    await expect(page.getByRole("heading", { name: "관리자 관리" })).toBeVisible();
    await expect(page.getByText("operator@example.com")).toBeVisible();
  });
});
