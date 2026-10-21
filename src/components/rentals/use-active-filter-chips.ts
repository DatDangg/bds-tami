import { useLocale, useTranslations } from "next-intl";
import { formatNumber, formatVndCompact } from "@/lib/format";
import { type ActiveFilterKind, type AmenityFilterKind, activeFilterKinds, amenityOfKind, filtersWithout } from "@/lib/rentals/active-filters";
import type { RentalFilterOptions } from "@/lib/rentals/rental-list-queries";
import { type RentalFilters, rentalListQueryString } from "@/lib/search/url-params";
import type { Locale } from "@/i18n/routing";

interface ActiveFilterChipsInput {
  filters: RentalFilters;
  options: RentalFilterOptions;
  /** Đường dẫn công khai của chính trang (đã có tiền tố ngôn ngữ). */
  listPath: string;
  /** Tối đa bao nhiêu mục; bỏ trống = tất cả. */
  limit?: number;
}

/**
 * Từng điều kiện lọc đang bật: nhãn + link thật tới URL đã bỏ điều kiện đó. Dùng cho gợi ý "bỏ bớt điều kiện" của trạng thái trống `/cho-thue`
 * (BL-052 bỏ hàng chip "Đang lọc": thẻ lọc trái / Sheet đã hiện mọi lựa chọn đang bật + "Xoá tất cả", như `/du-an`). Hook next-intl: gọi trong component.
 */
export function useActiveFilterChips({ filters, options, listPath, limit }: ActiveFilterChipsInput) {
  const t = useTranslations("page.rentals");
  const locale = useLocale() as Locale;
  const money = (value: number) => formatVndCompact(value, locale);
  const range = (min: number | undefined, max: number | undefined, format: (value: number) => string) => {
    if (min !== undefined && max !== undefined) return t("active.range", { from: format(min), to: format(max) });
    return min !== undefined ? t("active.from", { value: format(min) }) : t("active.to", { value: format(max ?? 0) });
  };
  // Nhóm không phải tiện ích: `switch` kín (TS báo lỗi khi thêm loại mới mà quên nhãn).
  const groupName = (kind: Exclude<ActiveFilterKind, AmenityFilterKind>): string => {
    switch (kind) {
      case "q":
        return t("active.query", { value: `“${filters.q}”` });
      case "category":
        return options.categories.find((item) => item.slug === filters.category)?.label ?? "";
      case "province":
        return options.provinces.find((item) => item.slug === filters.province)?.name ?? "";
      case "ward":
        return options.wards.find((item) => item.slug === filters.ward)?.name ?? "";
      case "project":
        return t("activeProject", { value: options.projects.find((item) => item.slug === filters.project)?.title ?? "" });
      case "price":
        return t("active.price", { value: range(filters.priceMin, filters.priceMax, money) });
      case "area":
        return t("active.area", { value: range(filters.areaMin, filters.areaMax, (value) => `${formatNumber(value, locale)} m²`) });
      case "bedrooms":
        return t("active.bedrooms", { value: t(`bedroomsOption.${filters.bedrooms ?? 1}`) });
      case "furnishing":
        return t("active.furnishing", { value: t(`furnishingOption.${filters.furnishing ?? "none"}`) });
    }
  };
  const nameOf = (kind: ActiveFilterKind): string => {
    const amenity = amenityOfKind(kind);
    if (amenity !== null) return t("active.amenity", { value: t(`amenityOption.${amenity}`) });
    return groupName(kind as Exclude<ActiveFilterKind, AmenityFilterKind>);
  };
  const kinds = activeFilterKinds(filters).slice(0, limit);
  return kinds.map((kind) => ({
    kind,
    name: nameOf(kind),
    href: `${listPath}${rentalListQueryString(filtersWithout(filters, kind))}`,
  }));
}
