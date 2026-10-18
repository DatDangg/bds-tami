import type { RentalFilters } from "../search/url-params";

/** Loại điều kiện hiện thành một chip "Đang lọc"; mỗi loại bỏ đi một nhóm tham số URL. */
export type ActiveFilterKind = "q" | "category" | "province" | "ward" | "price" | "area" | "bedrooms" | "furnishing";

/** Thứ tự chip: giống thứ tự ô trên bộ lọc. */
const KIND_ORDER: readonly ActiveFilterKind[] = ["q", "category", "province", "ward", "price", "area", "bedrooms", "furnishing"];

const isActive = (filters: RentalFilters, kind: ActiveFilterKind): boolean => {
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
  return KIND_ORDER.filter((kind) => isActive(filters, kind));
}

/** Bộ lọc sau khi bỏ một chip. Bỏ tỉnh thì bỏ luôn phường (phường chỉ có nghĩa trong tỉnh); luôn về trang 1. */
export function filtersWithout(filters: RentalFilters, kind: ActiveFilterKind): RentalFilters {
  const next: RentalFilters = { ...filters, page: 1 };
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
