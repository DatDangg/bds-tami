import type { Province, PropertyPost } from "../../payload-types";
import { DIRECTIONS, HANDOVER_CONDITIONS, PROPERTY_TYPES, type Direction, type HandoverCondition, type PropertyType } from "../../shared/listing-options";
import { isOfferEnded } from "../content/offer-status";
import { relationId } from "../payload/relation-id";
import { BILLION_VND } from "../projects/project-price";
import { normalizeSearchText } from "../search/normalize";
import type { PostBedrooms, PostSortKey } from "./post-filters";

/**
 * Lọc + đếm + sắp danh sách Tin BĐS trên tập đã quét ở bộ nhớ (`/tin-bds`, BL-052) — cùng cách `/du-an` (`project-list-facets.ts`).
 * Thuần (không đụng Payload): `post-queries.ts` quét rồi gọi các hàm ở đây.
 * Quy tắc số đếm (spec "Trang danh sách (khung chung)"): mỗi chiều = số tin khớp MỌI bộ lọc khác TRỪ chính chiều đó.
 * Lọc thuộc tính (giá, diện tích, phòng ngủ, loại hình, hướng, bàn giao) tự loại tin không có giá trị đó.
 */

/** Phòng ngủ ≥ giá trị này khi chọn chip cuối ("4+"). */
const BEDROOMS_OPEN_ENDED = 4;

export interface PostFilterCriteria {
  /** Danh mục + con (theo route danh mục). Bỏ trống = mọi danh mục. */
  categoryIds?: readonly string[];
  /** Id tỉnh ĐÃ đối chiếu với danh sách tỉnh (OR). */
  provinceIds?: readonly string[];
  /** Khớp không dấu tiêu đề + tóm tắt + địa chỉ + phường + tỉnh. */
  q?: string;
  types?: readonly PropertyType[];
  /** Tỷ đồng, hai đầu tính cả; có một đầu → tin không có giá bị loại. */
  priceMin?: number;
  priceMax?: number;
  /** m², hai đầu tính cả; có một đầu → tin không có diện tích bị loại. */
  areaMin?: number;
  areaMax?: number;
  bedrooms?: PostBedrooms;
  directions?: readonly Direction[];
  handovers?: readonly HandoverCondition[];
}

export interface PostFacetCounts<K extends string = string> {
  /** Số tin khớp khi bỏ hẳn chiều này ("Tất cả"). */
  all: number;
  counts: Record<K, number>;
}

/** Một dòng ô tích "Tỉnh/thành": chỉ tỉnh có ≥ 1 tin công khai. */
export interface PostProvinceFacet {
  id: string;
  slug: string;
  /** Tên ngắn nếu có. */
  name: string;
  /** Khớp mọi bộ lọc khác trừ tỉnh. */
  count: number;
  /** Số tin công khai của tỉnh khi không lọc gì (để sắp). */
  total: number;
}

/**
 * Số đếm cho tab + ô tích. Chip đơn chọn (Phòng ngủ) KHÔNG có số đếm (quyết định user 2026-10-22, `phase-2-task-04.md` § Quyết định);
 * thanh trượt (giá, diện tích) cũng không.
 */
export interface PostFacets {
  /** Theo id danh mục: tin tính vào danh mục CỦA NÓ và danh mục CHA (nếu có) — tab cấp 1 ở `/tin-bds` lẫn tab con ở trang danh mục cùng dùng. */
  category: PostFacetCounts;
  /** Đủ mọi `PROPERTY_TYPES` (0 vẫn có). */
  type: PostFacetCounts<PropertyType>;
  /** Đủ mọi `DIRECTIONS` (0 vẫn có). */
  direction: PostFacetCounts<Direction>;
  /** Đủ mọi `HANDOVER_CONDITIONS` (0 vẫn có). */
  handover: PostFacetCounts<HandoverCondition>;
  /** Tỉnh có ≥ 1 tin công khai (trong phạm vi quét), sắp theo `total` giảm dần (hoà: `sortOrder`). */
  provinces: PostProvinceFacet[];
}

type FilterDimension = "category" | "province" | "keyword" | "type" | "price" | "area" | "bedrooms" | "direction" | "handover";
type PostPredicate = (post: PropertyPost) => boolean;
export type PostPredicates = Partial<Record<FilterDimension, PostPredicate>>;

const positive = (value: number | null | undefined): number | null => (typeof value === "number" && value > 0 ? value : null);

function relationName(value: unknown): string {
  if (typeof value !== "object" || value === null) return "";
  const { name } = value as { name?: unknown };
  return typeof name === "string" ? name : "";
}

function postSearchText(post: PropertyPost): string {
  return normalizeSearchText([post.title, post.excerpt, post.address, relationName(post.ward), relationName(post.province)].filter(Boolean).join(" "));
}

/** Khoảng hai đầu tính cả; giá trị trống (hoặc ≤ 0) không khớp khoảng nào. */
function inRange(value: number | null, min: number, max: number): boolean {
  return value !== null && value >= min && value <= max;
}

/** Mỗi chiều lọc đang bật thành một điều kiện; chiều không bật thì không có (luôn khớp). */
export function buildPostPredicates(criteria: PostFilterCriteria): PostPredicates {
  const predicates: PostPredicates = {};
  if (criteria.categoryIds) {
    const ids = new Set(criteria.categoryIds);
    predicates.category = (post) => ids.has(relationId(post.category) ?? "");
  }
  if (criteria.provinceIds && criteria.provinceIds.length > 0) {
    const ids = new Set(criteria.provinceIds);
    predicates.province = (post) => ids.has(relationId(post.province) ?? "");
  }
  const keyword = criteria.q ? normalizeSearchText(criteria.q) : "";
  if (keyword) predicates.keyword = (post) => postSearchText(post).includes(keyword);
  const types = criteria.types ?? [];
  if (types.length > 0) predicates.type = (post) => post.propertyType != null && types.includes(post.propertyType);
  if (criteria.priceMin !== undefined || criteria.priceMax !== undefined) {
    const min = (criteria.priceMin ?? 0) * BILLION_VND;
    const max = criteria.priceMax === undefined ? Number.POSITIVE_INFINITY : criteria.priceMax * BILLION_VND;
    predicates.price = (post) => inRange(positive(post.priceVnd), min, max);
  }
  if (criteria.areaMin !== undefined || criteria.areaMax !== undefined) {
    const min = criteria.areaMin ?? 0;
    const max = criteria.areaMax ?? Number.POSITIVE_INFINITY;
    predicates.area = (post) => inRange(positive(post.areaM2), min, max);
  }
  const bedrooms = criteria.bedrooms;
  if (bedrooms !== undefined) {
    predicates.bedrooms = (post) =>
      typeof post.bedrooms === "number" && (bedrooms >= BEDROOMS_OPEN_ENDED ? post.bedrooms >= bedrooms : post.bedrooms === bedrooms);
  }
  const directions = criteria.directions ?? [];
  if (directions.length > 0) predicates.direction = (post) => post.houseDirection != null && directions.includes(post.houseDirection);
  const handovers = criteria.handovers ?? [];
  if (handovers.length > 0) predicates.handover = (post) => post.handoverCondition != null && handovers.includes(post.handoverCondition);
  return predicates;
}

/** Tin khớp mọi chiều lọc, trừ `except` (để đếm theo chiều đó). */
export function postMatcher(predicates: PostPredicates, except?: FilterDimension): PostPredicate {
  const active = Object.entries(predicates).flatMap(([dimension, predicate]) => (dimension === except ? [] : [predicate]));
  return (post) => active.every((predicate) => predicate(post));
}

function countBy<K extends string>(posts: readonly PropertyPost[], keysOf: (post: PropertyPost) => readonly (K | null | undefined)[], known: readonly K[] = []): PostFacetCounts<K> {
  const counts = Object.fromEntries(known.map((key) => [key, 0])) as Record<K, number>;
  for (const post of posts) {
    for (const key of new Set(keysOf(post))) {
      if (key != null) counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  return { all: posts.length, counts };
}

/** Danh mục của tin + danh mục cha (tối đa 2 cấp, ERD §4.3). */
function categoryKeys(post: PropertyPost): (string | null)[] {
  const category = post.category;
  if (!category || typeof category !== "object") return [relationId(category)];
  return [category.id, relationId(category.parent)];
}

function provinceFacets(scanned: readonly PropertyPost[], countFor: PostFacetCounts): PostProvinceFacet[] {
  const byId = new Map<string, { province: Province; total: number }>();
  for (const post of scanned) {
    const province = post.province;
    if (!province || typeof province !== "object" || !province.slug) continue;
    const entry = byId.get(province.id) ?? { province, total: 0 };
    entry.total += 1;
    byId.set(province.id, entry);
  }
  return [...byId.values()]
    .sort((a, b) => b.total - a.total || (a.province.sortOrder ?? 0) - (b.province.sortOrder ?? 0))
    .map(({ province, total }) => ({ id: province.id, slug: province.slug, name: province.shortName || province.name, count: countFor.counts[province.id] ?? 0, total }));
}

/** Số đếm mọi chiều trên tập đã quét (không lọc) theo quy tắc "trừ chính chiều đó". */
export function computePostFacets(scanned: readonly PropertyPost[], predicates: PostPredicates): PostFacets {
  const without = (dimension: FilterDimension) => scanned.filter(postMatcher(predicates, dimension));
  return {
    category: countBy(without("category"), categoryKeys),
    type: countBy(without("type"), (post) => [post.propertyType], PROPERTY_TYPES),
    direction: countBy(without("direction"), (post) => [post.houseDirection], DIRECTIONS),
    handover: countBy(without("handover"), (post) => [post.handoverCondition], HANDOVER_CONDITIONS),
    provinces: provinceFacets(scanned, countBy(without("province"), (post) => [relationId(post.province)])),
  };
}

/**
 * Thứ tự lưới: tin ưu đãi ĐÃ KẾT THÚC luôn xếp sau (BR-06, như trước BL-052) ở mọi kiểu sắp; trong mỗi nhóm: `newest` giữ thứ tự quét
 * (mới nhất trước), `price_asc` / `price_desc` theo `priceVnd`, tin không có giá cuối. `Array.sort` ổn định nên hoà giữ mới nhất trước.
 */
export function orderPosts(posts: readonly PropertyPost[], sort: PostSortKey, now: Date): PropertyPost[] {
  const ended = new Set(posts.filter((post) => isOfferEnded(post, now)).map((post) => post.id));
  return [...posts].sort((a, b) => {
    const group = Number(ended.has(a.id)) - Number(ended.has(b.id));
    if (group !== 0 || sort === "newest") return group;
    const left = positive(a.priceVnd);
    const right = positive(b.priceVnd);
    if (left === null || right === null) return left === right ? 0 : left === null ? 1 : -1;
    return sort === "price_asc" ? left - right : right - left;
  });
}
