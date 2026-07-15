import { requestAdminOperation } from "../operations/api";
import type { AdminProblemCategory } from "../operations/types";

const ADMIN_PROBLEM_CATEGORY_PATH = "/api/v1/admin/problem-categories";

export async function getAdminProblemCategories(signal?: AbortSignal) {
  return requestAdminOperation<AdminProblemCategory[]>(
    ADMIN_PROBLEM_CATEGORY_PATH,
    { signal },
  );
}

export async function createAdminProblemCategory(categoryName: string) {
  return requestAdminOperation<AdminProblemCategory>(
    ADMIN_PROBLEM_CATEGORY_PATH,
    {
      method: "POST",
      body: JSON.stringify({ categoryName }),
    },
  );
}

export async function updateAdminProblemCategory(
  categoryId: number,
  categoryName: string,
) {
  return requestAdminOperation<AdminProblemCategory>(
    `${ADMIN_PROBLEM_CATEGORY_PATH}/${categoryId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ categoryName }),
    },
  );
}

// 비활성화 — DELETE 는 즉시 삭제가 아니라 비활성 처리(3개월 뒤 실제 삭제)를 의미한다.
export async function deleteAdminProblemCategory(categoryId: number) {
  return requestAdminOperation<AdminProblemCategory>(
    `${ADMIN_PROBLEM_CATEGORY_PATH}/${categoryId}`,
    {
      method: "DELETE",
    },
  );
}

// 활성화 — 비활성 상태의 카테고리를 다시 활성 상태로 되돌린다.
export async function activateAdminProblemCategory(categoryId: number) {
  return requestAdminOperation<AdminProblemCategory>(
    `${ADMIN_PROBLEM_CATEGORY_PATH}/${categoryId}/activate`,
    {
      method: "PATCH",
    },
  );
}
