import { type Locale, locales, pathnames } from "../../i18n/routing";

type PathnameKey = keyof typeof pathnames;

/** Trang công khai của một loại nội dung: danh sách (nếu có) và chi tiết dạng `/x/[slug]`. */
export interface ContentRoute {
  list?: PathnameKey;
  detail: PathnameKey;
}

/**
 * Collection nội dung → khoá đường dẫn next-intl. Collection mới (pages, categories...) thêm ở đây
 * khi task của nó định nghĩa trang công khai.
 */
export const CONTENT_ROUTES = {
  projects: { list: "/du-an", detail: "/du-an/[slug]" },
  rentals: { list: "/cho-thue", detail: "/cho-thue/[slug]" },
  "property-posts": { list: "/tin-bds", detail: "/tin-bds/[slug]" },
  news: { list: "/tin-tuc", detail: "/tin-tuc/[slug]" },
  "job-postings": { list: "/tuyen-dung", detail: "/tuyen-dung/[slug]" },
  services: { detail: "/dich-vu/[slug]" },
} as const satisfies Record<string, ContentRoute>;

/**
 * Đường dẫn NỘI BỘ của trang theo ngôn ngữ, đúng dạng khoá cache của Next: `/${locale}${khoá pathnames}`
 * (vd `/vi/du-an/x`, `/en/du-an/x`, trang chủ `/vi`, `/en`). Lý do: trang render dưới segment
 * `app/(frontend)/[locale]/`; `src/proxy.ts` (next-intl, `localePrefix: "as-needed"` + `pathnames`) chỉ rewrite URL công khai
 * (`/du-an/x`, `/en/projects/x`) về đường dẫn nội bộ này, nên `revalidatePath` phải nhận đường dẫn nội bộ;
 * truyền URL công khai thì không trúng mục cache nào. Khoá `pathnames` luôn là đường dẫn tiếng Việt, kể cả với `en`.
 */
export function internalPath(key: PathnameKey, locale: Locale, slug?: string): string {
  const path = slug === undefined ? key : key.replace("[slug]", encodeURIComponent(slug));
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

type SlugInput = string | readonly string[] | null | undefined;

export interface ContentPathsInput {
  /** Slug theo từng ngôn ngữ; nhiều giá trị khi vừa đổi slug (cả slug cũ lẫn mới cần làm mới). */
  slugs: Partial<Record<Locale, SlugInput>>;
  featured: boolean;
}

/** Danh sách đường dẫn nội bộ (xem `internalPath`) cần làm mới cache khi một bản ghi nội dung đổi: chi tiết, danh sách, trang chủ nếu nổi bật. */
export function contentPaths(route: ContentRoute, { slugs, featured }: ContentPathsInput): string[] {
  const paths: string[] = [];
  for (const locale of locales) {
    const input = slugs[locale];
    for (const slug of typeof input === "string" ? [input] : (input ?? [])) {
      paths.push(internalPath(route.detail, locale, slug));
    }
  }
  for (const locale of locales) {
    if (route.list) paths.push(internalPath(route.list, locale));
  }
  if (featured) {
    for (const locale of locales) paths.push(internalPath("/", locale));
  }
  return [...new Set(paths)];
}
