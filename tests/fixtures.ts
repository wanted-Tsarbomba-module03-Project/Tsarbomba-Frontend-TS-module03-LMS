import type { Page, Route } from "@playwright/test";

type JsonBody = Record<string, unknown> | unknown[];

const courses = [
  {
    courseId: 1,
    instructorId: 1,
    courseCategoryId: 1,
    courseCategoryName: "Data",
    title: "Data Analysis Basics",
    description: "A mock course used while the app bootstraps in E2E tests.",
    thumbnailUrl: "",
    status: "ACTIVE",
  },
];

const problemSummaries = [
  {
    problemSetId: 101,
    problemNumber: 1,
    title: "Pandas Data Analysis",
    description: "Read a CSV file and calculate basic statistics.",
    difficulty: "EASY",
    accuracyRate: 82,
    createdAt: "2026-07-01T00:00:00Z",
  },
  {
    problemSetId: 102,
    problemNumber: 2,
    title: "Visualization Basics",
    description: "Draw a basic matplotlib chart.",
    difficulty: "MEDIUM",
    accuracyRate: 64,
    createdAt: "2026-07-01T00:00:00Z",
  },
];

const problemDetail = {
  id: 101,
  title: "Pandas Data Analysis",
  currentProblemId: 1001,
  currentProblemNumber: 1,
  problems: [
    {
      problemId: 1001,
      problemNumber: 1,
      title: "Average Calculation",
      content: "Calculate the average value from a dataframe.",
      point: 10,
      startCode: "import pandas as pd\n",
      hint: "Use the mean function.",
      explanation: "This is a mock explanation.",
      status: "UNSOLVED",
      testCases: [],
    },
  ],
};

const rankingUsers = [
  {
    rank: 1,
    userId: 1,
    name: "Code Kim",
    nickname: "code-master",
    badgeImageUrl: null,
    weeklyPoint: 120,
    totalPoint: 980,
  },
  {
    rank: 2,
    userId: 2,
    name: "Test Park",
    nickname: "tester",
    badgeImageUrl: null,
    weeklyPoint: 95,
    totalPoint: 870,
  },
];

const adminUsers = [
  {
    userId: 11,
    name: "Student One",
    nickname: "student-one",
    email: "student@example.com",
    role: "STUDENT",
    locked: false,
    createdAt: "2026-07-01T00:00:00Z",
  },
];

const adminAccounts = [
  {
    userId: 1,
    name: "Master Operator",
    nickname: "operator",
    email: "operator@example.com",
    permissionStates: {
      userManagement: true,
      ruleManagement: true,
    },
  },
];

function json(data: JsonBody) {
  return {
    contentType: "application/json",
    body: JSON.stringify(data),
  };
}

function pageResponse<T>(content: T[]) {
  return {
    data: {
      content,
      items: content,
      totalElements: content.length,
      totalPages: 1,
    },
  };
}

async function fulfillJson(route: Route, data: JsonBody) {
  await route.fulfill({
    status: 200,
    ...json(data),
  });
}

export async function prepareAuthenticatedPage(page: Page, role = "MASTER") {
  // 페이지 스크립트가 실행되기 전에 localStorage에 권한 정보를 주입합니다.
  await page.addInitScript((nextRole) => {
    window.localStorage.setItem("userRole", nextRole);
    window.localStorage.setItem("userNickname", "operator");
  }, role);
}

export async function mockApi(page: Page) {
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();

    // 클라이언트 fetch가 직접 호출하는 강의 API도 mock해서 화면 이동 중 에러를 방지합니다.
    if (path === "/api/v1/courses") {
      return fulfillJson(route, { data: courses });
    }

    if (path === "/api/v1/users/me/enrollments") {
      return fulfillJson(route, { data: [] });
    }

    if (/^\/api\/v1\/courses\/\d+$/.test(path)) {
      return fulfillJson(route, { data: { ...courses[0], instructorName: "Operator" } });
    }

    if (/^\/api\/v1\/courses\/\d+\/lectures$/.test(path)) {
      return fulfillJson(route, { data: [] });
    }

    // 공통 사용자 정보는 Header, Sidebar, 관리자 접근 권한 확인에서 반복 호출됩니다.
    if (path === "/api/v1/users/me") {
      return fulfillJson(route, {
        data: {
          userId: 1,
          name: "Test Operator",
          nickname: "operator",
          email: "operator@example.com",
          role: "MASTER",
          provider: "LOCAL",
        },
      });
    }

    if (path.startsWith("/api/v1/badges/me")) {
      return fulfillJson(route, { data: [] });
    }

    // 문제 목록, 상세, 관리자 문제 CRUD 화면에서 사용하는 최소 API입니다.
    if (path === "/api/v1/problem-categories") {
      return fulfillJson(route, {
        data: [{ categoryId: "1", categoryName: "Data Analysis" }],
      });
    }

    if (path === "/api/v1/problem-sets") {
      return fulfillJson(route, {
        data: {
          content: problemSummaries,
          problemSets: problemSummaries,
          totalElements: problemSummaries.length,
          totalPages: 1,
        },
      });
    }

    if (/^\/api\/v1\/problem-sets\/\d+$/.test(path)) {
      return fulfillJson(route, { data: problemDetail });
    }

    if (/^\/api\/v1\/problem-sets\/\d+\/result$/.test(path)) {
      return fulfillJson(route, {
        data: {
          problemSetId: 101,
          title: "Pandas Data Analysis",
          isCompleted: false,
          accuracyRate: 0,
          totalCompletedUserCount: 0,
          correctCompletedUserCount: 0,
          submissions: [],
        },
      });
    }

    if (/^\/api\/v1\/problems\/\d+$/.test(path)) {
      return fulfillJson(route, {
        data: {
          title: "Pandas Data Analysis",
          categoryName: "Data Analysis",
          difficulty: "EASY",
          description: "Read a CSV file and calculate basic statistics.",
          dataFileName: "dataset.csv",
          datasetId: 1,
          problems: problemDetail.problems,
        },
      });
    }

    if (path === "/api/v1/problems/with-dataset" && method === "POST") {
      return fulfillJson(route, { data: { problemSetId: 201 } });
    }

    if (/^\/api\/v1\/problems\/\d+\/with-dataset$/.test(path)) {
      return fulfillJson(route, { data: { problemSetId: 101 } });
    }

    // 챗봇 테스트는 목록, 기존 메시지, 스트림 응답이 모두 성공하는지 확인합니다.
    if (path === "/api/v1/chat/list") {
      return fulfillJson(route, {
        data: [{ roomId: 301, title: "Mock Chat Room", updatedAt: "2026-07-01T00:00:00Z" }],
      });
    }

    if (/^\/api\/v1\/chat\/\d+\/messages$/.test(path) && method === "GET") {
      return fulfillJson(route, {
        data: [
          { role: "USER", content: "Explain this problem." },
          { role: "ASSISTANT", content: "This is a mock answer." },
        ],
      });
    }

    if (path === "/api/v1/chat/messages" || /^\/api\/v1\/chat\/\d+\/messages$/.test(path)) {
      return route.fulfill({
        status: 200,
        headers: { "content-type": "text/plain; charset=utf-8" },
        body: "This is a mocked streamed answer.",
      });
    }

    // 랭킹 페이지는 전체 랭킹과 내 랭킹 조회가 모두 같은 mock 데이터를 사용합니다.
    if (path.startsWith("/api/v1/rankings/points")) {
      if (path.endsWith("/me")) {
        return fulfillJson(route, { data: rankingUsers[0] });
      }
      return fulfillJson(route, { data: rankingUsers });
    }

    // 관리자 운영 페이지 API입니다.
    if (path === "/api/v1/admin/badges") {
      return fulfillJson(route, {
        data: [
          {
            badgeId: 1,
            badgeName: "Learning Badge",
            description: "Awarded to steady learners.",
            imageUrl: "",
            requiredPoint: 100,
            status: "ACTIVE",
            createdAt: "2026-07-01T00:00:00Z",
          },
        ],
      });
    }

    if (/^\/api\/v1\/admin\/badges\/\d+$/.test(path)) {
      return fulfillJson(route, {
        data: {
          badgeId: 1,
          badgeName: "Learning Badge",
          description: "Awarded to steady learners.",
          imageUrl: "",
          requiredPoint: 100,
          status: "ACTIVE",
        },
      });
    }

    if (path === "/api/v1/admin/operation-alerts") {
      return fulfillJson(route, pageResponse([
        {
          operationAlertId: 1,
          targetType: "PROBLEM",
          status: "OPEN",
          recommendedAction: "Check the answer rate.",
          createdAt: "2026-07-01T00:00:00Z",
        },
      ]));
    }

    if (/^\/api\/v1\/admin\/operation-alerts\/\d+$/.test(path)) {
      return fulfillJson(route, {
        data: {
          alert: {
            operationAlertId: 1,
            status: "OPEN",
            severity: "LOW",
            reason: "Low answer rate",
            recommendedAction: "Check the answer rate.",
            adminMemo: "Needs review",
            thresholdValueSnapshot: 30,
            firstDetectedAt: "2026-07-01T00:00:00Z",
            lastDetectedAt: "2026-07-01T00:00:00Z",
            createdAt: "2026-07-01T00:00:00Z",
            updatedAt: "2026-07-01T00:00:00Z",
          },
          rule: {
            ruleName: "Low accuracy",
            ruleCode: "LOW_ACCURACY",
            description: "Detects problem sets with low answer accuracy.",
            thresholdUnit: "%",
            minSampleCountLabel: "Minimum samples",
          },
          target: {
            targetType: "PROBLEM",
            targetId: 101,
            title: "Pandas Data Analysis",
            problemSetTitle: "Pandas Data Analysis",
            status: "ACTIVE",
          },
          metric: {
            observedLabel: "Observed accuracy",
            observedValue: 12,
            thresholdLabel: "Threshold",
            thresholdValue: 30,
            unit: "%",
            minSampleCount: 5,
            minSampleCountUnit: "items",
          },
          assignee: {
            name: "Operator",
            email: "operator@example.com",
          },
        },
      });
    }

    if (path === "/api/v1/users") {
      return fulfillJson(route, pageResponse(adminUsers));
    }

    if (/^\/api\/v1\/admin\/users\/\d+$/.test(path)) {
      return fulfillJson(route, { data: adminUsers[0] });
    }

    if (/^\/api\/v1\/users\/\d+\/enrollments$/.test(path)) {
      return fulfillJson(route, { data: [] });
    }

    if (/^\/api\/v1\/admin\/students\/\d+\/problems$/.test(path)) {
      return fulfillJson(route, { data: { submissions: [] } });
    }

    if (path === "/api/v1/admin/automation-rules") {
      return fulfillJson(route, {
        data: [
          {
            operationRuleId: 1,
            ruleType: "LOW_ACCURACY",
            thresholdValue: 30,
            minSampleCount: 5,
            enabled: true,
          },
        ],
      });
    }

    if (path === "/api/v1/admin/accounts") {
      return fulfillJson(route, {
        data: {
          items: adminAccounts,
          totalElements: adminAccounts.length,
          totalPages: 1,
        },
      });
    }

    await fulfillJson(route, { data: null });
  });
}

export async function setupMockedPage(page: Page, role = "MASTER") {
  // 각 테스트가 페이지 이동 전에 인증 상태와 API mock을 같은 순서로 준비하도록 묶어둡니다.
  await prepareAuthenticatedPage(page, role);
  await mockApi(page);
}
