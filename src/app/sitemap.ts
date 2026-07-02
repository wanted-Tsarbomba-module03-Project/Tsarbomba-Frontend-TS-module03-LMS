import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo";

const publicRoutes = [
  "/",
  "/problems",
  "/ranking",
  "/auth/login",
  "/auth/register",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return publicRoutes.map((route) => ({
    changeFrequency: route === "/" ? "weekly" : "daily",
    lastModified: now,
    priority: route === "/" ? 1 : 0.7,
    url: new URL(route, SITE_URL).toString(),
  }));
}
