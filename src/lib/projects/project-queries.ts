import type { Payload, Where } from "payload";

import type { Locale } from "../../i18n/routing";
import type { Category, Developer, Project, Province } from "../../payload-types";
import { MAX_PAGE_SIZE } from "../content/pagination";
import { relationId } from "../payload/relation-id";
import type { ProjectSortKey } from "./project-filters";
import { buildPredicates, compareByPrice, computeFacets, matcher, type ProjectFacets, type ProjectFilterCriteria } from "./project-list-facets";
import { findPublicBySlug, findPublicList, type PublicListResult } from "../content/public-queries";

/** 12 dự án/trang (design-spec S02). */
export const PROJECT_PAGE_SIZE = 12;

const PROJECT_SORT = ["-publishedAt", "-createdAt"];
const CATEGORY_SORT = ["sortOrder", "createdAt"];
/** Danh mục nền ít, tối đa 2 cấp (ERD §4.3). */
const CATEGORY_LIMIT = 50;
/** 34 tỉnh/thành sau sáp nhập; dư để không cắt khi dữ liệu đổi. */
const PROVINCE_LIMIT = 100;

/** Trường thẻ dự án dùng (thẻ lưới + thẻ nổi bật BL-052): bỏ `overview`, pháp lý, chính sách... (richText dài) khỏi truy vấn danh sách. */
const PROJECT_CARD_FIELDS = {
  title: true,
  slug: true,
  summary: true,
  address: true,
  salesStatus: true,
  province: true,
  category: true,
  priceFromVnd: true,
  priceTable: true,
  areaFromM2: true,
  areaToM2: true,
  productTypes: true,
  scale: true,
  gallery: true,
} as const;

const PROJECT_CATEGORY_SCOPE: Where = { scope: { equals: "project" } };

/** Danh mục `project` cấp 1 của một ngôn ngữ (chip Loại hình của S02). `/en` chỉ gồm danh mục đã có bản EN. */
export function listRootProjectCategories(payload: Payload, locale: Locale): Promise<PublicListResult<Category>> {
  return findPublicList<Category>(payload, "categories", locale, {
    where: { and: [PROJECT_CATEGORY_SCOPE, { parent: { exists: false } }] },
    sort: CATEGORY_SORT,
    limit: CATEGORY_LIMIT,
    depth: 0,
  });
}

/** Danh mục con (cấp 2) của một danh mục `project`. */
export function listChildProjectCategories(payload: Payload, locale: Locale, parentId: string): Promise<PublicListResult<Category>> {
  return findPublicList<Category>(payload, "categories", locale, {
    where: { and: [PROJECT_CATEGORY_SCOPE, { parent: { equals: parentId } }] },
    sort: CATEGORY_SORT,
    limit: CATEGORY_LIMIT,
    depth: 0,
  });
}

/** Danh mục `project` theo slug của ngôn ngữ đang xem (slug chỉ duy nhất trong cùng scope). `parent` đã populate. */
export function findProjectCategoryBySlug(payload: Payload, locale: Locale, slug: string): Promise<Category | null> {
  return findPublicBySlug<Category>(payload, "categories", locale, slug, { where: PROJECT_CATEGORY_SCOPE, depth: 1 });
}

/**
 * Tỉnh/thành cho ô lọc, theo thứ tự `sortOrder`. Danh mục tĩnh công khai (`access.read` mở), đọc như khách; không có
 * xoá mềm/`hasEnglish` nên không đi qua `findPublicList`. Tên riêng tiếng Việt giữ nguyên ở `/en`.
 */
export async function listProvinces(payload: Payload): Promise<Province[]> {
  const result = await payload.find({
    collection: "provinces",
    sort: "sortOrder",
    limit: PROVINCE_LIMIT,
    pagination: false,
    depth: 0,
    overrideAccess: false,
  });
  return result.docs;
}

export interface ProjectPageQuery extends ProjectFilterCriteria {
  page: number;
  /** `newest` (mặc định) | `price_asc` | `price_desc` (theo `effectivePriceFromVnd`, không có giá xếp cuối). */
  sort?: ProjectSortKey;
}

export type { FacetCounts, ProjectFacets, ProjectProvinceFacet } from "./project-list-facets";

/**
 * Kết quả danh sách `/du-an` (BL-052). `docs` = một trang lưới (12) trên phần còn lại SAU KHI bỏ dự án nổi bật; `totalDocs` = MỌI dự án khớp
 * (gồm nổi bật — "N phù hợp"); `totalPages` / `hasNextPage` tính trên phần còn lại.
 */
export interface ProjectListResult extends PublicListResult<Project> {
  /** ≤ 5 dự án `isFeatured` khớp bộ lọc, mới nhất trước; chỉ có ở trang 1 (trang khác: rỗng, nhưng vẫn bị loại khỏi lưới). */
  featured: Project[];
  facets: ProjectFacets;
}

/** Số thẻ tối đa của slider nổi bật đầu lưới `/du-an`. */
export const PROJECT_FEATURED_LIMIT = 5;

/** Trường đủ để lọc / đếm / sắp ở bộ nhớ; tỉnh + phường + danh mục populate ở depth 1 (tên để khớp từ khoá, `parent` để gom tab cấp 1). */
const PROJECT_SCAN_FIELDS = {
  title: true,
  address: true,
  province: true,
  ward: true,
  category: true,
  developer: true,
  salesStatus: true,
  productTypes: true,
  featuredAmenities: true,
  priceFromVnd: true,
  priceTable: true,
  isFeatured: true,
} as const;
/**
 * Doc liên quan khi quét chỉ lấy trường cần (P1-T04 review m2): tỉnh (slug / tên / thứ tự cho ô tích + từ khoá), phường (tên cho từ khoá),
 * danh mục (`parent` để gom tab cấp 1). Chủ đầu tư chỉ cần id → lấy `slug` (một cột nhỏ) thay vì cả logo / mô tả.
 */
const PROJECT_SCAN_POPULATE = {
  provinces: { slug: true, name: true, shortName: true, sortOrder: true },
  wards: { name: true },
  categories: { parent: true },
  developers: { slug: true },
} as const;
/** Thẻ (lưới + nổi bật) chỉ cần tên tỉnh và tên / slug / `hasEnglish` danh mục (`visibleCategory`); ảnh gallery giữ đủ trường cho `ResponsiveImage`. */
const PROJECT_CARD_POPULATE = {
  provinces: { name: true, shortName: true },
  categories: { name: true, slug: true, hasEnglish: true },
} as const;
/** Quét tối đa 20 trang x 50 = 1000 dự án; vượt thì phần sau không được lọc/đếm (dự án công khai thực tế chỉ vài chục). */
const SCAN_MAX_PAGES = 20;
const SCAN_PAGE_SIZE = MAX_PAGE_SIZE;

/**
 * Quét MỌI dự án công khai của ngôn ngữ (mới nhất trước) để lọc / đếm theo chiều / sắp giá ở bộ nhớ: số đếm "trừ chính chiều đó" cần tập không lọc,
 * không thêm cột `searchText`, và Postgres đặt NULL đầu khi DESC nên không xếp "không giá cuối" bằng SQL được.
 */
async function scanPublicProjects(payload: Payload, locale: Locale): Promise<Project[]> {
  const all: Project[] = [];
  for (let page = 1; page <= SCAN_MAX_PAGES; page += 1) {
    const result = await findPublicList<Project>(payload, "projects", locale, {
      sort: PROJECT_SORT,
      page,
      limit: SCAN_PAGE_SIZE,
      depth: 1,
      select: PROJECT_SCAN_FIELDS,
      populate: PROJECT_SCAN_POPULATE,
    });
    all.push(...result.docs);
    if (!result.hasNextPage) break;
    if (page === SCAN_MAX_PAGES) {
      payload.logger.warn({ cap: SCAN_MAX_PAGES * SCAN_PAGE_SIZE }, "Quét dự án chạm trần: kết quả lọc/đếm/sắp giá bị cắt, cần cột lọc + migration");
    }
  }
  return all;
}

/** Lấy đủ trường thẻ của các id (một truy vấn) rồi trả theo đúng thứ tự id. */
// Cũng dùng cho khối "Dự án nhắc đến" của bài Tin tức (BL-054): `findPublicList` nên id chưa xuất bản / đã xoá / `/en` thiếu bản EN không có trong map.
export async function findPublicProjectCardsByIds(payload: Payload, locale: Locale, ids: readonly string[]): Promise<Map<string, Project>> {
  if (ids.length === 0) return new Map();
  const { docs } = await findPublicList<Project>(payload, "projects", locale, {
    where: { id: { in: [...ids] } },
    limit: ids.length,
    depth: 1,
    select: PROJECT_CARD_FIELDS,
    populate: PROJECT_CARD_POPULATE,
  });
  return new Map(docs.map((doc) => [doc.id, doc]));
}

/**
 * Danh sách dự án công khai `/du-an` (BL-045 + BL-052). Mọi truy vấn đi qua `findPublicList` (đã xuất bản, chưa xoá mềm, `/en` chỉ dự án `hasEnglish`).
 * Quét ≤ 1000 dự án công khai rồi lọc / đếm / sắp ở bộ nhớ (như BL-045), sau đó MỘT truy vấn lấy trường thẻ cho trang lưới + thẻ nổi bật.
 * - Lọc: danh mục (+ con), tỉnh (OR), trạng thái, chủ đầu tư, loại sản phẩm (OR), tiện ích nổi bật (AND), khoảng giá (tỷ, theo `effectivePriceFromVnd`), từ khoá.
 * - Sắp: mới nhất (mặc định) hoặc theo giá (không giá cuối).
 * - Nổi bật: ≤ `PROJECT_FEATURED_LIMIT` dự án `isFeatured` khớp bộ lọc, MỚI NHẤT trước (không theo `sort`); trả ở trang 1, và bị loại khỏi lưới ở MỌI trang
 *   (phân trang trên phần còn lại) nên không lặp; `totalDocs` vẫn tính cả chúng.
 * - `facets`: số đếm từng chiều theo quy tắc "khớp mọi bộ lọc khác trừ chính chiều đó".
 */
export async function listPublicProjects(payload: Payload, locale: Locale, query: ProjectPageQuery): Promise<ProjectListResult> {
  const scanned = await scanPublicProjects(payload, locale);
  const predicates = buildPredicates(query);
  const matched = scanned.filter(matcher(predicates));
  const featuredIds = matched.filter((project) => project.isFeatured === true).slice(0, PROJECT_FEATURED_LIMIT).map((project) => project.id);
  const rest = matched.filter((project) => !featuredIds.includes(project.id));
  const priceSort = query.sort === "price_asc" || query.sort === "price_desc" ? query.sort : undefined;
  const ordered = priceSort ? [...rest].sort(compareByPrice(priceSort)) : rest;

  const page = query.page;
  const totalPages = Math.ceil(ordered.length / PROJECT_PAGE_SIZE);
  const pageIds = ordered.slice((page - 1) * PROJECT_PAGE_SIZE, page * PROJECT_PAGE_SIZE).map((project) => project.id);
  const shownFeaturedIds = page === 1 ? featuredIds : [];
  const cards = await findPublicProjectCardsByIds(payload, locale, [...shownFeaturedIds, ...pageIds]);
  const inOrder = (ids: readonly string[]) => ids.flatMap((id) => cards.get(id) ?? []);
  return {
    docs: inOrder(pageIds),
    page,
    limit: PROJECT_PAGE_SIZE,
    totalDocs: matched.length,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    featured: inOrder(shownFeaturedIds),
    facets: computeFacets(scanned, predicates),
  };
}

/**
 * Chủ đầu tư CÓ dự án công khai (ô "Chủ đầu tư" của `/du-an`), theo `sortOrder`. Id lấy từ dự án công khai của ngôn ngữ đang xem rồi
 * đi qua `findPublicList` của `developers` (`/en` chỉ chủ đầu tư có bản EN).
 */
export async function listDevelopersWithPublicProjects(payload: Payload, locale: Locale): Promise<Developer[]> {
  const ids = new Set<string>();
  for (let page = 1; page <= SCAN_MAX_PAGES; page += 1) {
    const result = await findPublicList<Project>(payload, "projects", locale, {
      where: { developer: { exists: true } },
      page,
      limit: SCAN_PAGE_SIZE,
      depth: 0,
      select: { developer: true },
    });
    for (const project of result.docs) {
      const id = relationId(project.developer);
      if (id) ids.add(id);
    }
    if (!result.hasNextPage) break;
  }
  if (ids.size === 0) return [];
  const { docs } = await findPublicList<Developer>(payload, "developers", locale, {
    where: { id: { in: [...ids] } },
    sort: ["sortOrder", "createdAt"],
    // Đúng số id vừa gom: không cắt cứng, để `?developer=<id>` hợp lệ không bị bỏ khi có nhiều chủ đầu tư.
    limit: ids.size,
    depth: 0,
  });
  return docs;
}

/** Dự án công khai theo slug của ngôn ngữ đang xem; `depth: 1` populate ảnh (gallery, mặt bằng, tài liệu), tỉnh, phường, chủ đầu tư, danh mục. */
export function findPublicProjectBySlug(payload: Payload, locale: Locale, slug: string): Promise<Project | null> {
  return findPublicBySlug<Project>(payload, "projects", locale, slug, { depth: 1 });
}

/** Số thẻ "Dự án khác" cuối trang chi tiết (design-spec S03 khối 12). */
export const OTHER_PROJECTS_COUNT = 3;

/**
 * Tối đa 3 dự án CÙNG tỉnh hoặc CÙNG loại hình, mới nhất trước, loại dự án hiện tại. Đi qua `findPublicList` nên chỉ dự án công khai
 * (và `/en` chỉ dự án có bản EN). Thiếu cả tỉnh lẫn danh mục thì không có dự án liên quan.
 */
export async function findOtherProjects(payload: Payload, locale: Locale, current: Pick<Project, "id" | "province" | "category">): Promise<Project[]> {
  const provinceId = relationId(current.province);
  const categoryId = relationId(current.category);
  const related: Where[] = [
    ...(provinceId ? [{ province: { equals: provinceId } }] : []),
    ...(categoryId ? [{ category: { equals: categoryId } }] : []),
  ];
  if (related.length === 0) return [];
  const { docs } = await findPublicList<Project>(payload, "projects", locale, {
    where: { and: [{ or: related }, { id: { not_equals: current.id } }] },
    sort: PROJECT_SORT,
    limit: OTHER_PROJECTS_COUNT,
    depth: 1,
    select: PROJECT_CARD_FIELDS,
    populate: PROJECT_CARD_POPULATE,
  });
  return docs;
}
