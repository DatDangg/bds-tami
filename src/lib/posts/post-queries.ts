import type { Payload, Where } from "payload";

import type { Locale } from "../../i18n/routing";
import type { Category, Project, PropertyPost, Rental } from "../../payload-types";
import { offerEndedWhere, offerNotEndedWhere } from "../content/offer-status";
import { findPublicBySlug, findPublicList, type PublicListResult } from "../content/public-queries";
import { relationId } from "../payload/relation-id";

/** 12 bài/trang (design-spec S08); bài nổi bật ở trang 1 của `/tin-bds` không tính vào 12 bài này. */
export const POST_PAGE_SIZE = 12;
export const RELATED_POSTS_COUNT = 3;

const POST_SORT = ["-publishedAt", "-createdAt"];
const CATEGORY_SORT = ["sortOrder", "createdAt"];
/** Danh mục nền ít, mỗi loại tối đa 2 cấp (ERD §4.3). */
const CATEGORY_LIMIT = 50;
const PROPERTY_POST_SCOPE: Where = { scope: { equals: "property_post" } };

/** Trường thẻ danh sách dùng: bỏ nội dung richText, thư viện ảnh, `offer.terms`... khỏi truy vấn danh sách. */
export const POST_CARD_FIELDS = {
  title: true,
  slug: true,
  excerpt: true,
  publishedAt: true,
  category: true,
  cover: true,
  priceVnd: true,
  priceNote: true,
  offer: true,
} as const;

/** Danh mục `property_post` cấp 1 của một ngôn ngữ (tab danh mục của S08). `/en` chỉ gồm danh mục đã có bản EN. */
export function listRootPostCategories(payload: Payload, locale: Locale): Promise<PublicListResult<Category>> {
  return findPublicList<Category>(payload, "categories", locale, {
    where: { and: [PROPERTY_POST_SCOPE, { parent: { exists: false } }] },
    sort: CATEGORY_SORT,
    limit: CATEGORY_LIMIT,
    depth: 0,
  });
}

export function listChildPostCategories(payload: Payload, locale: Locale, parentId: string): Promise<PublicListResult<Category>> {
  return findPublicList<Category>(payload, "categories", locale, {
    where: { and: [PROPERTY_POST_SCOPE, { parent: { equals: parentId } }] },
    sort: CATEGORY_SORT,
    limit: CATEGORY_LIMIT,
    depth: 0,
  });
}

/** Danh mục `property_post` theo slug của ngôn ngữ đang xem (slug chỉ duy nhất trong cùng scope). `parent` đã populate. */
export function findPostCategoryBySlug(payload: Payload, locale: Locale, slug: string): Promise<Category | null> {
  return findPublicBySlug<Category>(payload, "categories", locale, slug, { where: PROPERTY_POST_SCOPE, depth: 1 });
}

export interface PostPageQuery {
  page: number;
  /** Lọc theo các danh mục này (danh mục + con của nó). Bỏ trống = mọi danh mục. */
  categoryIds?: readonly string[];
  /** Bài nổi bật đã hiện riêng, loại khỏi lưới để không trùng. */
  excludeIds?: readonly string[];
  /** Mốc "bây giờ" để tách bài còn hạn / đã kết thúc (truyền vào để test được). */
  now: Date;
}

export interface PostPage {
  docs: PropertyPost[];
  totalPages: number;
  /** Số bài của lưới (còn hạn + đã kết thúc, đã trừ `excludeIds`) — dùng cho dòng "Có N kết quả". */
  totalDocs: number;
  isEmpty: boolean;
}

function listPostsWhere(where: Where[], locale: Locale, page: number, payload: Payload): Promise<PublicListResult<PropertyPost>> {
  return findPublicList<PropertyPost>(payload, "property-posts", locale, {
    where: { and: where },
    sort: POST_SORT,
    page,
    limit: POST_PAGE_SIZE,
    depth: 1,
    select: POST_CARD_FIELDS,
  });
}

/**
 * Một trang danh sách công khai theo thứ tự "bài còn hạn (hoặc không có hạn) trước, bài ưu đãi đã kết thúc sau" (BR-06, design-spec S08):
 * hai nhóm nối nhau theo trang (hết các trang của nhóm còn hạn mới sang trang của nhóm đã kết thúc; trang cuối của nhóm đầu có thể ngắn).
 * Cả hai đều đi qua `findPublicList` (luôn kèm `publicWhere`) và `isOfferEnded` là nguồn chân lý của việc tách (`offerEndedWhere`/`offerNotEndedWhere`).
 */
export async function listPublicPosts(payload: Payload, locale: Locale, query: PostPageQuery): Promise<PostPage> {
  const { page, categoryIds, excludeIds, now } = query;
  const base: Where[] = [
    ...(categoryIds ? [{ category: { in: [...categoryIds] } }] : []),
    ...(excludeIds?.length ? [{ id: { not_in: [...excludeIds] } }] : []),
  ];
  const [active, endedHead] = await Promise.all([
    listPostsWhere([...base, offerNotEndedWhere(now)], locale, page, payload),
    listPostsWhere([...base, offerEndedWhere(now)], locale, 1, payload),
  ]);
  // Danh sách rỗng báo `totalPages` không thống nhất giữa các adapter: tự tính từ `totalDocs`.
  const activePages = active.totalDocs === 0 ? 0 : active.totalPages;
  const endedPages = endedHead.totalDocs === 0 ? 0 : endedHead.totalPages;
  const endedPage = page - activePages;
  let docs: PropertyPost[] = [];
  if (page <= activePages) docs = active.docs;
  else if (endedPage === 1) docs = endedHead.docs;
  else if (endedPage <= endedPages) docs = (await listPostsWhere([...base, offerEndedWhere(now)], locale, endedPage, payload)).docs;
  const totalDocs = active.totalDocs + endedHead.totalDocs;
  return { docs, totalPages: Math.max(1, activePages + endedPages), totalDocs, isEmpty: totalDocs === 0 };
}

/** Bài nổi bật đầu danh sách: `isFeatured` mới nhất còn hạn (S08). */
export async function findFeaturedPost(
  payload: Payload,
  locale: Locale,
  now: Date,
  categoryIds?: readonly string[],
): Promise<PropertyPost | null> {
  const { docs } = await findPublicList<PropertyPost>(payload, "property-posts", locale, {
    where: {
      and: [{ isFeatured: { equals: true } }, offerNotEndedWhere(now), ...(categoryIds ? [{ category: { in: [...categoryIds] } }] : [])],
    },
    sort: POST_SORT,
    limit: 1,
    depth: 1,
    select: POST_CARD_FIELDS,
  });
  return docs[0] ?? null;
}

/** Bài công khai theo slug của ngôn ngữ đang xem; `category`/`cover`/`gallery`/tỉnh/phường đã populate. */
export function findPublicPostBySlug(payload: Payload, locale: Locale, slug: string): Promise<PropertyPost | null> {
  return findPublicBySlug<PropertyPost>(payload, "property-posts", locale, slug, { depth: 1 });
}

/**
 * Tối đa 3 bài CÙNG danh mục, mới nhất trước, loại bài hiện tại. Bài còn hạn trước; còn thiếu (danh mục chỉ có 1-2 bài còn hạn) thì lấy bù
 * bài ưu đãi đã kết thúc cho đủ 3 thẻ (S09). `listPublicPosts` không dùng được ở đây: nó chỉ sang nhóm đã kết thúc ở các trang sau.
 */
export async function findRelatedPosts(payload: Payload, locale: Locale, current: Pick<PropertyPost, "id" | "category">, now: Date): Promise<PropertyPost[]> {
  const categoryId = relationId(current.category);
  if (!categoryId) return [];
  const sameCategory: Where[] = [{ category: { in: [categoryId] } }, { id: { not_in: [current.id] } }];
  const active = (await listPostsWhere([...sameCategory, offerNotEndedWhere(now)], locale, 1, payload)).docs.slice(0, RELATED_POSTS_COUNT);
  if (active.length === RELATED_POSTS_COUNT) return active;
  const ended = (await listPostsWhere([...sameCategory, offerEndedWhere(now)], locale, 1, payload)).docs;
  return [...active, ...ended].slice(0, RELATED_POSTS_COUNT);
}

export interface RelatedTargets {
  project: Project | null;
  rental: Rental | null;
}

/**
 * Dự án / tin cho thuê liên quan của bài. Mỗi liên kết đọc lại qua `findPublicList` (như khách, kèm `publicWhere`, ở `/en` chỉ khi có bản EN)
 * nên dự án đã ẩn / tin chưa công khai không lộ ra; chỉ lấy trường cần cho thẻ nhỏ (tên, slug, ảnh thư viện).
 */
export async function findRelatedTargets(payload: Payload, locale: Locale, current: Pick<PropertyPost, "relatedProject" | "relatedRental">): Promise<RelatedTargets> {
  const projectId = relationId(current.relatedProject);
  const rentalId = relationId(current.relatedRental);
  const select = { title: true, slug: true, gallery: true } as const;
  const [projects, rentals] = await Promise.all([
    projectId
      ? findPublicList<Project>(payload, "projects", locale, { where: { id: { equals: projectId } }, limit: 1, depth: 1, select })
      : null,
    rentalId
      ? findPublicList<Rental>(payload, "rentals", locale, { where: { id: { equals: rentalId } }, limit: 1, depth: 1, select })
      : null,
  ]);
  return { project: projects?.docs[0] ?? null, rental: rentals?.docs[0] ?? null };
}
