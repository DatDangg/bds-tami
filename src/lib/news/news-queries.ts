import type { Payload, Where } from "payload";

import type { Locale } from "../../i18n/routing";
import type { Category, News } from "../../payload-types";
import { findPublicBySlug, findPublicList, type PublicListResult } from "../content/public-queries";

/** 12 bài/trang (design-spec S10); khối nổi bật ở trang 1 của `/tin-tuc` không tính vào 12 bài này. */
export const NEWS_PAGE_SIZE = 12;
/** 1 bài lớn + 3 bài dạng hàng (design-spec S10). */
export const NEWS_FEATURED_COUNT = 4;
export const RELATED_NEWS_COUNT = 3;

const NEWS_SORT = ["-publishedAt", "-createdAt"];
const CATEGORY_SORT = ["sortOrder", "createdAt"];
/** Số danh mục `news` tối đa lấy một lần: danh mục nền ít, mỗi loại tối đa 2 cấp (ERD §4.3). */
const CATEGORY_LIMIT = 50;

/** Danh mục `news` cấp 1 của một ngôn ngữ (tab danh mục của S10). `/en` chỉ gồm danh mục đã có bản EN. */
export function listRootNewsCategories(payload: Payload, locale: Locale): Promise<PublicListResult<Category>> {
  return findPublicList<Category>(payload, "categories", locale, {
    where: { and: [{ scope: { equals: "news" } }, { parent: { exists: false } }] },
    sort: CATEGORY_SORT,
    limit: CATEGORY_LIMIT,
    depth: 0,
  });
}

/** Danh mục con (cấp 2) của một danh mục `news`. */
export function listChildNewsCategories(payload: Payload, locale: Locale, parentId: string): Promise<PublicListResult<Category>> {
  return findPublicList<Category>(payload, "categories", locale, {
    where: { and: [{ scope: { equals: "news" } }, { parent: { equals: parentId } }] },
    sort: CATEGORY_SORT,
    limit: CATEGORY_LIMIT,
    depth: 0,
  });
}

/** Danh mục `news` theo slug của ngôn ngữ đang xem (slug chỉ duy nhất trong cùng scope). `parent` đã populate. */
export function findNewsCategoryBySlug(payload: Payload, locale: Locale, slug: string): Promise<Category | null> {
  return findPublicBySlug<Category>(payload, "categories", locale, slug, { where: { scope: { equals: "news" } }, depth: 1 });
}

export interface NewsPageQuery {
  page: number;
  /** Lọc theo các danh mục này (danh mục + con của nó). Bỏ trống = mọi danh mục. */
  categoryIds?: readonly string[];
  /** Bài đã hiện ở khối nổi bật, loại khỏi lưới để không trùng. */
  excludeIds?: readonly string[];
  limit?: number;
}

/** Một trang tin công khai (mới nhất trước). Mọi điều kiện đi qua `findPublicList` nên luôn kèm `publicWhere`. */
export function listPublicNews(payload: Payload, locale: Locale, query: NewsPageQuery): Promise<PublicListResult<News>> {
  const conditions: Where[] = [
    ...(query.categoryIds ? [{ category: { in: [...query.categoryIds] } }] : []),
    ...(query.excludeIds?.length ? [{ id: { not_in: [...query.excludeIds] } }] : []),
  ];
  return findPublicList<News>(payload, "news", locale, {
    ...(conditions.length > 0 ? { where: { and: conditions } } : {}),
    sort: NEWS_SORT,
    page: query.page,
    limit: query.limit ?? NEWS_PAGE_SIZE,
    depth: 1,
  });
}

/** Bài công khai theo slug của ngôn ngữ đang xem; `category`/`cover` đã populate. */
export function findPublicNewsBySlug(payload: Payload, locale: Locale, slug: string): Promise<News | null> {
  return findPublicBySlug<News>(payload, "news", locale, slug, { depth: 1 });
}

/** Tối đa 3 bài CÙNG danh mục, mới nhất trước, loại bài hiện tại. Bài không có danh mục thì không có bài liên quan. */
export async function findRelatedNews(payload: Payload, locale: Locale, current: Pick<News, "id" | "category">): Promise<News[]> {
  const categoryId = typeof current.category === "object" && current.category ? current.category.id : current.category;
  if (!categoryId) return [];
  const { docs } = await findPublicList<News>(payload, "news", locale, {
    where: { and: [{ category: { equals: categoryId } }, { id: { not_equals: current.id } }] },
    sort: NEWS_SORT,
    limit: RELATED_NEWS_COUNT,
    depth: 1,
  });
  return docs;
}

/**
 * Slug của CẢ HAI ngôn ngữ (để dựng hreflang): `doc` chỉ mang slug của locale đang đọc. Đọc bằng `overrideAccess` nhưng CHỈ
 * trường `slug`, và chỉ gọi cho bản ghi đã qua truy vấn công khai, nên không lộ gì thêm.
 */
export async function findLocalizedSlugs(payload: Payload, collection: "news" | "categories" | "services" | "projects", id: string): Promise<{ vi?: string; en?: string }> {
  const doc = (await payload.findByID({ collection, id, locale: "all", depth: 0, overrideAccess: true, select: { slug: true } })) as {
    slug?: { vi?: string | null; en?: string | null } | string | null;
  };
  const slug = typeof doc.slug === "object" && doc.slug ? doc.slug : {};
  return { ...(slug.vi ? { vi: slug.vi } : {}), ...(slug.en ? { en: slug.en } : {}) };
}
