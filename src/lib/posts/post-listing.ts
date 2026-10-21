import type { Payload } from "payload";

import type { Locale } from "../../i18n/routing";
import type { Category } from "../../payload-types";
import { publicPath } from "../content/content-paths";
import { visibleCategory } from "../news/news-view";
import { listProvinces } from "../projects/project-queries";
import type { PostFilters } from "./post-filters";
import { findPostCategoryBySlug, listChildPostCategories, listPublicPostListing, listRootPostCategories, type PostFacets } from "./post-queries";
import { type PostCardData, postCategoryHref, toPostCards } from "./post-view";

export interface PostListing {
  /** ≤ 5 tin `isFeatured` còn hiệu lực khớp bộ lọc (slider nổi bật); chỉ ở trang 1, không lặp trong `items` ở mọi trang. */
  featured: PostCardData[];
  items: PostCardData[];
  /** ≥ 1 (trang 1 luôn hợp lệ, kể cả khi trống). */
  totalPages: number;
  /** Tổng số tin khớp (lưới + nổi bật) cho "N … phù hợp"; không đổi theo trang. */
  totalDocs: number;
  /** Trang yêu cầu vượt số trang có dữ liệu. */
  outOfRange: boolean;
  isEmpty: boolean;
  /** Số đếm tab danh mục + ô tích (loại hình, tỉnh, hướng, bàn giao). */
  facets: PostFacets;
  /** Bộ lọc thực sự áp dụng: như `filters` truyền vào nhưng slug tỉnh lạ đã bị bỏ (chip "đang lọc", URL phân trang). */
  filters: PostFilters;
}

/**
 * Dữ liệu một trang danh sách Đăng tin BĐS (BL-052). `/tin-bds` và trang danh mục cùng quy tắc (`categoryIds` = danh mục + con của nó) — `listPublicPostListing`:
 * lọc / đếm / sắp trong bộ nhớ, tin nổi bật tách riêng và bị loại khỏi lưới ở MỌI trang, tin ưu đãi đã kết thúc xếp sau.
 * Slug tỉnh đối chiếu với danh sách tỉnh: slug lạ bị bỏ (không lọc thành rỗng); tỉnh hợp lệ chưa có tin thì vẫn lọc (ra rỗng).
 */
export async function loadPostListing(
  payload: Payload,
  locale: Locale,
  options: { page: number; now: Date; categoryIds?: readonly string[]; filters?: PostFilters },
): Promise<PostListing> {
  const { page, now, categoryIds } = options;
  const { provinceSlugs, ...rest } = options.filters ?? {};
  const known = provinceSlugs?.length ? (await listProvinces(payload)).filter((province) => provinceSlugs.includes(province.slug)) : [];
  const filters: PostFilters = { ...rest, ...(known.length > 0 ? { provinceSlugs: known.map((province) => province.slug).sort() } : {}) };
  const result = await listPublicPostListing(payload, locale, {
    ...filters,
    page,
    now,
    ...(categoryIds ? { categoryIds } : {}),
    ...(known.length > 0 ? { provinceIds: known.map((province) => province.id) } : {}),
  });
  const totalPages = Math.max(1, result.totalPages);
  return {
    featured: toPostCards(result.featured, locale, now),
    items: toPostCards(result.docs, locale, now),
    totalPages,
    totalDocs: result.totalDocs,
    outOfRange: page > totalPages,
    isEmpty: result.totalDocs === 0,
    facets: result.facets,
    filters,
  };
}

export interface PostChip {
  label: string;
  href: string;
  current?: boolean;
}

export interface PostCategoryContext {
  category: Category;
  /** Cha của danh mục (đã lọc theo ngôn ngữ) nếu là cấp 2. */
  parent: Category | null;
  /** Danh mục gốc của nhóm: chính nó nếu là cấp 1, ngược lại là cha. */
  root: Category;
  children: Category[];
}

/** Danh mục `property_post` theo slug + cha + con, hoặc `null` (không có, chưa có bản EN ở `/en`, ở thùng rác). */
export async function loadPostCategoryContext(payload: Payload, locale: Locale, slug: string): Promise<PostCategoryContext | null> {
  const category = await findPostCategoryBySlug(payload, locale, slug);
  if (!category) return null;
  const parent = visibleCategory(category.parent, locale);
  // Cha đã bị ẩn mà con vẫn công khai: coi con là cấp 1 để breadcrumb không thiếu mắt xích.
  const root = parent ?? category;
  const children = (await listChildPostCategories(payload, locale, root.id)).docs;
  return { category, parent, root, children };
}

/** Id danh mục dùng để lọc bài: danh mục + con (chỉ khi là cấp 1; danh mục cấp 2 không có con). */
export function postCategoryFilterIds(context: PostCategoryContext): string[] {
  return [context.category.id, ...(context.category.id === context.root.id ? context.children.map((child) => child.id) : [])];
}

/**
 * Hàng tab của S08/S05 (link thật, không lọc client): `/tin-bds` = "Tất cả" + danh mục cấp 1; trang danh mục có con = "Tất cả" (= danh mục cấp 1)
 * + các con; danh mục không có con = lại là hàng danh mục cấp 1 để đi ngang sang mục khác.
 */
export async function buildPostChips(payload: Payload, locale: Locale, allLabel: string, context: PostCategoryContext | null): Promise<PostChip[]> {
  if (context && context.children.length > 0) {
    return [
      { label: allLabel, href: postCategoryHref(context.root, locale), current: context.category.id === context.root.id },
      ...context.children.map((child) => ({ label: child.name ?? "", href: postCategoryHref(child, locale), current: child.id === context.category.id })),
    ].filter((chip) => chip.label !== "");
  }
  const roots = (await listRootPostCategories(payload, locale)).docs.filter((doc) => doc.slug && doc.name);
  if (roots.length === 0) return [];
  return [
    { label: allLabel, href: publicPath("/tin-bds", locale), current: context === null },
    ...roots.map((root) => ({ label: root.name ?? "", href: postCategoryHref(root, locale), current: context?.root.id === root.id })),
  ];
}
