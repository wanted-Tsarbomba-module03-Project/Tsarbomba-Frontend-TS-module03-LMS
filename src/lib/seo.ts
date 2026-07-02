import type { Metadata } from "next";

export const SITE_NAME = "codebomba";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://codebomba.com";

interface BreadcrumbItem {
  name: string;
  path: string;
}

interface ItemListEntry {
  description?: string;
  name: string;
  path: string;
}

interface ItemListJsonLdOptions {
  description?: string;
  items: ItemListEntry[];
  name: string;
}

interface PageMetadataOptions {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
}

export function createPageMetadata({
  title,
  description,
  path = "/",
  noIndex = false,
}: PageMetadataOptions): Metadata {
  const pageTitle = title;
  const url = new URL(path, SITE_URL).toString();
  const robots = noIndex
    ? {
        follow: false,
        googleBot: {
          follow: false,
          index: false,
        },
        index: false,
      }
    : {
        follow: true,
        index: true,
      };

  return {
    alternates: {
      canonical: url,
    },
    description,
    openGraph: {
      description,
      locale: "ko_KR",
      siteName: SITE_NAME,
      title: pageTitle,
      type: "website",
      url,
    },
    robots,
    title: pageTitle,
    twitter: {
      card: "summary",
      description,
      title: pageTitle,
    },
  };
}

export function createAbsoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

export function createBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      item: createAbsoluteUrl(item.path),
      name: item.name,
      position: index + 1,
    })),
  };
}

export function createItemListJsonLd({
  description,
  items,
  name,
}: ItemListJsonLdOptions) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      name: item.name,
      position: index + 1,
      url: createAbsoluteUrl(item.path),
      ...(item.description ? { description: item.description } : {}),
    })),
    name,
    ...(description ? { description } : {}),
  };
}
