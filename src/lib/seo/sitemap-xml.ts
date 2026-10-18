import { defaultLocale, type Locale, locales } from "../../i18n/routing";

/** Giới hạn của giao thức sitemap: tối đa 50.000 URL mỗi file. */
export const SITEMAP_URL_LIMIT = 50_000;

/** Mỗi bản ghi sinh tối đa 2 URL (vi + en), nên 20.000 bản ghi/file luôn nằm dưới giới hạn 50.000 URL. */
export const DOCS_PER_SITEMAP = 20_000;

export interface SitemapAlternate {
  hreflang: string;
  href: string;
}

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  alternates: SitemapAlternate[];
}

/** Đường dẫn CÔNG KHAI theo ngôn ngữ của một trang; ngôn ngữ vắng mặt = không có URL ở ngôn ngữ đó. */
export type LocalizedPaths = Partial<Record<Locale, string>>;

/**
 * Mỗi ngôn ngữ có đường dẫn → một `<url>`. Có cả vi và en thì mọi URL mang đủ alternates `vi`, `en` và `x-default` (= vi);
 * chỉ một ngôn ngữ thì không có alternates (hreflang một mình vô nghĩa, và `x-default` trỏ vào chính nó là thừa).
 */
export function buildLocalizedUrls(paths: LocalizedPaths, siteUrl: string, lastmod?: string): SitemapUrl[] {
  const present = locales.filter((locale) => paths[locale] !== undefined);
  const hrefOf = (locale: Locale) => new URL(paths[locale] as string, siteUrl).toString();
  const alternates: SitemapAlternate[] =
    present.length > 1
      ? [...present.map((locale) => ({ hreflang: locale, href: hrefOf(locale) })), { hreflang: "x-default", href: hrefOf(defaultLocale) }]
      : [];
  return present.map((locale) => ({ loc: hrefOf(locale), alternates, ...(lastmod ? { lastmod } : {}) }));
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';

/** `<urlset>` có namespace `xhtml` cho `<xhtml:link rel="alternate">`. Vượt giới hạn 50.000 URL là lỗi lập trình (đã chia file ở nơi gọi). */
export function renderUrlset(urls: readonly SitemapUrl[]): string {
  if (urls.length > SITEMAP_URL_LIMIT) throw new Error(`Sitemap vượt ${SITEMAP_URL_LIMIT} URL: phải chia file trước khi render`);
  const body = urls.map((url) => {
    const links = url.alternates.map((alt) => `<xhtml:link rel="alternate" hreflang="${escapeXml(alt.hreflang)}" href="${escapeXml(alt.href)}"/>`);
    const lastmod = url.lastmod ? [`<lastmod>${escapeXml(url.lastmod)}</lastmod>`] : [];
    return `<url><loc>${escapeXml(url.loc)}</loc>${lastmod.join("")}${links.join("")}</url>`;
  });
  return `${XML_HEADER}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${body.join("")}</urlset>`;
}

/** `<sitemapindex>` trỏ tới các sitemap con. */
export function renderSitemapIndex(locations: readonly string[]): string {
  const body = locations.map((loc) => `<sitemap><loc>${escapeXml(loc)}</loc></sitemap>`);
  return `${XML_HEADER}<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body.join("")}</sitemapindex>`;
}
