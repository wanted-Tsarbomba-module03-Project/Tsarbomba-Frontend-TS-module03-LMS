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

export async function deleteAdminProblemCategory(categoryId: number) {
  return requestAdminOperation<AdminProblemCategory>(
    `${ADMIN_PROBLEM_CATEGORY_PATH}/${categoryId}`,
    {
      method: "DELETE",
    },
  );
}
