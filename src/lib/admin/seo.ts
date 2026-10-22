// Logic thuần cho khung xem trước kết quả Google ở tab SEO (BL-058 T05).
// Mô phỏng ĐÚNG quy tắc của `src/lib/seo/metadata.ts` (KHÔNG import file đó: nó đọc env/server và nằm ngoài
// phạm vi được sửa): tiêu đề nối tên website, canonical lấy URL trang khi ô trống, mô tả fallback theo từng route.
// Chỉ dùng phía client (component) + test.

import enMessages from "../../i18n/messages/en.json";
import viMessages from "../../i18n/messages/vi.json";
import type { Locale } from "../../i18n/routing";
import { pathnames } from "../../i18n/routing";
import { CONTENT_ROUTES, LEGAL_PAGE_ROUTES, type LegalPageKind } from "../content/content-paths";

/** Giới hạn hiển thị đề xuất cho từng ô (nhắc nhẹ, không chặn lưu). */
export const SEO_TITLE_MAX = 60;
export const SEO_DESCRIPTION_MIN = 120;
export const SEO_DESCRIPTION_MAX = 160;

/** Google cắt mô tả ~155 ký tự ở kết quả tìm kiếm (giá trị hiển thị trong khung xem trước). */
export const SEO_PREVIEW_DESCRIPTION_MAX = 155;

/** Mô tả rút từ richText (Cho thuê / Tuyển dụng) cắt ở 160 ký tự như `metaDescription()` ở trang công khai. */
export const META_DESCRIPTION_LENGTH = 160;

/**
 * Trường lấy mô tả dự phòng của từng collection — khớp đúng tham số `description` mà trang công khai truyền vào
 * `buildPageMetadata`: Dự án/Dịch vụ = `summary`, Tin tức/Tin BĐS = `excerpt`, Cho thuê/Tuyển dụng = `description` (richText),
 * Trang pháp lý (`pages`) và Trang chủ không có trường mô tả (chữ lấy từ bản dịch).
 */
export const SEO_DESCRIPTION_SOURCE = {
  news: "excerpt",
  "property-posts": "excerpt",
  projects: "summary",
  services: "summary",
  rentals: "description",
  "job-postings": "description",
} as const satisfies Record<string, "excerpt" | "summary" | "description">;

export type SeoDescriptionSource = (typeof SEO_DESCRIPTION_SOURCE)[keyof typeof SEO_DESCRIPTION_SOURCE];

/** Trường mô tả dự phòng của collection; không khai báo (pages…) thì không có fallback. */
export function seoDescriptionSource(collectionSlug: string | null | undefined): SeoDescriptionSource | undefined {
  return collectionSlug ? (SEO_DESCRIPTION_SOURCE as Record<string, SeoDescriptionSource | undefined>)[collectionSlug] : undefined;
}

/** Giống `nonEmpty` của metadata.ts: chuỗi rỗng/trắng → undefined (không tính là giá trị). */
export function nonEmptySeo(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

/** Cắt kiểu Google: vượt `max` thì lấy `max - 1` ký tự rồi thêm dấu ba chấm (chấm tính 1 ký tự). */
export function truncateForGoogle(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Mô tả từ richText: gộp khoảng trắng liên tiếp rồi cắt ở `META_DESCRIPTION_LENGTH` theo ranh giới từ,
 * khớp helper `metaDescription()` của trang công khai (`cho-thue` / `tuyen-dung`). Rỗng → undefined.
 */
export function flattenMetaDescription(text: string): string | undefined {
  const flat = text.replace(/\s+/g, " ").trim();
  if (!flat) return undefined;
  if (flat.length <= META_DESCRIPTION_LENGTH) return flat;
  return `${flat.slice(0, META_DESCRIPTION_LENGTH).replace(/\s+\S*$/, "")}…`;
}

/** Mô tả dự phòng từ giá trị form: richText thì đổi sang chữ thuần (cắt 160), textarea/text thì dùng nguyên. */
export function resolveDescriptionValue(source: SeoDescriptionSource | undefined, value: unknown, plainText: (rich: unknown) => string): string | undefined {
  if (!source) return undefined;
  if (source === "description") return flattenMetaDescription(plainText(value));
  return nonEmptySeo(value);
}

export interface SeoLengthHint {
  text: string;
  outOfRange: boolean;
}

export function describeSeoTitleLength(value: unknown): SeoLengthHint {
  const length = typeof value === "string" ? value.length : 0;
  const base = `${length} ký tự · nên ≤ ${SEO_TITLE_MAX}`;
  return length > SEO_TITLE_MAX ? { text: `${base} (hơi dài)`, outOfRange: true } : { text: base, outOfRange: false };
}

export function describeSeoDescriptionLength(value: unknown): SeoLengthHint {
  const length = typeof value === "string" ? value.length : 0;
  const base = `${length} ký tự · nên ${SEO_DESCRIPTION_MIN}–${SEO_DESCRIPTION_MAX}`;
  if (length === 0) return { text: base, outOfRange: false };
  if (length < SEO_DESCRIPTION_MIN) return { text: `${base} (hơi ngắn)`, outOfRange: true };
  if (length > SEO_DESCRIPTION_MAX) return { text: `${base} (hơi dài)`, outOfRange: true };
  return { text: base, outOfRange: false };
}

/** Khoá `pathnames` của trang công khai tương ứng bản ghi đang sửa; `undefined` = không xác định được. */
export function seoPagePathKey(input: { collectionSlug?: string | null; globalSlug?: string | null; kind?: unknown }): string | undefined {
  if (input.globalSlug) return "/";
  if (input.collectionSlug === "pages") {
    if (typeof input.kind !== "string") return undefined;
    return (LEGAL_PAGE_ROUTES as Record<string, string | undefined>)[input.kind as LegalPageKind];
  }
  return input.collectionSlug ? (CONTENT_ROUTES as Record<string, { detail: string } | undefined>)[input.collectionSlug]?.detail : undefined;
}

/**
 * URL công khai của trang đang sửa, dựng theo `pathnames` (EN có đường dẫn dịch riêng) — chính là canonical mà
 * `buildPageMetadata` tự sinh khi ô "Đường dẫn gốc" để trống. Bản ghi CHƯA có bản dịch EN (`hasEnglish=false`) thì
 * luôn dùng đường dẫn tiếng Việt (y `paths.en ?? paths.vi` của metadata, không khai URL EN không tồn tại).
 * Thiếu slug hoặc không xác định được đường dẫn → chuỗi rỗng.
 */
export function publicPageUrl(input: { origin: string; locale: Locale; pathKey?: string; slug?: unknown; hasEnglish?: boolean }): string {
  const { origin, pathKey } = input;
  if (!pathKey) return "";
  const locale: Locale = input.locale === "en" && input.hasEnglish === true ? "en" : "vi";
  const localized = (pathnames as Record<string, Record<Locale, string>>)[pathKey]?.[locale];
  if (!localized) return "";
  const slug = typeof input.slug === "string" ? input.slug.trim() : "";
  if (localized.includes("[slug]") && !slug) return ""; // chưa nhập slug → chưa có URL thật
  const withSlug = localized.replace("[slug]", slug ? encodeURIComponent(slug) : "");
  const prefix = locale === "vi" ? "" : `/${locale}`;
  return `${origin}${prefix}${withSlug === "/" ? "" : withSlug}`;
}

/**
 * Tiêu đề / mô tả dự phòng của Trang chủ: global không có ô Tiêu đề hay Tóm tắt, trang công khai
 * (`app/(frontend)/[locale]/page.tsx`) truyền thẳng bản dịch `page.home.title` / `page.home.description` vào
 * `buildPageMetadata`. Đọc JSON bản dịch tĩnh (không kéo `next-intl/server` vào bundle admin); locale lạ → vi.
 */
export function homepageSeoFallback(locale: Locale): { title: string; description: string } {
  const { title, description } = (locale === "en" ? enMessages : viMessages).page.home;
  return { title, description };
}

/** Tiêu đề hiển thị = `seo.metaTitle` (hoặc Tiêu đề trang) + " | Tên website" nếu chưa chứa tên — y `buildTitle` của metadata.ts. */
export function buildSeoTitle(input: { metaTitle?: unknown; title?: unknown; siteName?: unknown }): string {
  const base = nonEmptySeo(input.metaTitle) ?? nonEmptySeo(input.title) ?? "";
  const siteName = nonEmptySeo(input.siteName);
  return siteName && base && !base.includes(siteName) ? `${base} | ${siteName}` : base;
}

export interface SeoPreviewInput {
  metaTitle?: unknown;
  metaDescription?: unknown;
  canonical?: unknown;
  title?: unknown;
  /** Tên website trong Cài đặt chung (nối sau tiêu đề như trang công khai). */
  siteName?: unknown;
  /** Mô tả dự phòng của route (xem `SEO_DESCRIPTION_SOURCE`). */
  description?: unknown;
  /** URL công khai của chính trang (fallback của canonical khi ô trống). */
  pageUrl?: string;
}

export interface SeoPreviewResult {
  /** Tiêu đề sẽ hiện trên Google (đã nối tên website + cắt). */
  title: string;
  /** Mô tả sẽ hiện trên Google (đã cắt). */
  description: string;
  /** Canonical: ô nhập hợp lệ (http/https) hoặc URL của chính trang; rỗng khi chưa xác định được. */
  url: string;
  /** Số ký tự đang gõ ở ô "Tiêu đề hiện trên Google". */
  titleCount: number;
  /** Số ký tự đang gõ ở ô "Mô tả hiện trên Google". */
  descriptionCount: number;
}

const isHttpUrl = (value: string): boolean => /^https?:\/\//i.test(value);

/** Dựng nội dung xem trước theo đúng thứ tự fallback của `buildPageMetadata`. */
export function buildSeoPreview(input: SeoPreviewInput): SeoPreviewResult {
  const metaTitle = nonEmptySeo(input.metaTitle);
  const metaDescription = nonEmptySeo(input.metaDescription);
  const customCanonical = nonEmptySeo(input.canonical);
  const pageUrl = nonEmptySeo(input.pageUrl) ?? "";

  const fullTitle = buildSeoTitle({ metaTitle, title: input.title, siteName: input.siteName });

  return {
    title: truncateForGoogle(fullTitle, SEO_TITLE_MAX),
    // `metaDescription` thắng mô tả của route (y `description` trong metadata.ts).
    description: truncateForGoogle(metaDescription ?? nonEmptySeo(input.description) ?? "", SEO_PREVIEW_DESCRIPTION_MAX),
    url: customCanonical && isHttpUrl(customCanonical) ? customCanonical : pageUrl,
    titleCount: metaTitle?.length ?? 0,
    descriptionCount: metaDescription?.length ?? 0,
  };
}
