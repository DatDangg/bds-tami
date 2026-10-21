import type { Payload, Where } from "payload";

import type { Locale } from "../../i18n/routing";
import type { Category, Project, PropertyPost, Rental } from "../../payload-types";
import { isOfferEnded, offerEndedWhere, offerNotEndedWhere } from "../content/offer-status";
import { MAX_PAGE_SIZE } from "../content/pagination";
import { findPublicBySlug, findPublicList, type PublicListResult } from "../content/public-queries";
import { relationId } from "../payload/relation-id";
import { DEFAULT_POST_SORT, type PostSortKey } from "./post-filters";
import { buildPostPredicates, computePostFacets, orderPosts, postMatcher, type PostFacets, type PostFilterCriteria } from "./post-list-facets";

/** 12 tin/trang (design-spec S08); tin nổi bật ở trang 1 của `/tin-bds` không tính vào 12 tin này. */
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
  // BL-052 thẻ BĐS: vị trí, loại hình, diện tích · phòng ngủ.
  province: true,
  ward: true,
  propertyType: true,
  areaM2: true,
  bedrooms: true,
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

/** Quét tối đa 20 trang x 50 = 1000 tin công khai (như `/du-an`); vượt thì phần sau không được lọc / đếm / sắp và có log cảnh báo. */
const SCAN_MAX_PAGES = 20;
const SCAN_PAGE_SIZE = MAX_PAGE_SIZE;
/** Số thẻ tối đa của slider nổi bật đầu lưới `/tin-bds`. */
export const POST_FEATURED_LIMIT = 5;

/** Trường đủ để lọc / đếm / sắp ở bộ nhớ (không ảnh, không nội dung). */
const POST_SCAN_FIELDS = {
  title: true,
  excerpt: true,
  address: true,
  province: true,
  ward: true,
  category: true,
  propertyType: true,
  priceVnd: true,
  areaM2: true,
  bedrooms: true,
  houseDirection: true,
  handoverCondition: true,
  isFeatured: true,
  offer: true,
} as const;
/** Doc liên quan khi quét: tỉnh (slug / tên / thứ tự cho ô tích + từ khoá), phường (tên cho từ khoá), danh mục (`parent` để đếm tab cấp 1). */
const POST_SCAN_POPULATE = {
  provinces: { slug: true, name: true, shortName: true, sortOrder: true },
  wards: { name: true },
  categories: { parent: true },
} as const;
/** Thẻ chỉ cần tên tỉnh / phường và tên / slug / `hasEnglish` danh mục (`visibleCategory`); ảnh bìa giữ đủ trường cho `ResponsiveImage`. */
const POST_CARD_POPULATE = {
  provinces: { name: true, shortName: true },
  wards: { name: true },
  categories: { name: true, slug: true, hasEnglish: true },
} as const;

/**
 * Quét MỌI tin công khai của ngôn ngữ (mới nhất trước): số đếm "trừ chính chiều đó" cần tập không lọc, từ khoá không dấu không có cột tìm kiếm,
 * và "không giá xếp cuối" không làm được bằng `sort` của Payload (Postgres đặt NULL đầu khi DESC).
 */
async function scanPublicPosts(payload: Payload, locale: Locale): Promise<PropertyPost[]> {
  const all: PropertyPost[] = [];
  for (let page = 1; page <= SCAN_MAX_PAGES; page += 1) {
    const result = await findPublicList<PropertyPost>(payload, "property-posts", locale, {
      sort: POST_SORT,
      page,
      limit: SCAN_PAGE_SIZE,
      depth: 1,
      select: POST_SCAN_FIELDS,
      populate: POST_SCAN_POPULATE,
    });
    all.push(...result.docs);
    if (!result.hasNextPage) break;
    if (page === SCAN_MAX_PAGES) {
      payload.logger.warn({ cap: SCAN_MAX_PAGES * SCAN_PAGE_SIZE }, "Quét tin BĐS chạm trần: kết quả lọc/đếm/sắp bị cắt, cần cột lọc + truy vấn SQL");
    }
  }
  return all;
}

/** Đủ trường thẻ của các id (một truy vấn), theo id. */
async function cardsByIds(payload: Payload, locale: Locale, ids: readonly string[]): Promise<Map<string, PropertyPost>> {
  if (ids.length === 0) return new Map();
  const { docs } = await findPublicList<PropertyPost>(payload, "property-posts", locale, {
    where: { id: { in: [...ids] } },
    limit: ids.length,
    depth: 1,
    select: POST_CARD_FIELDS,
    populate: POST_CARD_POPULATE,
  });
  return new Map(docs.map((doc) => [doc.id, doc]));
}

export interface PostListQuery extends PostFilterCriteria {
  page: number;
  sort?: PostSortKey;
  /** Mốc "bây giờ" để tách tin còn hạn / đã kết thúc (truyền vào để test được). */
  now: Date;
}

export type { PostFacetCounts, PostFacets, PostProvinceFacet } from "./post-list-facets";

/**
 * Kết quả danh sách `/tin-bds` (BL-052). `docs` = một trang lưới trên phần còn lại SAU KHI bỏ tin nổi bật; `totalDocs` = MỌI tin khớp
 * (gồm nổi bật — "N phù hợp"); `totalPages` tính trên phần còn lại (0 khi không còn tin nào ngoài nổi bật).
 */
export interface PostListResult {
  docs: PropertyPost[];
  /** ≤ 5 tin `isFeatured` còn hiệu lực khớp bộ lọc, mới nhất trước; chỉ có ở trang 1 (trang khác rỗng, nhưng vẫn bị loại khỏi lưới). */
  featured: PropertyPost[];
  totalDocs: number;
  totalPages: number;
  facets: PostFacets;
}

/**
 * Danh sách Tin BĐS công khai (`/tin-bds` + trang danh mục, BL-052). Mọi truy vấn đi qua `findPublicList` (đã xuất bản, chưa xoá mềm, `/en` chỉ tin `hasEnglish`).
 * Quét ≤ 1000 tin công khai rồi lọc / đếm / sắp ở bộ nhớ (như `/du-an`), sau đó MỘT truy vấn lấy trường thẻ cho trang lưới + thẻ nổi bật.
 * - Thứ tự: tin ưu đãi đã kết thúc luôn sau (BR-06); `newest` (mặc định) hoặc theo giá (không giá cuối) — `orderPosts`.
 * - Nổi bật: ≤ `POST_FEATURED_LIMIT` tin `isFeatured` CÒN HIỆU LỰC (ưu đãi chưa kết thúc, BR-06) khớp bộ lọc, mới nhất trước (không theo `sort`);
 *   trả ở trang 1, bị loại khỏi lưới ở MỌI trang nên không lặp; `totalDocs` vẫn tính cả chúng.
 * - `facets`: số đếm từng chiều theo quy tắc "khớp mọi bộ lọc khác trừ chính chiều đó".
 */
export async function listPublicPostListing(payload: Payload, locale: Locale, query: PostListQuery): Promise<PostListResult> {
  const { page, now } = query;
  const scanned = await scanPublicPosts(payload, locale);
  const predicates = buildPostPredicates(query);
  const matched = scanned.filter(postMatcher(predicates));
  const featuredIds = matched
    .filter((post) => post.isFeatured === true && !isOfferEnded(post, now))
    .slice(0, POST_FEATURED_LIMIT)
    .map((post) => post.id);
  const rest = orderPosts(
    matched.filter((post) => !featuredIds.includes(post.id)),
    query.sort ?? DEFAULT_POST_SORT,
    now,
  );
  const totalPages = Math.ceil(rest.length / POST_PAGE_SIZE);
  const pageIds = rest.slice((page - 1) * POST_PAGE_SIZE, page * POST_PAGE_SIZE).map((post) => post.id);
  const shownFeaturedIds = page === 1 ? featuredIds : [];
  const cards = await cardsByIds(payload, locale, [...shownFeaturedIds, ...pageIds]);
  const inOrder = (ids: readonly string[]) => ids.flatMap((id) => cards.get(id) ?? []);
  return {
    docs: inOrder(pageIds),
    featured: inOrder(shownFeaturedIds),
    totalDocs: matched.length,
    totalPages,
    facets: computePostFacets(scanned, predicates),
  };
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
