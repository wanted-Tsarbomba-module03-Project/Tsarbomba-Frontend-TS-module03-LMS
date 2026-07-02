import { expect, test } from "@playwright/test";

import { setupMockedPage } from "./fixtures";

test.describe("관리자 문제 관리 페이지 E2E", () => {
  test.beforeEach(async ({ page }) => {
    // 문제 관리 화면은 관리자 레이아웃 권한 체크를 통과해야 하므로 MASTER 권한을 사용합니다.
    await setupMockedPage(page, "MASTER");
  });

  test("관리자 문제 목록에서 문제를 확인하고 등록 화면으로 이동한다.", async ({ page }) => {
    // Given: 관리자 문제 목록 페이지에 진입합니다.
    await page.goto("/admin/problems");

    // Then: 문제 관리 제목과 mock 문제 목록이 표시됩니다.
    await expect(page.getByRole("heading", { name: "문제 관리" })).toBeVisible();
    await expect(page.getByText("Pandas Data Analysis")).toBeVisible();

    // When: 등록하기 버튼을 클릭합니다.
    await page.getByRole("button", { name: "등록하기" }).click();

    // Then: 문제 등록 페이지로 이동합니다.
    await expect(page).toHaveURL(/\/admin\/problems\/new$/);
    await expect(page.getByRole("heading", { name: "문제 등록" })).toBeVisible();
  });

  test("관리자 문제 등록 페이지가 필수 입력 폼을 렌더링한다.", async ({ page }) => {
    // Given: 문제 등록 페이지에 직접 진입합니다.
    await page.goto("/admin/problems/new");

    // Then: 문제 등록 제목, 텍스트 입력, 제출 버튼이 보여야 합니다.
    await expect(page.getByRole("heading", { name: "문제 등록" })).toBeVisible();
    await expect(page.locator("input").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /등록/ }).last()).toBeVisible();
  });

  test("관리자 문제 수정 페이지가 기존 문제 데이터를 불러온다.", async ({ page }) => {
    // Given: 문제 수정 페이지에 직접 진입합니다.
    await page.goto("/admin/problems/101/edit");

    // Then: 수정 제목과 기존 문제명이 렌더링됩니다.
    await expect(page.getByRole("heading", { name: "문제 수정" })).toBeVisible();
    await expect(page.locator('input[value="Pandas Data Analysis"]').first()).toBeVisible();
    await expect(page.getByRole("button", { name: "수정" })).toBeVisible();
  });
});
