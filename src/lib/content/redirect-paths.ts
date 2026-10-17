import { defaultLocale, type Locale, locales, pathnames } from "../../i18n/routing";
import { CONTENT_ROUTES, type ContentRoute } from "./content-paths";

/**
 * URL công khai (thứ khách thấy và gõ, KHÔNG phải đường dẫn nội bộ của `internalPath`) của trang chi tiết:
 * vi không tiền tố (`/tin-tuc/moi`), en có `/en` và đường dẫn tiếng Anh (`/en/news/new`). Là dạng `from`/`to` lưu ở `redirects` (ERD §4.13).
 */
export function publicDetailPath(route: ContentRoute, locale: Locale, slug: string): string {
  const path = pathnames[route.detail][locale].replace("[slug]", encodeURIComponent(slug));
  return locale === defaultLocale ? path : `/${locale}${path}`;
}

/** Tiền tố URL công khai của mọi trang chi tiết có slug (vd `/tin-tuc/`, `/en/news/`), để proxy chỉ tra redirect với URL có thể là slug cũ. */
const DETAIL_PREFIXES: readonly string[] = Object.values(CONTENT_ROUTES).flatMap((route) =>
  locales.map((locale) => publicDetailPath(route, locale, "").replace(/\/$/, "") + "/"),
);

/** Bỏ `/` cuối (trừ gốc) để `/tin-tuc/cu/` khớp `from` `/tin-tuc/cu`. */
export function normalizeRedirectSource(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

/** `true` nếu URL có dạng trang chi tiết (`<tiền tố>/<slug>`), tức có thể là slug đã đổi. Trang chủ, danh sách, file tĩnh: không. */
export function isRedirectSourcePath(pathname: string): boolean {
  const path = normalizeRedirectSource(pathname);
  return DETAIL_PREFIXES.some((prefix) => path.startsWith(prefix) && path.length > prefix.length && !path.slice(prefix.length).includes("/"));
}
