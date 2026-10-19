import type { Payload } from "payload";

import type { Locale } from "../../i18n/routing";
import type { Category } from "../../payload-types";
import { publicPath } from "../content/content-paths";
import {
  findNewsCategoryBySlug,
  listChildNewsCategories,
  listPublicNews,
  listRootNewsCategories,
  NEWS_FEATURED_COUNT,
} from "./news-queries";
import { categoryHref, type NewsCardData, toNewsCards, visibleCategory } from "./news-view";

export interface NewsListing {
  /** Chỉ có ở trang 1 của `/tin-tuc` (không lọc danh mục): {@link NEWS_FEATURED_COUNT} bài mới nhất bị loại khỏi lưới ở mọi trang. Trang 1 đưa các bài này (trừ bài đã hiện ở "Tin nổi bật" hoặc hàng danh mục) lên đầu mục "Tin khác" qua `buildMoreNews` để không bài nào mất chỗ; `tests/integration/news.test.ts` kiểm hợp đồng không trùng/không mất bài. */
  featured: NewsCardData[];
  items: NewsCardData[];
  totalPages: number;
  /** Trang yêu cầu vượt số trang có dữ liệu (trang 1 luôn hợp lệ, kể cả khi trống). */
  outOfRange: boolean;
  isEmpty: boolean;
}

/**
 * Dữ liệu một trang danh sách tin. `/tin-tuc` (không danh mục): khối nổi bật = {@link NEWS_FEATURED_COUNT} bài mới nhất, lưới là
 * phần còn lại (loại các bài nổi bật ở MỌI trang để không trùng khi sang trang 2) nên khối nổi bật không tính vào 12 bài/trang.
 * (BL-020 P3-T03: trang 1 hiển thị `loadNewsHome` rồi mục "Tin khác" = `buildMoreNews(home, featured, items)`; phân trang/offset không đổi.)
 * Trang danh mục: chỉ lưới. `categoryIds` gồm danh mục + con của nó (chip "Tất cả" của danh mục cha gồm cả bài của con).
 */
export async function loadNewsListing(
  payload: Payload,
  locale: Locale,
  options: { page: number; categoryIds?: readonly string[] },
): Promise<NewsListing> {
  const { page, categoryIds } = options;
  if (categoryIds) {
    const grid = await listPublicNews(payload, locale, { page, categoryIds });
    return {
      featured: [],
      items: toNewsCards(grid.docs, locale),
      totalPages: grid.totalPages,
      outOfRange: page > 1 && page > grid.totalPages,
      isEmpty: grid.totalDocs === 0,
    };
  }
  const head = await listPublicNews(payload, locale, { page: 1, limit: NEWS_FEATURED_COUNT });
  const featuredDocs = head.docs;
  const grid = await listPublicNews(payload, locale, { page, excludeIds: featuredDocs.map((doc) => doc.id) });
  return {
    featured: page === 1 ? toNewsCards(featuredDocs, locale) : [],
    items: toNewsCards(grid.docs, locale),
    totalPages: grid.totalPages,
    outOfRange: page > 1 && page > grid.totalPages,
    isEmpty: head.totalDocs === 0,
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
