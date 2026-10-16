import { defineRouting } from "next-intl/routing";

export const locales = ["vi", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "vi";

/**
 * Khoá = đường dẫn nội bộ (tên thư mục dưới `app/(frontend)/[locale]/`), dùng đường dẫn tiếng Việt.
 * Giá trị = đường dẫn hiển thị theo từng ngôn ngữ (BRD §2.1). Slug động `[x]` phải trùng tên ở cả hai bản.
 */
export const pathnames = {
  "/": { vi: "/", en: "/" },
  "/du-an": { vi: "/du-an", en: "/projects" },
  "/du-an/[slug]": { vi: "/du-an/[slug]", en: "/projects/[slug]" },
  "/cho-thue": { vi: "/cho-thue", en: "/for-rent" },
  "/cho-thue/danh-muc/[category]": {
    vi: "/cho-thue/danh-muc/[category]",
    en: "/for-rent/category/[category]",
  },
  "/cho-thue/khu-vuc/[province]": {
    vi: "/cho-thue/khu-vuc/[province]",
    en: "/for-rent/area/[province]",
  },
  "/cho-thue/[slug]": { vi: "/cho-thue/[slug]", en: "/for-rent/[slug]" },
  "/tin-bds": { vi: "/tin-bds", en: "/property-news" },
  "/tin-bds/danh-muc/[category]": {
    vi: "/tin-bds/danh-muc/[category]",
    en: "/property-news/category/[category]",
  },
  "/tin-bds/[slug]": { vi: "/tin-bds/[slug]", en: "/property-news/[slug]" },
  "/tin-tuc": { vi: "/tin-tuc", en: "/news" },
  "/tin-tuc/danh-muc/[category]": {
    vi: "/tin-tuc/danh-muc/[category]",
    en: "/news/category/[category]",
  },
  "/tin-tuc/[slug]": { vi: "/tin-tuc/[slug]", en: "/news/[slug]" },
  "/tuyen-dung": { vi: "/tuyen-dung", en: "/careers" },
  "/tuyen-dung/[slug]": { vi: "/tuyen-dung/[slug]", en: "/careers/[slug]" },
  "/lien-he": { vi: "/lien-he", en: "/contact" },
  "/dich-vu/[slug]": { vi: "/dich-vu/[slug]", en: "/services/[slug]" },
  "/chinh-sach-bao-mat": { vi: "/chinh-sach-bao-mat", en: "/privacy-policy" },
  "/dieu-khoan-su-dung": { vi: "/dieu-khoan-su-dung", en: "/terms-of-use" },
} as const;

export const routing = defineRouting({
  locales,
  defaultLocale,
  // Tiếng Việt không tiền tố; `/vi/*` bị đưa về bản không tiền tố.
  localePrefix: "as-needed",
  pathnames,
  // Mỗi URL luôn trả đúng một ngôn ngữ: không đọc Accept-Language/cookie để chuyển hướng (CDN cache + SEO).
  localeDetection: false,
  // Cookie NEXT_LOCALE chỉ đặt khi khách bấm chuyển ngôn ngữ (localeCookie.ts), không đặt ở mọi response.
  localeCookie: false,
  // Tắt header `Link` hreflang tự sinh: nó đoán bản EN cùng slug (sai khi slug EN riêng hoặc chưa có bản dịch) và bị CDN cache.
  // hreflang sinh ở metadata/sitemap theo dữ liệu thật (F11).
  alternateLinks: false,
});
