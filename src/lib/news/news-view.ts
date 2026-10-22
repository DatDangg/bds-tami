import type { MediaImage } from "../../components/media/ResponsiveImage";
import type { Locale } from "../../i18n/routing";
import type { Category, Media, News } from "../../payload-types";
import { formatDate } from "../format";
import { CONTENT_ROUTES, publicPath } from "../content/content-paths";
import { publicDetailPath } from "../content/redirect-paths";
import { estimateReadMinutes } from "./read-time";

export interface NewsCardData {
  id: string;
  title: string;
  href: string;
  excerpt: string;
  /** ISO, cho `<time datetime>`. */
  publishedAt: string | null;
  dateLabel: string | null;
  categoryName: string | null;
  cover: MediaImage | null;
  /** "N phút đọc" (BL-054) ước từ `content`; không có khi bài được đọc không kèm `content` (vd `select` của "Đọc nhiều"). */
  readMinutes?: number;
}

/**
 * Danh mục đã populate và ĐƯỢC PHÉP hiển thị ở ngôn ngữ này: id chưa populate (danh mục ở thùng rác, không đọc được) hoặc
 * danh mục chưa có bản EN ở `/en` thì `null`, để không hiện nhãn rỗng hay link tới trang danh mục EN 404 (public-queries.ts ghi chú).
 */
export function visibleCategory(category: News["category"] | Category["parent"], locale: Locale): Category | null {
  if (!category || typeof category !== "object") return null;
  if (!category.slug || !category.name) return null;
  if (locale === "en" && category.hasEnglish !== true) return null;
  return category;
}

export function categoryHref(category: Category, locale: Locale): string {
  return publicPath("/tin-tuc/danh-muc/[category]", locale, { category: category.slug ?? "" });
}

/** Media đã populate (object) hoặc `null` khi chỉ có id / không có ảnh. */
export function populatedMedia(value: (string | null | undefined) | Media): Media | null {
  return value && typeof value === "object" ? value : null;
}

export function toNewsCardData(doc: News, locale: Locale): NewsCardData | null {
  // Bài không có tiêu đề/slug không dựng được thẻ có link: bỏ qua thay vì render thẻ rỗng.
  if (!doc.title || !doc.slug) return null;
  const published = doc.publishedAt ?? null;
  return {
    id: doc.id,
    title: doc.title,
    href: publicDetailPath(CONTENT_ROUTES.news, locale, doc.slug),
    excerpt: doc.excerpt ?? "",
    publishedAt: published,
    dateLabel: published ? formatDate(published, locale) : null,
    categoryName: visibleCategory(doc.category, locale)?.name ?? null,
    cover: populatedMedia(doc.cover),
    ...(doc.content ? { readMinutes: estimateReadMinutes(doc.content) } : {}),
  };
}

export function toNewsCards(docs: readonly News[], locale: Locale): NewsCardData[] {
  return docs.flatMap((doc) => {
    const card = toNewsCardData(doc, locale);
    return card ? [card] : [];
  });
}
