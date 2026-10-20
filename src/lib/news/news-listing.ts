import type { Payload } from "payload";

import type { Locale } from "../../i18n/routing";
import type { Category } from "../../payload-types";
import { publicPath } from "../content/content-paths";
import { findNewsCategoryBySlug, listChildNewsCategories, listPublicNews, listRootNewsCategories } from "./news-queries";
import { categoryHref, type NewsCardData, toNewsCardData, toNewsCards, visibleCategory } from "./news-view";

export interface NewsListing {
  /** Bài nổi bật ngang đầu danh sách (BL-045): chỉ ở trang 1 của `/tin-tuc` và của trang danh mục (phạm vi danh mục + con). `isFeatured` mới nhất, không có thì bài mới nhất; bị loại khỏi lưới ở MỌI trang để không trùng. */
  featured: NewsCardData | null;
  items: NewsCardData[];
  totalPages: number;
  /** Trang yêu cầu vượt số trang có dữ liệu (trang 1 luôn hợp lệ, kể cả khi trống). */
  outOfRange: boolean;
  isEmpty: boolean;
}

/**
 * Dữ liệu một trang danh sách tin. `/tin-tuc` và trang danh mục (cùng quy tắc): bài nổi bật = `isFeatured` mới nhất (bù bằng bài mới nhất), hai truy vấn limit 1 chạy song song;
 * lưới là phần còn lại, loại bài nổi bật ở MỌI trang nên không bài nào trùng hay mất khi sang trang 2.
 * `categoryIds` gồm danh mục + con của nó (chip "Tất cả" của danh mục cha gồm cả bài của con).
 */
export async function loadNewsListing(
  payload: Payload,
  locale: Locale,
  options: { page: number; categoryIds?: readonly string[] },
): Promise<NewsListing> {
  const { page, categoryIds } = options;
  const scope = categoryIds ? { categoryIds } : {};
  const [flagged, newest] = await Promise.all([
    listPublicNews(payload, locale, { page: 1, limit: 1, featuredOnly: true, ...scope }),
    listPublicNews(payload, locale, { page: 1, limit: 1, ...scope }),
  ]);
  const leadDoc = flagged.docs[0] ?? newest.docs[0];
  const grid = await listPublicNews(payload, locale, { page, ...scope, ...(leadDoc ? { excludeIds: [leadDoc.id] } : {}) });
  return {
    featured: page === 1 && leadDoc ? toNewsCardData(leadDoc, locale) : null,
    items: toNewsCards(grid.docs, locale),
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
