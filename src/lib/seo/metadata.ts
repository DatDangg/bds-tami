import type { Metadata } from "next";

import type { Locale } from "../../i18n/routing";
import type { Media } from "../../payload-types";
import { isHttpUrl } from "../content/nav-link";
import { absoluteUrl, getSiteUrl, isIndexingAllowed, OG_LOCALES } from "./site-url";

/** Nhóm `seo` của collection (ERD §4.14). */
export interface SeoFields {
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: (string | null) | Media;
  noindex?: boolean | null;
  canonical?: string | null;
}

export type SeoImage = (string | null | undefined) | Media;

export interface PageMetadataInput {
  locale: Locale;
  /** `seo` của bản ghi (trang danh sách/tĩnh không có thì bỏ trống). */
  seo?: SeoFields | null;
  /** Tiêu đề bản ghi, dùng khi `seo.metaTitle` trống. */
  title: string;
  /** `summary`/`excerpt`, dùng khi `seo.metaDescription` trống. */
  description?: string | null;
  /** Ảnh đại diện của bản ghi: dùng khi `seo.ogImage` trống. */
  image?: SeoImage;
  siteName?: string | null;
  /** Ảnh OG mặc định của site (logo ở `site-settings`, hoặc ảnh tĩnh): cuối chuỗi fallback. */
  defaultImage?: SeoImage;
  /** Đường dẫn CÔNG KHAI (đã có tiền tố ngôn ngữ) của từng ngôn ngữ; `en` chỉ truyền khi bản EN thật sự tồn tại. */
  paths: { vi: string; en?: string };
  /** `hasEnglish` của bản ghi. Trang tĩnh luôn có hai ngôn ngữ truyền `true`. */
  hasEnglish: boolean;
  /** Trang yêu cầu noindex bất kể `seo.noindex` (tin đã thuê, tuyển dụng hết hạn...). */
  forceNoindex?: boolean;
  ogType?: "website" | "article";
}

function nonEmpty(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** Media đã populate (object có `url`) → URL tuyệt đối + kích thước; id chưa populate hoặc thiếu URL gốc → bỏ qua ứng viên đó. */
function resolveImage(candidate: SeoImage, siteUrl: string | undefined) {
  if (!candidate || typeof candidate === "string" || !candidate.url) return undefined;
  const url = absoluteUrl(candidate.url, siteUrl);
  if (!url) return undefined;
  const dimensions = candidate.width && candidate.height ? { width: candidate.width, height: candidate.height } : {};
  return { url, ...dimensions, ...(candidate.alt ? { alt: candidate.alt } : {}) };
}

/** Ảnh tĩnh trong `public/`: chốt cuối chuỗi fallback khi không có ảnh nào từ dữ liệu (site-settings chưa có logo). */
export const FALLBACK_OG_IMAGE_PATH = "/brand/tami-logo-gold.png";

/** `seo.ogImage` → ảnh đại diện → ảnh OG mặc định của site → ảnh tĩnh (lấy ứng viên đầu tiên dùng được). */
function pickOgImage(input: PageMetadataInput, siteUrl: string | undefined) {
  for (const candidate of [input.seo?.ogImage, input.image, input.defaultImage]) {
    const resolved = resolveImage(candidate, siteUrl);
    if (resolved) return resolved;
  }
  const fallback = absoluteUrl(FALLBACK_OG_IMAGE_PATH, siteUrl);
  return fallback ? { url: fallback } : undefined;
}

function buildTitle(input: PageMetadataInput, siteName: string | undefined): string {
  const base = nonEmpty(input.seo?.metaTitle) ?? input.title;
  return siteName && !base.includes(siteName) ? `${base} | ${siteName}` : base;
}

/** Canonical của bản ghi (nhập tay phải là http(s), nếu không thì bỏ qua) hoặc URL của chính trang ở ngôn ngữ đang xem. */
function buildCanonical(input: PageMetadataInput, siteUrl: string | undefined): string | undefined {
  const custom = nonEmpty(input.seo?.canonical);
  if (custom && isHttpUrl(custom)) return custom;
  const ownPath = input.locale === "en" ? (input.paths.en ?? input.paths.vi) : input.paths.vi;
  return absoluteUrl(ownPath, siteUrl);
}

/**
 * hreflang `vi`, `en`, `x-default` (→ vi) CHỈ khi bản ghi có EN (BR-07): không có EN thì không khai bản EN, tránh trỏ tới 404.
 * Không có URL gốc thì bỏ cả khối (hreflang bắt buộc URL tuyệt đối).
 */
export function buildAlternateLanguages(
  paths: PageMetadataInput["paths"],
  hasEnglish: boolean,
  siteUrl: string | undefined,
): Record<string, string> | undefined {
  if (!hasEnglish || !paths.en || !siteUrl) return undefined;
  const vi = absoluteUrl(paths.vi, siteUrl);
  const en = absoluteUrl(paths.en, siteUrl);
  if (!vi || !en) return undefined;
  return { vi, en, "x-default": vi };
}

/** Một nơi duy nhất quyết định noindex: `seo.noindex`, trang yêu cầu, hoặc môi trường không phải production. */
export function shouldNoindex(input: Pick<PageMetadataInput, "seo" | "forceNoindex">): boolean {
  return Boolean(input.seo?.noindex) || Boolean(input.forceNoindex) || !isIndexingAllowed();
}

/** `generateMetadata` cho mọi trang công khai. */
export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const siteUrl = getSiteUrl();
  const siteName = nonEmpty(input.siteName);
  const title = buildTitle(input, siteName);
  const description = nonEmpty(input.seo?.metaDescription) ?? nonEmpty(input.description);
  const canonical = buildCanonical(input, siteUrl);
  const languages = buildAlternateLanguages(input.paths, input.hasEnglish, siteUrl);
  const image = pickOgImage(input, siteUrl);
  const noindex = shouldNoindex(input);
  // Trang noindex theo nội dung (đã thuê, hết hạn, seo.noindex) vẫn cho đi theo link (DESIGN.md §305); chỉ môi trường không phải production mới nofollow.
  const follow = isIndexingAllowed();

  return {
    title,
    ...(description ? { description } : {}),
    ...(canonical || languages ? { alternates: { ...(canonical ? { canonical } : {}), ...(languages ? { languages } : {}) } } : {}),
    robots: noindex ? { index: false, follow } : { index: true, follow: true },
    openGraph: {
      type: input.ogType ?? "website",
      title,
      ...(description ? { description } : {}),
      ...(canonical ? { url: canonical } : {}),
      ...(siteName ? { siteName } : {}),
      locale: OG_LOCALES[input.locale],
      ...(image ? { images: [image] } : {}),
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, ...(description ? { description } : {}) },
  };
}
