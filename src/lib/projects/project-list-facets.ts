import type { SalesStatus } from "../../collections/Projects";
import type { Project, Province } from "../../payload-types";
import { PROJECT_FEATURES, PROPERTY_TYPES, type ProjectFeature, type PropertyType } from "../../shared/listing-options";
import { relationId } from "../payload/relation-id";
import { normalizeSearchText } from "../search/normalize";
import { SALES_STATUS_VALUES } from "./project-filters";
import { BILLION_VND, effectivePriceFromVnd } from "./project-price";

/**
 * Lọc + đếm theo chiều trên tập dự án đã quét ở bộ nhớ (`/du-an`, BL-052). Thuần (không đụng Payload): `project-queries.ts` quét rồi gọi các hàm ở đây.
 * Quy tắc số đếm (spec "Trang danh sách (khung chung)"): mỗi chiều = số dự án khớp MỌI bộ lọc khác TRỪ chính chiều đó.
 */

/** Các chiều lọc của `/du-an` (đã đối chiếu id / giá trị hợp lệ ở trang). */
export interface ProjectFilterCriteria {
  /** Lọc theo các danh mục này (danh mục + con của nó). Bỏ trống = mọi danh mục. */
  categoryIds?: readonly string[];
  /** Id tỉnh ĐÃ đối chiếu với danh sách tỉnh (OR; BL-052 nhiều tỉnh). Bỏ trống = mọi tỉnh. */
  provinceIds?: readonly string[];
  salesStatus?: SalesStatus;
  /** Từ khoá (BL-045): khớp không dấu tên dự án + địa chỉ / tỉnh / phường. Rỗng = không lọc. */
  q?: string;
  /** Id chủ đầu tư ĐÃ đối chiếu với danh sách chủ đầu tư công khai. */
  developerId?: string;
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

type FilterDimension = "category" | "province" | "status" | "developer" | "type" | "feature" | "price" | "keyword";
type ProjectPredicate = (project: Project) => boolean;
export type ProjectPredicates = Partial<Record<FilterDimension, ProjectPredicate>>;

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
export function compareByPrice(direction: "price_asc" | "price_desc") {
  return (a: Project, b: Project): number => {
    const left = effectivePriceFromVnd(a);
    const right = effectivePriceFromVnd(b);
    if (left === null || right === null) return left === right ? 0 : left === null ? 1 : -1;
    return direction === "price_asc" ? left - right : right - left;
  };
}

/** Mỗi chiều lọc đang bật thành một điều kiện; chiều không bật thì không có (luôn khớp). */
export function buildPredicates(query: ProjectFilterCriteria): ProjectPredicates {
  const predicates: ProjectPredicates = {};
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
export function matcher(predicates: ProjectPredicates, except?: FilterDimension): ProjectPredicate {
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

/** Số đếm mọi chiều trên tập đã quét (không lọc) theo quy tắc "trừ chính chiều đó". */
export function computeFacets(scanned: readonly Project[], predicates: ProjectPredicates): ProjectFacets {
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
