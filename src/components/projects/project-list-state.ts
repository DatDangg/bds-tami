import type { ProjectFilters, ProjectQueryParams } from "@/lib/projects/project-filters";
import type { ProjectFacets, ProjectPageQuery } from "@/lib/projects/project-queries";
import type { Developer, Province } from "@/payload-types";
import { PROJECT_FEATURES, PROPERTY_TYPES, type ProjectFeature, type PropertyType } from "@/shared/listing-options";
import type { ProjectFilterOptions, ProjectFilterValues } from "./ProjectListBody";

/**
 * Trạng thái lọc của `/du-an` (BL-052) dựng từ bộ lọc đã parse + giá trị đã đối chiếu (tỉnh / chủ đầu tư có thật). Thuần: trang gọi rồi lắp vào component.
 * Một nguồn cho cả truy vấn, tham số link (tab / sắp xếp / phân trang) và giá trị + lựa chọn của các ô lọc.
 */
export interface ResolvedProjectFilters {
  filters: ProjectFilters;
  /** Tỉnh trong URL có thật (slug lạ đã bỏ). */
  provinces: readonly Province[];
  /** Chủ đầu tư trong URL có dự án công khai (id lạ đã bỏ). */
  developer: Developer | undefined;
  /** Danh mục đang lọc: id lọc (danh mục + con). */
  categoryIds: readonly string[] | undefined;
}

/** Truy vấn `listPublicProjects`. */
export function toProjectPageQuery({ filters, provinces, developer, categoryIds }: ResolvedProjectFilters, page: number): ProjectPageQuery {
  return {
    page,
    ...(categoryIds ? { categoryIds } : {}),
    ...(provinces.length > 0 ? { provinceIds: provinces.map((item) => item.id) } : {}),
    ...(filters.status ? { salesStatus: filters.status } : {}),
    ...(filters.q ? { q: filters.q } : {}),
    ...(developer ? { developerId: developer.id } : {}),
    ...(filters.sort ? { sort: filters.sort } : {}),
    ...(filters.types ? { types: filters.types } : {}),
    ...(filters.features ? { features: filters.features } : {}),
    ...(filters.priceMin !== undefined ? { priceMin: filters.priceMin } : {}),
    ...(filters.priceMax !== undefined ? { priceMax: filters.priceMax } : {}),
  };
}

/** Bộ lọc hợp lệ dạng tham số URL (không danh mục / sắp xếp / trang): gốc của link tab, sắp xếp, phân trang, URL khi đổi một ô lọc. */
export function toFilterParams({ filters, provinces, developer }: ResolvedProjectFilters): Omit<ProjectQueryParams, "category" | "page" | "sort"> {
  return {
    ...(provinces.length > 0 ? { province: provinces.map((item) => item.slug) } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.q ? { q: filters.q } : {}),
    ...(developer ? { developer: developer.id } : {}),
    ...(filters.types ? { type: filters.types } : {}),
    ...(filters.features ? { feature: filters.features } : {}),
    ...(filters.priceMin !== undefined ? { priceMin: filters.priceMin } : {}),
    ...(filters.priceMax !== undefined ? { priceMax: filters.priceMax } : {}),
  };
}

export function toFilterValues({ filters, provinces, developer }: ResolvedProjectFilters): ProjectFilterValues {
  return {
    status: filters.status ?? "",
    provinces: provinces.map((item) => item.slug),
    developer: developer?.id ?? "",
    price: [filters.priceMin ?? null, filters.priceMax ?? null],
    types: filters.types ?? [],
    features: filters.features ?? [],
  };
}

interface FilterOptionSources {
  facets: ProjectFacets;
  /** Tỉnh đang chọn (có thể không còn dự án công khai nên không nằm trong `facets.provinces`). */
  selectedProvinces: readonly Province[];
  developers: readonly Developer[];
  typeLabel: (value: PropertyType) => string;
  featureLabel: (value: ProjectFeature) => string;
}

/** Lựa chọn + số đếm "trừ chính chiều đó" của các ô lọc. Tỉnh đang chọn nhưng không còn dự án công khai vẫn hiện (đếm 0) để bỏ tích được. */
export function toFilterOptions({ facets, selectedProvinces, developers, typeLabel, featureLabel }: FilterOptionSources): ProjectFilterOptions {
  const missing = selectedProvinces.filter((item) => !facets.provinces.some((facet) => facet.id === item.id));
  return {
    provinces: [
      ...facets.provinces.map((item) => ({ value: item.slug, label: item.name, count: item.count })),
      ...missing.map((item) => ({ value: item.slug, label: item.shortName || item.name, count: 0 })),
    ],
    developers: developers.flatMap((item) => (item.name ? [{ value: item.id, label: item.name }] : [])),
    types: PROPERTY_TYPES.map((value) => ({ value, label: typeLabel(value), count: facets.type.counts[value] ?? 0 })),
    features: PROJECT_FEATURES.map((value) => ({ value, label: featureLabel(value), count: facets.feature.counts[value] ?? 0 })),
  };
}
