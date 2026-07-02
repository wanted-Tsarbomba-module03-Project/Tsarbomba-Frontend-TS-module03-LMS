import http from "node:http";

const PORT = 4010;

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

function sendJson(response, body, status = 200) {
  response.writeHead(status, {
    "access-control-allow-credentials": "true",
    "access-control-allow-origin": "http://localhost:3001",
    "content-type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(body));
}

function pageResponse(content) {
  return {
    data: {
      content,
      items: content,
      totalElements: content.length,
      totalPages: 1,
    },
  };
}

function handleRequest(request, response) {
  const url = new URL(request.url ?? "/", `http://localhost:${PORT}`);
  const path = url.pathname;

  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "access-control-allow-origin": "http://localhost:3001",
    });
    response.end();
    return;
  }

  if (path === "/health") {
    sendJson(response, { ok: true });
    return;
  }

  // 루트 페이지 SSR이 앱 준비 상태 확인 중 호출하므로 강의 목록은 배열로 응답합니다.
  if (path === "/api/v1/courses") {
    sendJson(response, { data: courses });
    return;
  }

  if (path === "/api/v1/users/me/enrollments") {
    sendJson(response, { data: [] });
    return;
  }

  if (/^\/api\/v1\/courses\/\d+$/.test(path)) {
    sendJson(response, {
      data: {
        ...courses[0],
        instructorName: "Operator",
      },
    });
    return;
  }

  if (/^\/api\/v1\/courses\/\d+\/lectures$/.test(path)) {
    sendJson(response, { data: [] });
    return;
  }

  // 공통 사용자 정보는 Header, Sidebar, 관리자 접근 권한 확인에서 반복 호출됩니다.
  if (path === "/api/v1/users/me") {
    sendJson(response, {
      data: {
        userId: 1,
        name: "Test Operator",
        nickname: "operator",
        email: "operator@example.com",
        role: "MASTER",
        provider: "LOCAL",
      },
    });
    return;
  }

  if (path.startsWith("/api/v1/badges/me")) {
    sendJson(response, { data: [] });
    return;
  }

  // 문제 목록, 상세, 관리자 문제 CRUD 화면에서 사용하는 최소 API입니다.
  if (path === "/api/v1/problem-categories") {
    sendJson(response, {
      data: [{ categoryId: "1", categoryName: "Data Analysis" }],
    });
    return;
  }

  if (path === "/api/v1/problem-sets") {
    sendJson(response, {
      data: {
        content: problemSummaries,
        problemSets: problemSummaries,
        totalElements: problemSummaries.length,
        totalPages: 1,
      },
    });
    return;
  }

  if (/^\/api\/v1\/problem-sets\/\d+$/.test(path)) {
    sendJson(response, { data: problemDetail });
    return;
  }

  if (/^\/api\/v1\/problem-sets\/\d+\/result$/.test(path)) {
    sendJson(response, {
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
    return;
  }

  if (/^\/api\/v1\/problems\/\d+$/.test(path)) {
    sendJson(response, {
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
    return;
  }

  if (path === "/api/v1/problems/with-dataset") {
    sendJson(response, { data: { problemSetId: 201 } });
    return;
  }

  if (/^\/api\/v1\/problems\/\d+\/with-dataset$/.test(path)) {
    sendJson(response, { data: { problemSetId: 101 } });
    return;
  }

  // 범용/문제풀이방 챗봇은 방 목록, 기존 메시지, 스트림 응답을 모두 mock합니다.
  if (path === "/api/v1/chat/list") {
    sendJson(response, {
      data: [{ roomId: 301, title: "Mock Chat Room", updatedAt: "2026-07-01T00:00:00Z" }],
    });
    return;
  }

  if (/^\/api\/v1\/chat\/\d+\/messages$/.test(path) && request.method === "GET") {
    sendJson(response, {
      data: [
        { role: "USER", content: "Explain this problem." },
        { role: "ASSISTANT", content: "This is a mock answer." },
      ],
    });
    return;
  }

  if (path === "/api/v1/chat/messages" || /^\/api\/v1\/chat\/\d+\/messages$/.test(path)) {
    response.writeHead(200, {
      "access-control-allow-credentials": "true",
      "access-control-allow-origin": "http://localhost:3001",
      "content-type": "text/plain; charset=utf-8",
    });
    response.end("This is a mocked streamed answer.");
    return;
  }

  // 랭킹 페이지는 전체 랭킹과 내 랭킹 SSR/CSR 조회를 모두 확인합니다.
  if (path.startsWith("/api/v1/rankings/points")) {
    sendJson(response, { data: path.endsWith("/me") ? rankingUsers[0] : rankingUsers });
    return;
  }

  // 관리자 운영 페이지 API입니다.
  if (path === "/api/v1/admin/badges") {
    sendJson(response, {
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
    return;
  }

  if (/^\/api\/v1\/admin\/badges\/\d+$/.test(path)) {
    sendJson(response, {
      data: {
        badgeId: 1,
        badgeName: "Learning Badge",
        description: "Awarded to steady learners.",
        imageUrl: "",
        requiredPoint: 100,
        status: "ACTIVE",
      },
    });
    return;
  }

  if (path === "/api/v1/admin/operation-alerts") {
    sendJson(response, pageResponse([
      {
        operationAlertId: 1,
        targetType: "PROBLEM",
        status: "OPEN",
        recommendedAction: "Check the answer rate.",
        createdAt: "2026-07-01T00:00:00Z",
      },
    ]));
    return;
  }

  if (/^\/api\/v1\/admin\/operation-alerts\/\d+$/.test(path)) {
    sendJson(response, {
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
    return;
  }

  if (path === "/api/v1/users") {
    sendJson(response, pageResponse(adminUsers));
    return;
  }

  if (/^\/api\/v1\/admin\/users\/\d+$/.test(path)) {
    sendJson(response, { data: adminUsers[0] });
    return;
  }

  if (/^\/api\/v1\/users\/\d+\/enrollments$/.test(path)) {
    sendJson(response, { data: [] });
    return;
  }

  if (/^\/api\/v1\/admin\/students\/\d+\/problems$/.test(path)) {
    sendJson(response, { data: { submissions: [] } });
    return;
  }

  if (path === "/api/v1/admin/automation-rules") {
    sendJson(response, {
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
    return;
  }

  if (path === "/api/v1/admin/accounts") {
    sendJson(response, {
      data: {
        items: adminAccounts,
        totalElements: adminAccounts.length,
        totalPages: 1,
      },
    });
    return;
  }

  sendJson(response, { data: null });
}

http.createServer(handleRequest).listen(PORT, () => {
  console.log(`Mock API server listening on http://localhost:${PORT}`);
});
