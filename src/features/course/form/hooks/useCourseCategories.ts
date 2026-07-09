"use client";

import { useEffect, useState } from "react";
import { getCourseCategories } from "@/features/course/actions";
import { isVisibleCategory } from "@/features/course/search";
import type { CourseCategory } from "../types";

interface Options {
  selectFirstAsDefault?: boolean;
}

export function useCourseCategories({ selectFirstAsDefault }: Options = {}) {
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [defaultId, setDefaultId] = useState<string>("");

  useEffect(() => {
    getCourseCategories()
      .then((all) => {
        const arr = all.filter((c) => isVisibleCategory(c.name));
        setCategories(arr);
        if (selectFirstAsDefault && arr.length) {
          setDefaultId(String(arr[0].courseCategoryId));
        }
      })
      .catch(() => {
        /* ignore */
      });
  }, [selectFirstAsDefault]);

  return { categories, defaultId };
}
