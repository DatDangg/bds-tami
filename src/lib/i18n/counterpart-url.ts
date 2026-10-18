import { defaultLocale, type Locale, locales, pathnames } from "../../i18n/routing";
import { LEGAL_PAGE_ROUTES, publicPath } from "../content/content-paths";

type PathnameKey = keyof typeof pathnames;

export interface ParsedPublicPath {
  key: PathnameKey;
  locale: Locale;
  /** Giá trị các tham số động (`slug`, `category`...) đã decode; rỗng với route cố định. */
  params: Record<string, string>;
}

/** Đường dẫn nhận lệnh chuyển ngôn ngữ cho trang có slug (cần tra DB), xem `resolve-counterpart.ts`. */
export const LOCALE_COUNTERPART_ENDPOINT = "/api/locale-counterpart";

/**
 * Trang danh sách để rơi về khi bản ghi chưa có bản dịch ở ngôn ngữ kia (FR-PUB-18). Khoá không có ở đây (vd dịch vụ không có
 * trang danh sách) thì rơi về trang chủ.
 */
const LIST_FALLBACK: Partial<Record<PathnameKey, PathnameKey>> = {
  "/du-an/[slug]": "/du-an",
  "/cho-thue/[slug]": "/cho-thue",
  "/cho-thue/danh-muc/[category]": "/cho-thue",
  "/cho-thue/khu-vuc/[province]": "/cho-thue",
  "/tin-bds/[slug]": "/tin-bds",
  "/tin-bds/danh-muc/[category]": "/tin-bds",
  "/tin-tuc/[slug]": "/tin-tuc",
  "/tin-tuc/danh-muc/[category]": "/tin-tuc",
  "/tuyen-dung/[slug]": "/tuyen-dung",
};

const PLACEHOLDER = "PARAMPLACEHOLDER";
const DYNAMIC_SEGMENT = /\[([a-z]+)\]/g;

const escapeRegex = (value: string): string => value.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");

const keys = Object.keys(pathnames) as PathnameKey[];

/** Mỗi (khoá, ngôn ngữ) → regex khớp URL công khai; mỗi tham số động là đúng một đoạn đường dẫn. */
const MATCHERS = keys.flatMap((key) =>
  locales.map((locale) => {
    const names = [...key.matchAll(DYNAMIC_SEGMENT)].map((found) => found[1] ?? "");
    const filled = Object.fromEntries(names.map((name) => [name, PLACEHOLDER]));
    const pattern = escapeRegex(publicPath(key, locale, filled)).replaceAll(PLACEHOLDER, "([^/]+)");
    return { key, locale, names, regex: new RegExp(`^${pattern}$`) };
  }),
);

/** URL công khai (không query) → khoá trang, ngôn ngữ và tham số; `null` nếu không phải trang đã khai ở `pathnames`. */
export function parsePublicPath(pathname: string): ParsedPublicPath | null {
  const path = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  for (const { key, locale, names, regex } of MATCHERS) {
    const found = regex.exec(path);
    if (!found) continue;
    try {
      return { key, locale, params: Object.fromEntries(names.map((name, index) => [name, decodeURIComponent(found[index + 1] ?? "")])) };
    } catch {
      return null; // slug sai mã hoá (%E0%A4%A)
    }
  }
  return null;
}

const LEGAL_KEYS: ReadonlySet<PathnameKey> = new Set(Object.values(LEGAL_PAGE_ROUTES));

/**
 * Trang luôn có ở cả hai ngôn ngữ (trang chủ, danh sách, liên hệ): suy ra thẳng từ `pathnames`. Trang pháp lý KHÔNG thuộc nhóm này:
 * bản EN chỉ có khi admin bật `hasEnglish` (BR-07), nên phải tra như trang chi tiết.
 */
export function staticCounterpartPath(parsed: ParsedPublicPath, target: Locale): string | null {
  if (Object.keys(parsed.params).length > 0 || LEGAL_KEYS.has(parsed.key)) return null;
  return publicPath(parsed.key, target);
}

/** Nơi rơi về khi trang chi tiết/danh mục chưa có bản ở ngôn ngữ `target`: danh sách tương ứng, hoặc trang chủ. */
export function fallbackCounterpartPath(key: PathnameKey, target: Locale): string {
  return publicPath(LIST_FALLBACK[key] ?? "/", target);
}

/**
 * `href` của nút chuyển sang `target` cho trang đang xem. Trang luôn có hai bản: link thẳng (chạy cả khi tắt JS, cache được).
 * Trang có slug hoặc pháp lý: slug ngôn ngữ kia nằm trong DB nên đi qua endpoint tra rồi 302. Đường dẫn lạ: trang chủ ngôn ngữ kia.
 */
export function localeSwitchHref(pathname: string, target: Locale): string {
  const parsed = parsePublicPath(pathname);
  if (!parsed) return target === defaultLocale ? "/" : `/${target}`;
  const direct = staticCounterpartPath(parsed, target);
  if (direct) return direct;
  return `${LOCALE_COUNTERPART_ENDPOINT}?${new URLSearchParams({ to: target, path: pathname })}`;
}
