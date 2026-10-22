import type { Payload } from "payload";

import type { Locale } from "../../i18n/routing";
import type { Category } from "../../payload-types";
import { publicPath } from "../content/content-paths";
import { DEFAULT_NEWS_SORT, isFilteredNews, type NewsFilters } from "./news-filters";
import { findNewsCategoryBySlug, listChildNewsCategories, listPublicNews, listRootNewsCategories } from "./news-queries";
import { findFilteredNewsIds } from "./news-search";
import { categoryHref, type NewsCardData, toNewsCards, visibleCategory } from "./news-view";

/** Khối nổi bật đầu trang 1 (BL-054): 1 bài lớn + 3 bài nhỏ. */
export const NEWS_FEATURED_COUNT = 4;

export interface NewsListing {
  /**
   * Khối nổi bật (BL-054): ≤ 4 bài, chỉ ở trang 1 khi KHÔNG lọc / tìm / sắp khác mặc định (`/tin-tuc` và trang danh mục, trong phạm vi danh mục + con).
   * `isFeatured` mới nhất trước rồi bài mới nhất; 4 bài này bị loại khỏi lưới ở MỌI trang (không lọc) để không trùng, không mất khi sang trang 2.
   */
  featured: NewsCardData[];
  items: NewsCardData[];
  /** Số bài của lưới (đang lọc: số bài khớp — dòng "N bài viết"). */
  totalDocs: number;
  totalPages: number;
  /** Trang yêu cầu vượt số trang có dữ liệu (trang 1 luôn hợp lệ, kể cả khi trống). */
  outOfRange: boolean;
  isEmpty: boolean;
}

const EMPTY_FILTERS: NewsFilters = { sort: DEFAULT_NEWS_SORT };

/**
 * Dữ liệu một trang danh sách tin. `categoryIds` gồm danh mục + con của nó (chip "Tất cả" của danh mục cha gồm cả bài của con).
 * - Không lọc: nổi bật = `isFeatured` mới nhất bù bằng bài mới nhất (hai truy vấn limit 4 song song — hợp của chúng luôn đủ 4 khi có ≥ 4 bài);
 *   lưới (mới nhất) là phần còn lại, loại 4 bài nổi bật ở mọi trang.
 * - Lọc (`q` / `tag` / `sort=oldest`): không khối nổi bật, không loại bài nào; `q` / `tag` thu hẹp bằng id từ `findFilteredNewsIds`.
 */
export async function loadNewsListing(
  payload: Payload,
  locale: Locale,
  options: { page: number; categoryIds?: readonly string[]; filters?: NewsFilters },
): Promise<NewsListing> {
  const { page, categoryIds } = options;
  const filters = options.filters ?? EMPTY_FILTERS;
  const scope = categoryIds ? { categoryIds } : {};
  if (isFilteredNews(filters)) {
    const ids = await findFilteredNewsIds(payload, locale, filters);
    if (ids && ids.length === 0) return { featured: [], items: [], totalDocs: 0, totalPages: 0, outOfRange: page > 1, isEmpty: true };
    const grid = await listPublicNews(payload, locale, { page, ...scope, sort: filters.sort, ...(ids ? { ids } : {}) });
    return { featured: [], items: toNewsCards(grid.docs, locale), totalDocs: grid.totalDocs, totalPages: grid.totalPages, outOfRange: page > 1 && page > grid.totalPages, isEmpty: grid.totalDocs === 0 };
  }
  const [flagged, newest] = await Promise.all([
    listPublicNews(payload, locale, { page: 1, limit: NEWS_FEATURED_COUNT, featuredOnly: true, ...scope }),
    listPublicNews(payload, locale, { page: 1, limit: NEWS_FEATURED_COUNT, ...scope }),
  ]);
  const flaggedIds = new Set(flagged.docs.map((doc) => doc.id));
  const leadDocs = [...flagged.docs, ...newest.docs.filter((doc) => !flaggedIds.has(doc.id))].slice(0, NEWS_FEATURED_COUNT);
  const grid = await listPublicNews(payload, locale, { page, ...scope, ...(leadDocs.length > 0 ? { excludeIds: leadDocs.map((doc) => doc.id) } : {}) });
  return {
    featured: page === 1 ? toNewsCards(leadDocs, locale) : [],
    items: toNewsCards(grid.docs, locale),
    totalDocs: grid.totalDocs,
    totalPages: grid.totalPages,
    outOfRange: page > 1 && page > grid.totalPages,
    isEmpty: newest.totalDocs === 0,
  };
}

export interface NewsChip {
  label: string;
  href: string;
  current?: boolean;
}

interface CategoryContext {
  category: Category;
  /** Cha của danh mục (đã lọc theo ngôn ngữ) nếu là cấp 2. */
  parent: Category | null;
  /** Danh mục gốc của nhóm: chính nó nếu là cấp 1, ngược lại là cha. */
  root: Category;
  children: Category[];
}

/** Danh mục `news` theo slug + cha + con, hoặc `null` (không có, chưa có bản EN ở `/en`, ở thùng rác). */
export async function loadNewsCategoryContext(payload: Payload, locale: Locale, slug: string): Promise<CategoryContext | null> {
  const category = await findNewsCategoryBySlug(payload, locale, slug);
  if (!category) return null;
  const parent = visibleCategory(category.parent, locale);
  // Cha đã bị ẩn (thùng rác / chưa có bản EN) mà con vẫn công khai: coi con là cấp 1 để breadcrumb không thiếu mắt xích.
  const root = parent ?? category;
  const children = (await listChildNewsCategories(payload, locale, root.id)).docs;
  return { category, parent, root, children };
}

/** Id danh mục dùng để lọc bài: danh mục + con (chỉ khi là cấp 1; danh mục cấp 2 không có con). */
export function categoryFilterIds(context: CategoryContext): string[] {
  return [context.category.id, ...(context.category.id === context.root.id ? context.children.map((child) => child.id) : [])];
}

/**
 * Hàng chip của S10/S05 (link thật, không lọc client). `/tin-tuc`: "Tất cả" + danh mục cấp 1. Trang danh mục có con: "Tất cả"
 * (= danh mục cấp 1, gồm bài của con) + các con; danh mục không có con: lại là hàng danh mục cấp 1 để đi ngang sang mục khác.
 */
export async function buildNewsChips(
  payload: Payload,
  locale: Locale,
  allLabel: string,
  context: CategoryContext | null,
  /** Danh mục cấp 1 đã tải sẵn (trang 1 `/tin-tuc` cũng cần để dựng hàng theo danh mục): bỏ qua một truy vấn. */
  preloadedRoots?: readonly Category[],
): Promise<NewsChip[]> {
  if (context && context.children.length > 0) {
    return [
      { label: allLabel, href: categoryHref(context.root, locale), current: context.category.id === context.root.id },
      ...context.children.map((child) => ({ label: child.name ?? "", href: categoryHref(child, locale), current: child.id === context.category.id })),
    ].filter((chip) => chip.label !== "");
  }
  const roots = (preloadedRoots ?? (await listRootNewsCategories(payload, locale)).docs).filter((doc) => doc.slug && doc.name);
  if (roots.length === 0) return [];
  return [
    { label: allLabel, href: publicPath("/tin-tuc", locale), current: context === null },
    ...roots.map((root) => ({ label: root.name ?? "", href: categoryHref(root, locale), current: context?.root.id === root.id })),
  ];
}
