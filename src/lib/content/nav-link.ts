import { type Locale, pathnames } from "../../i18n/routing";

type PathnameKey = keyof typeof pathnames;

/**
 * Khoá trang dùng trong `header.navItems[].link` / các nút CTA (ERD §4.15) → khoá `pathnames` của next-intl.
 * Chỉ trang không có tham số động; đường dẫn từng ngôn ngữ lấy từ `pathnames`, nên đổi URL ở một nơi.
 */
export const PAGE_LINK_KEYS = {
  home: "/",
  projects: "/du-an",
  rentals: "/cho-thue",
  "property-posts": "/tin-bds",
  news: "/tin-tuc",
  careers: "/tuyen-dung",
  contact: "/lien-he",
  "privacy-policy": "/chinh-sach-bao-mat",
  "terms-of-use": "/dieu-khoan-su-dung",
} as const satisfies Record<string, PathnameKey>;

export type PageLinkKey = keyof typeof PAGE_LINK_KEYS;

export const PAGE_LINK_KEY_LIST = Object.keys(PAGE_LINK_KEYS) as PageLinkKey[];

export function isPageLinkKey(value: string): value is PageLinkKey {
  return Object.hasOwn(PAGE_LINK_KEYS, value);
}

/** Chỉ http(s): giá trị này được render thành liên kết nên chặn `javascript:`, `data:`... */
export function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/** `true` nếu hợp lệ, ngược lại là thông báo lỗi (hợp kiểu `validate` của Payload). Trống là hợp lệ: bắt buộc hay không do trường quyết định. */
export function validateNavLink(value: unknown): true | string {
  if (typeof value !== "string" || value.trim() === "") return true;
  const link = value.trim();
  if (isPageLinkKey(link) || isHttpUrl(link)) return true;
  return `Link phải là khoá trang (${PAGE_LINK_KEY_LIST.join(", ")}) hoặc địa chỉ bắt đầu bằng http:// hoặc https://`;
}

export interface ResolvedNavLink {
  href: string;
  /** `true` khi là URL tuyệt đối (mở tab mới, rel noopener). */
  external: boolean;
}

/**
 * Giải khoá trang / URL thành đường dẫn CÔNG KHAI theo ngôn ngữ (vd `rentals` → `/cho-thue` ở vi,
 * `/en/for-rent` ở en; trang chủ → `/` và `/en`), khớp `localePrefix: "as-needed"` của `routing`.
 * Giá trị không hợp lệ (khoá lạ, `javascript:`) trả `null` để nơi hiển thị bỏ qua mục đó thay vì render link nguy hiểm.
 */
export function resolveNavLink(link: string | null | undefined, locale: Locale): ResolvedNavLink | null {
  const value = link?.trim();
  if (!value) return null;
  if (isPageLinkKey(value)) {
    const localized: string = pathnames[PAGE_LINK_KEYS[value]][locale];
    const prefix = locale === "vi" ? "" : `/${locale}`;
    const path = localized === "/" ? prefix || "/" : `${prefix}${localized}`;
    return { href: path, external: false };
  }
  if (isHttpUrl(value)) return { href: value, external: true };
  return null;
}
