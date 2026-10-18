import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { X } from "@/components/icons";
import { formatNumber, formatVndCompact } from "@/lib/format";
import { type ActiveFilterKind, activeFilterKinds, filtersWithout } from "@/lib/rentals/active-filters";
import type { RentalFilterOptions } from "@/lib/rentals/rental-list-queries";
import { type RentalFilters, rentalListQueryString } from "@/lib/search/url-params";
import type { Locale } from "@/i18n/routing";

interface ActiveFiltersProps {
  filters: RentalFilters;
  options: RentalFilterOptions;
  /** Đường dẫn công khai của chính trang (đã có tiền tố ngôn ngữ). */
  listPath: string;
  /** Tối đa bao nhiêu chip (trạng thái trống chỉ gợi ý vài thao tác đầu); bỏ trống = tất cả. */
  limit?: number;
}

/** Chip "Đang lọc" của một điều kiện: nhãn hiển thị + tên cho `aria-label="Bỏ lọc <tên>"` + bộ lọc sau khi bỏ nó. Server Component, mọi chip là link thật (không cần JS). */
export function useActiveFilterChips({ filters, options, listPath, limit }: ActiveFiltersProps) {
  const t = useTranslations("page.rentals");
  const locale = useLocale() as Locale;
  const money = (value: number) => formatVndCompact(value, locale);
  const range = (min: number | undefined, max: number | undefined, format: (value: number) => string) => {
    if (min !== undefined && max !== undefined) return t("active.range", { from: format(min), to: format(max) });
    return min !== undefined ? t("active.from", { value: format(min) }) : t("active.to", { value: format(max ?? 0) });
  };
  const nameOf = (kind: ActiveFilterKind): string => {
    switch (kind) {
      case "q":
        return t("active.query", { value: `“${filters.q}”` });
      case "category":
        return options.categories.find((item) => item.slug === filters.category)?.label ?? "";
      case "province":
        return options.provinces.find((item) => item.slug === filters.province)?.name ?? "";
      case "ward":
        return options.wards.find((item) => item.slug === filters.ward)?.name ?? "";
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
  const kinds = activeFilterKinds(filters).slice(0, limit);
  return kinds.map((kind) => ({
    kind,
    name: nameOf(kind),
    href: `${listPath}${rentalListQueryString(filtersWithout(filters, kind))}`,
  }));
}

/** Hàng "Đang lọc": chip từng điều kiện có nút xoá + "Xoá tất cả" (design-spec §3.5). Không có điều kiện thì không render. */
export function ActiveFilters(props: ActiveFiltersProps) {
  const t = useTranslations("page.rentals.active");
  const chips = useActiveFilterChips(props);
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-small font-semibold">{t("label")}</span>
      <ul className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <li key={chip.kind}>
            <Link
              href={chip.href}
              scroll={false}
              aria-label={t("remove", { name: chip.name })}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface px-4 text-small font-semibold hover:border-input-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              {chip.name}
              <X size={14} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
      <Link href={props.listPath} scroll={false} className="inline-flex min-h-11 items-center px-2 text-small font-semibold underline underline-offset-4">
        {t("clearAll")}
      </Link>
    </div>
  );
}
