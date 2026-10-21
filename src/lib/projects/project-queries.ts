import type { Payload, Where } from "payload";

import type { SalesStatus } from "../../collections/Projects";
import type { Locale } from "../../i18n/routing";
import type { Category, Developer, Project, Province } from "../../payload-types";
import { MAX_PAGE_SIZE } from "../content/pagination";
import { relationId } from "../payload/relation-id";
import { normalizeSearchText } from "../search/normalize";
import { PROJECT_FEATURES, PROPERTY_TYPES, type ProjectFeature, type PropertyType } from "../../shared/listing-options";
import { SALES_STATUS_VALUES, type ProjectSortKey } from "./project-filters";
import { BILLION_VND, effectivePriceFromVnd } from "./project-price";
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

export interface ProjectPageQuery {
  page: number;
  /** Lọc theo các danh mục này (danh mục + con của nó). Bỏ trống = mọi danh mục. */
  categoryIds?: readonly string[];
  /** Id tỉnh ĐÃ đối chiếu với danh sách tỉnh (OR; BL-052 nhiều tỉnh). Bỏ trống = mọi tỉnh. */
  provinceIds?: readonly string[];
  salesStatus?: SalesStatus;
  /** Từ khoá (BL-045): khớp không dấu tên dự án + địa chỉ / tỉnh / phường. Rỗng = không lọc. */
  q?: string;
  /** Id chủ đầu tư ĐÃ đối chiếu với danh sách chủ đầu tư công khai. */
  developerId?: string;
  /** `newest` (mặc định) | `price_asc` | `price_desc` (theo `effectivePriceFromVnd`, không có giá xếp cuối). */
  sort?: ProjectSortKey;
  /** BL-052: dự án có ÍT NHẤT MỘT loại sản phẩm này (OR). */
  types?: readonly PropertyType[];
  /** BL-052: dự án có ĐỦ MỌI tiện ích nổi bật này (AND). */
  features?: readonly ProjectFeature[];
  /** BL-052: khoảng "Giá từ" (`effectivePriceFromVnd`), đơn vị TỶ đồng, hai đầu tính cả. Có một trong hai → dự án không có giá bị loại. */
  priceMin?: number;
  priceMax?: number;
}

/** Số đếm theo một chiều lọc: `counts[giá trị]` = số dự án khớp MỌI bộ lọc khác trừ chiều này; `all` = số khớp khi bỏ hẳn chiều này ("Tất cả"). */
export interface FacetCounts<K extends string = string> {
  all: number;
  counts: Record<K, number>;
}

/** Một dòng ô tích "Tỉnh/thành": chỉ tỉnh có ≥ 1 dự án công khai. */
export interface ProjectProvinceFacet {
  id: string;
  slug: string;
  /** Tên ngắn nếu có. */
  name: string;
  /** Khớp mọi bộ lọc khác trừ tỉnh. */
  count: number;
  /** Số dự án công khai của tỉnh khi không lọc gì (dùng để sắp). */
  total: number;
}

export interface ProjectFacets {
  /** Theo id danh mục CẤP 1 (dự án ở danh mục con tính vào danh mục cha) — tab; `all` = tab "Tất cả". */
  category: FacetCounts;
  /** Đủ ba trạng thái (0 vẫn có). */
  status: FacetCounts<SalesStatus>;
  /** Theo id chủ đầu tư (chỉ chủ đầu tư có dự án khớp). */
  developer: FacetCounts;
  /** Đủ mọi `PROPERTY_TYPES` (0 vẫn có). */
  type: FacetCounts<PropertyType>;
  /** Đủ mọi `PROJECT_FEATURES` (0 vẫn có). Chiều AND nhưng vẫn theo quy tắc chung: bỏ cả chiều tiện ích khi đếm. */
  feature: FacetCounts<ProjectFeature>;
  /** Tỉnh có ≥ 1 dự án công khai, sắp theo `total` giảm dần (hoà: `sortOrder` của tỉnh). */
  provinces: ProjectProvinceFacet[];
}

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
/** Quét tối đa 20 trang x 50 = 1000 dự án; vượt thì phần sau không được lọc/đếm (dự án công khai thực tế chỉ vài chục). */
const SCAN_MAX_PAGES = 20;
const SCAN_PAGE_SIZE = MAX_PAGE_SIZE;

function relationName(value: unknown): string {
  if (typeof value !== "object" || value === null) return "";
  const { name } = value as { name?: unknown };
  return typeof name === "string" ? name : "";
}

/** Chuỗi tìm kiếm không dấu của một dự án: tên + địa chỉ + phường + tỉnh (cùng `normalizeSearchText` với từ khoá). */
function projectSearchText(project: Project): string {
  return normalizeSearchText([project.title, project.address, relationName(project.ward), relationName(project.province)].filter(Boolean).join(" "));
}

/** Id danh mục cấp 1 của dự án: danh mục cha nếu có (tối đa 2 cấp, ERD §4.3), không thì chính danh mục. */
function rootCategoryId(project: Project): string | null {
  const category = project.category;
  if (!category || typeof category !== "object") return relationId(category);
  return relationId(category.parent) ?? category.id;
}

/** Giá tăng/giảm, dự án chưa có giá luôn cuối; hoà thì giữ thứ tự mới nhất sẵn có (`Array.sort` ổn định). */
function compareByPrice(direction: "price_asc" | "price_desc") {
  return (a: Project, b: Project): number => {
    const left = effectivePriceFromVnd(a);
    const right = effectivePriceFromVnd(b);
    if (left === null || right === null) return left === right ? 0 : left === null ? 1 : -1;
    return direction === "price_asc" ? left - right : right - left;
  };
}

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
    });
    all.push(...result.docs);
    if (!result.hasNextPage) break;
    if (page === SCAN_MAX_PAGES) {
      payload.logger.warn({ cap: SCAN_MAX_PAGES * SCAN_PAGE_SIZE }, "Quét dự án chạm trần: kết quả lọc/đếm/sắp giá bị cắt, cần cột lọc + migration");
    }
  }
  return all;
}

type FilterDimension = "category" | "province" | "status" | "developer" | "type" | "feature" | "price" | "keyword";
type ProjectPredicate = (project: Project) => boolean;

/** Mỗi chiều lọc đang bật thành một điều kiện; chiều không bật thì không có (luôn khớp). */
function buildPredicates(query: ProjectPageQuery): Partial<Record<FilterDimension, ProjectPredicate>> {
  const predicates: Partial<Record<FilterDimension, ProjectPredicate>> = {};
  if (query.categoryIds) {
    const ids = new Set(query.categoryIds);
    predicates.category = (project) => ids.has(relationId(project.category) ?? "");
  }
  if (query.provinceIds && query.provinceIds.length > 0) {
    const ids = new Set(query.provinceIds);
    predicates.province = (project) => ids.has(relationId(project.province) ?? "");
  }
  if (query.salesStatus) predicates.status = (project) => project.salesStatus === query.salesStatus;
  if (query.developerId) predicates.developer = (project) => relationId(project.developer) === query.developerId;
  const types = query.types ?? [];
  if (types.length > 0) predicates.type = (project) => (project.productTypes ?? []).some((type) => types.includes(type));
  const features = query.features ?? [];
  if (features.length > 0) predicates.feature = (project) => features.every((feature) => (project.featuredAmenities ?? []).includes(feature));
  if (query.priceMin !== undefined || query.priceMax !== undefined) {
    const min = (query.priceMin ?? 0) * BILLION_VND;
    const max = query.priceMax === undefined ? Number.POSITIVE_INFINITY : query.priceMax * BILLION_VND;
    predicates.price = (project) => {
      const price = effectivePriceFromVnd(project);
      return price !== null && price >= min && price <= max;
    };
  }
  const keyword = query.q ? normalizeSearchText(query.q) : "";
  if (keyword) predicates.keyword = (project) => projectSearchText(project).includes(keyword);
  return predicates;
}

/** Dự án khớp mọi chiều lọc, trừ `except` (để đếm theo chiều đó). */
function matcher(predicates: Partial<Record<FilterDimension, ProjectPredicate>>, except?: FilterDimension): ProjectPredicate {
  const active = Object.entries(predicates).flatMap(([dimension, predicate]) => (dimension === except ? [] : [predicate]));
  return (project) => active.every((predicate) => predicate(project));
}

function countBy<K extends string>(projects: readonly Project[], keysOf: (project: Project) => readonly (K | null)[], known: readonly K[] = []): FacetCounts<K> {
  const counts = Object.fromEntries(known.map((key) => [key, 0])) as Record<K, number>;
  for (const project of projects) {
    for (const key of new Set(keysOf(project))) {
      if (key !== null) counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  return { all: projects.length, counts };
}

function provinceFacets(scanned: readonly Project[], countFor: FacetCounts): ProjectProvinceFacet[] {
  const byId = new Map<string, { province: Province; total: number }>();
  for (const project of scanned) {
    const province = project.province;
    if (typeof province !== "object" || !province.slug) continue;
    const entry = byId.get(province.id) ?? { province, total: 0 };
    entry.total += 1;
    byId.set(province.id, entry);
  }
  return [...byId.values()]
    .sort((a, b) => b.total - a.total || (a.province.sortOrder ?? 0) - (b.province.sortOrder ?? 0))
    .map(({ province, total }) => ({
      id: province.id,
      slug: province.slug,
      name: province.shortName || province.name,
      count: countFor.counts[province.id] ?? 0,
      total,
    }));
}

function computeFacets(scanned: readonly Project[], predicates: Partial<Record<FilterDimension, ProjectPredicate>>): ProjectFacets {
  const without = (dimension: FilterDimension) => scanned.filter(matcher(predicates, dimension));
  const province = countBy(without("province"), (project) => [relationId(project.province)]);
  return {
    category: countBy(without("category"), (project) => [rootCategoryId(project)]),
    status: countBy(without("status"), (project) => [project.salesStatus], SALES_STATUS_VALUES),
    developer: countBy(without("developer"), (project) => [relationId(project.developer)]),
    type: countBy(without("type"), (project) => project.productTypes ?? [], PROPERTY_TYPES),
    feature: countBy(without("feature"), (project) => project.featuredAmenities ?? [], PROJECT_FEATURES),
    provinces: provinceFacets(scanned, province),
  };
}

/** Lấy đủ trường thẻ của các id (một truy vấn) rồi trả theo đúng thứ tự id. */
async function cardsByIds(payload: Payload, locale: Locale, ids: readonly string[]): Promise<Map<string, Project>> {
  if (ids.length === 0) return new Map();
  const { docs } = await findPublicList<Project>(payload, "projects", locale, {
    where: { id: { in: [...ids] } },
    limit: ids.length,
    depth: 1,
    select: PROJECT_CARD_FIELDS,
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
  const cards = await cardsByIds(payload, locale, [...shownFeaturedIds, ...pageIds]);
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
  });
  return docs;
}
