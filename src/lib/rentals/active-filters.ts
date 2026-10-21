import type { RentalAmenity } from "../../shared/types/api";
import type { RentalFilters } from "../search/url-params";

/** Một chip cho MỖI tiện ích đang lọc (bỏ từng cái): `amenity:<key>`. */
export type AmenityFilterKind = `amenity:${RentalAmenity}`;

/** Loại điều kiện hiện thành một chip "Đang lọc"; mỗi loại bỏ đi một nhóm tham số URL. */
export type ActiveFilterKind = "q" | "category" | "province" | "ward" | "project" | "price" | "area" | "bedrooms" | "furnishing" | AmenityFilterKind;

/** Thứ tự chip: giống thứ tự ô trên bộ lọc (tiện ích nối sau, theo thứ tự trong URL). */
const KIND_ORDER = ["q", "category", "province", "ward", "project", "price", "area", "bedrooms", "furnishing"] as const;

const AMENITY_PREFIX = "amenity:";

const isAmenityKind = (kind: ActiveFilterKind): kind is AmenityFilterKind => kind.startsWith(AMENITY_PREFIX);

/** `amenity:pool` → `pool`; loại khác → `null`. */
export function amenityOfKind(kind: ActiveFilterKind): RentalAmenity | null {
  return isAmenityKind(kind) ? (kind.slice(AMENITY_PREFIX.length) as RentalAmenity) : null;
}

const isActive = (filters: RentalFilters, kind: (typeof KIND_ORDER)[number]): boolean => {
  switch (kind) {
    case "price":
      return filters.priceMin !== undefined || filters.priceMax !== undefined;
    case "area":
      return filters.areaMin !== undefined || filters.areaMax !== undefined;
    default:
      return filters[kind] !== undefined;
  }
};

/** Các điều kiện lọc đang bật theo thứ tự hiển thị (phường chỉ có khi có tỉnh nên không cần kiểm riêng). */
export function activeFilterKinds(filters: RentalFilters): ActiveFilterKind[] {
  const groups: ActiveFilterKind[] = KIND_ORDER.filter((kind) => isActive(filters, kind));
  const amenities: ActiveFilterKind[] = (filters.amenities ?? []).map((amenity) => `${AMENITY_PREFIX}${amenity}` as const);
  return [...groups, ...amenities];
}

/** Bộ lọc sau khi bỏ một chip. Bỏ tỉnh thì bỏ luôn phường (phường chỉ có nghĩa trong tỉnh); bỏ tiện ích cuối thì bỏ khoá; luôn về trang 1. */
export function filtersWithout(filters: RentalFilters, kind: ActiveFilterKind): RentalFilters {
  const next: RentalFilters = { ...filters, page: 1 };
  if (isAmenityKind(kind)) {
    const amenity = amenityOfKind(kind);
    const remaining = (filters.amenities ?? []).filter((item) => item !== amenity);
    if (remaining.length > 0) next.amenities = remaining;
    else delete next.amenities;
    return next;
  }
  switch (kind) {
    case "price":
      delete next.priceMin;
      delete next.priceMax;
      break;
    case "area":
      delete next.areaMin;
      delete next.areaMax;
      break;
    case "province":
      delete next.province;
      delete next.ward;
      break;
    default:
      delete next[kind];
  }
  return next;
}
