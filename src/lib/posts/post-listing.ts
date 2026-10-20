import type { Payload } from "payload";

import type { Locale } from "../../i18n/routing";
import type { Category } from "../../payload-types";
import { publicPath } from "../content/content-paths";
import { visibleCategory } from "../news/news-view";
import {
  findFeaturedPost,
  findPostCategoryBySlug,
  listChildPostCategories,
  listPublicPosts,
  listRootPostCategories,
} from "./post-queries";
import { type PostCardData, postCategoryHref, toPostCards } from "./post-view";

export interface PostListing {
  /** Chỉ ở trang 1 của `/tin-bds` và trang danh mục (phạm vi danh mục + con): `isFeatured` mới nhất còn hạn (S08). */
  featured: PostCardData | null;
  items: PostCardData[];
  totalPages: number;
  /** Tổng số bài của danh sách (lưới + bài nổi bật) cho "Có N kết quả"; không đổi theo trang. */
  totalDocs: number;
  /** Trang yêu cầu vượt số trang có dữ liệu (trang 1 luôn hợp lệ, kể cả khi trống). */
  outOfRange: boolean;
  isEmpty: boolean;
}

/**
 * Dữ liệu một trang danh sách Đăng tin BĐS. `/tin-bds` và trang danh mục (cùng quy tắc, phạm vi danh mục + con): bài nổi bật (nếu có) tách riêng và bị loại khỏi lưới ở MỌI trang để
 * không trùng khi sang trang 2; lưới xếp bài còn hạn trước, bài đã kết thúc sau (`listPublicPosts`). `categoryIds` gồm danh mục + con của nó.
 */
export async function loadPostListing(
  payload: Payload,
  locale: Locale,
  options: { page: number; now: Date; categoryIds?: readonly string[] },
): Promise<PostListing> {
  const { page, now, categoryIds } = options;
  const featuredDoc = await findFeaturedPost(payload, locale, now, categoryIds);
  const grid = await listPublicPosts(payload, locale, {
    page,
    now,
    ...(categoryIds ? { categoryIds } : {}),
    ...(featuredDoc ? { excludeIds: [featuredDoc.id] } : {}),
  });
  const featured = featuredDoc && page === 1 ? (toPostCards([featuredDoc], locale, now)[0] ?? null) : null;
  return {
    featured,
    items: toPostCards(grid.docs, locale, now),
    totalPages: grid.totalPages,
    totalDocs: grid.totalDocs + (featuredDoc ? 1 : 0),
    outOfRange: page > 1 && page > grid.totalPages,
    isEmpty: grid.isEmpty && featuredDoc === null,
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
