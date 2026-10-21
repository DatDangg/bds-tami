import type { ListingCategoryTab } from "@/components/listing/ListingCategoryTabs";
import type { ActiveFilterSpec, RawListingParams } from "@/components/listing/listing-params";
import { projectCategoryIcon } from "@/components/projects/project-category-icon";
import type { PostFilters } from "@/lib/posts/post-filters";
import type { PostChip } from "@/lib/posts/post-listing";
import type { PostFacets } from "@/lib/posts/post-queries";
import { DIRECTIONS, HANDOVER_CONDITIONS, PROPERTY_TYPES, type Direction, type HandoverCondition, type PropertyType } from "@/shared/listing-options";
import type { PostFilterOptions, PostFilterValues } from "./PostListBody";

/**
 * Trạng thái lọc của `/tin-bds` + trang danh mục (BL-052) dựng từ bộ lọc ĐÃ đối chiếu (`loadPostListing().filters`). Thuần: trang gọi rồi lắp vào component,
 * cùng vai trò `rental-list-state.ts` / `project-list-state.ts`.
 */

/** Badge "Bộ lọc" (< lg): các ô trong thẻ lọc. Danh mục là tab, từ khoá ở hero, sắp xếp ở hàng kết quả: không tính. */
export const POST_ACTIVE_FILTER_SPEC: ActiveFilterSpec = {
  single: ["bedrooms"],
  multi: ["type", "province", "direction", "handover"],
  ranges: [
    ["priceMin", "priceMax"],
    ["areaMin", "areaMax"],
  ],
};

/** Tham số không có ô trong thẻ lọc: input ẩn của form GET không JS (danh mục `?category=` của link cũ, từ khoá ở hero, sắp xếp ở hàng kết quả). */
const HIDDEN_PARAMS = ["category", "q", "sort"];

/**
 * Bộ lọc + sắp xếp hợp lệ trên URL dạng tham số (không `page`), theo thứ tự `postQueryString`: gốc để dựng URL khi đổi một ô lọc / sắp xếp / trang.
 * `legacyCategory` = slug của `/tin-bds?category=<slug>` (link cũ) đã đối chiếu: giữ trên URL để đổi ô lọc vẫn trong danh mục đó.
 */
export function toCurrentParams(query: string, legacyCategory?: string): Record<string, string> {
  return { ...Object.fromEntries(new URLSearchParams(query)), ...(legacyCategory ? { category: legacyCategory } : {}) };
}

export function toPreservedParams(current: RawListingParams): Record<string, string> {
  return Object.fromEntries(Object.entries(current).flatMap(([key, value]) => (HIDDEN_PARAMS.includes(key) && typeof value === "string" ? [[key, value]] : [])));
}

/** `?a=b&c=d,e` từ tham số hiện tại (+ `page` > 1); dấu phẩy giữ nguyên như `postQueryString`. Rỗng → `""`. */
export function toQueryString(current: Record<string, string>, page = 1): string {
  const search = new URLSearchParams(current);
  if (page > 1) search.set("page", String(page));
  const query = search.toString().replaceAll("%2C", ",");
  return query ? `?${query}` : "";
}

export function toFilterValues(filters: PostFilters): PostFilterValues {
  return {
    types: filters.types ?? [],
    provinces: filters.provinceSlugs ?? [],
    price: [filters.priceMin ?? null, filters.priceMax ?? null],
    area: [filters.areaMin ?? null, filters.areaMax ?? null],
    bedrooms: filters.bedrooms === undefined ? "" : String(filters.bedrooms),
    directions: filters.directions ?? [],
    handovers: filters.handovers ?? [],
  };
}

interface OptionLabels {
  type: (value: PropertyType) => string;
  direction: (value: Direction) => string;
  handover: (value: HandoverCondition) => string;
}

/**
 * Lựa chọn + số đếm "trừ chính chiều đó" của các ô tích (quyết định user: ô tích có số; chip Phòng ngủ không). Tỉnh: chỉ tỉnh có ≥ 1 tin công khai;
 * tỉnh đang chọn mà không còn tin (đã đối chiếu là tỉnh có thật) vẫn hiện, đếm 0, để bỏ tích được.
 */
export function toFilterOptions(facets: PostFacets, selectedProvinces: readonly { slug: string; name: string }[], labels: OptionLabels): PostFilterOptions {
  const missing = selectedProvinces.filter((province) => !facets.provinces.some((facet) => facet.slug === province.slug));
  return {
    types: PROPERTY_TYPES.map((value) => ({ value, label: labels.type(value), count: facets.type.counts[value] ?? 0 })),
    provinces: [...facets.provinces.map((item) => ({ value: item.slug, label: item.name, count: item.count })), ...missing.map((province) => ({ value: province.slug, label: province.name, count: 0 }))],
    directions: DIRECTIONS.map((value) => ({ value, label: labels.direction(value), count: facets.direction.counts[value] ?? 0 })),
    handovers: HANDOVER_CONDITIONS.map((value) => ({ value, label: labels.handover(value), count: facets.handover.counts[value] ?? 0 })),
  };
}

interface TabSources {
  chips: readonly PostChip[];
  facets: PostFacets;
  /** "28 tin". */
  countLabel: (count: number) => string;
  /** Chuỗi tham số lọc khác (không danh mục, về trang 1) nối vào link tab: đổi tab giữ bộ lọc. */
  query: string;
}

/** Tab danh mục (link route danh mục, `aria-current` theo `PostChip.current`) + số đếm "trừ chiều danh mục" + icon theo slug danh mục. */
export function buildPostTabs({ chips, facets, countLabel, query }: TabSources): ListingCategoryTab[] {
  return chips.map((chip, index) => ({
    key: chip.countId ?? `all-${index}`,
    href: `${chip.href}${query}`,
    label: chip.label,
    countLabel: countLabel(chip.countId === null ? facets.category.all : (facets.category.counts[chip.countId] ?? 0)),
    ...(chip.slug === null ? {} : { icon: projectCategoryIcon(chip.slug) }),
    ...(chip.current ? { current: true } : {}),
  }));
}
