import type { ListingCategoryTab } from "@/components/listing/ListingCategoryTabs";
import type { ActiveFilterSpec, RawListingParams } from "@/components/listing/listing-params";
import { projectCategoryIcon } from "@/components/projects/project-category-icon";
import type { RentalFilterOptions, RentalProvinceFacet } from "@/lib/rentals/rental-list-queries";
import type { RentalListingFacets } from "@/lib/search/search-service";
import { type RentalFilters, rentalListQueryString } from "@/lib/search/url-params";
import type { RentalFilterOptionsView, RentalFilterValues } from "./RentalListBody";

/**
 * Trạng thái lọc của `/cho-thue` + trang danh mục (BL-052) dựng từ bộ lọc đã đối chiếu (`dropUnknownSlugs`). Thuần: trang gọi rồi lắp vào component,
 * cùng vai trò `project-list-state.ts` của `/du-an`.
 */

/** Badge "Bộ lọc" (< lg): các ô trong thẻ lọc. Danh mục là tab, từ khoá ở hero, sắp xếp ở hàng kết quả: không tính. */
export const RENTAL_ACTIVE_FILTER_SPEC: ActiveFilterSpec = {
  single: ["province", "ward", "project", "bedrooms", "bathrooms", "furnishing"],
  multi: ["amenities"],
  ranges: [
    ["priceMin", "priceMax"],
    ["areaMin", "areaMax"],
  ],
};

/** Tham số không có ô trong thẻ lọc: input ẩn của form GET không JS (danh mục dạng `?category=` của link cũ, từ khoá ở hero, sắp xếp ở hàng kết quả). */
const HIDDEN_PARAMS = ["category", "q", "sort"];

/** Bộ lọc + sắp xếp hợp lệ đang trên URL dạng tham số (không `page`): gốc để dựng URL khi đổi một ô lọc. */
export function toCurrentParams(filters: RentalFilters): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(rentalListQueryString({ ...filters, page: 1 })));
}

export function toPreservedParams(current: RawListingParams): Record<string, string> {
  return Object.fromEntries(Object.entries(current).flatMap(([key, value]) => (HIDDEN_PARAMS.includes(key) && typeof value === "string" ? [[key, value]] : [])));
}

export function toFilterValues(filters: RentalFilters): RentalFilterValues {
  return {
    province: filters.province ?? "",
    ward: filters.ward ?? "",
    project: filters.project ?? "",
    price: [filters.priceMin ?? null, filters.priceMax ?? null],
    area: [filters.areaMin ?? null, filters.areaMax ?? null],
    bedrooms: filters.bedrooms === undefined ? "" : String(filters.bedrooms),
    bathrooms: filters.bathrooms === undefined ? "" : String(filters.bathrooms),
    furnishing: filters.furnishing ?? "",
    amenities: filters.amenities ?? [],
  };
}

/**
 * Lựa chọn của các ô lọc. Tỉnh: chỉ tỉnh có ≥ 1 tin (`provinceFacets`, số đếm "trừ chiều tỉnh"); tỉnh đang chọn mà không còn tin vẫn hiện (đếm 0) để bỏ chọn được.
 * Phường: của tỉnh trên URL (server đã tải). Dự án: dự án có tin công khai còn trống. Tiện ích: số đếm "trừ chiều tiện ích" (`null` = truy vấn lỗi → không số).
 */
export function toFilterOptions(
  options: RentalFilterOptions,
  provinceFacets: readonly RentalProvinceFacet[],
  selectedProvince: string | undefined,
  amenityCounts: RentalListingFacets["amenities"] | null,
): RentalFilterOptionsView {
  const selected = selectedProvince && !provinceFacets.some((item) => item.slug === selectedProvince) ? options.provinces.find((item) => item.slug === selectedProvince) : undefined;
  return {
    provinces: [...provinceFacets.map((item) => ({ value: item.slug, label: item.name, count: item.count })), ...(selected ? [{ value: selected.slug, label: selected.name, count: 0 }] : [])],
    wards: options.wards.map((ward) => ({ value: ward.slug, label: ward.name })),
    projects: options.projects.map((project) => ({ value: project.slug, label: project.title })),
    ...(amenityCounts ? { amenityCounts } : {}),
  };
}

interface TabSources {
  options: RentalFilterOptions;
  /** `null` khi truy vấn lỗi: tab vẫn hiện, không có dòng số. */
  facets: RentalListingFacets | null;
  /** Slug danh mục đang xem (route danh mục, hoặc `?category=` của link cũ). */
  currentSlug: string | undefined;
  allLabel: string;
  /** "28 căn". */
  countLabel: (count: number) => string;
  /** Link tab: `undefined` = "Tất cả" (`/cho-thue`), slug = route danh mục; đã giữ các lọc khác, về trang 1. */
  href: (slug?: string) => string;
}

/**
 * Tab "Tất cả" + danh mục cấp 1 (BL-052, đóng vai "Loại hình"): link route danh mục như hiện tại, số đếm "trừ chiều danh mục", icon theo slug.
 * Tab của danh mục cha được đánh dấu cả khi đang ở danh mục con của nó (`options.categories` xếp cha rồi các con).
 */
export function buildCategoryTabs({ options, facets, currentSlug, allLabel, countLabel, href }: TabSources): ListingCategoryTab[] {
  const roots = options.categories.filter((item) => item.depth === 0);
  if (roots.length === 0) return [];
  const currentIndex = options.categories.findIndex((item) => item.slug === currentSlug);
  const currentRoot = currentIndex < 0 ? undefined : options.categories.slice(0, currentIndex + 1).reverse().find((item) => item.depth === 0);
  const count = (value: number | undefined) => (facets ? { countLabel: countLabel(value ?? 0) } : {});
  return [
    { key: "all", href: href(), label: allLabel, ...count(facets?.category.all), current: currentRoot === undefined },
    ...roots.map((root) => ({
      key: root.id,
      href: href(root.slug),
      label: root.label,
      ...count(facets?.category.counts[root.id]),
      icon: projectCategoryIcon(root.slug),
      current: root.slug === currentRoot?.slug,
    })),
  ];
}
