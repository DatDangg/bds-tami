"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import type { RentalFilterOptions } from "@/lib/rentals/rental-list-queries";
import type { RentalFilters as RentalFilterValues } from "@/lib/search/url-params";
import { FilterFields } from "./FilterFields";
import { RentalFilterSheet } from "./RentalFilterSheet";
import { useRentalListNavigation } from "./RentalListNavigation";
import { SortSelect } from "./SortSelect";
import { useLiveDraft } from "./use-rental-draft";

interface RentalFiltersProps {
  /** Bộ lọc đang trên URL (đã bỏ slug lạ): nguồn sự thật. */
  filters: RentalFilterValues;
  options: RentalFilterOptions;
  /** Vào từ nút tìm kiếm của header (`?q=` rỗng): đưa con trỏ vào ô từ khoá đang hiện để gõ ngay. */
  focusSearch?: boolean;
}

/** Hai ô từ khoá (thanh dính mobile, bảng desktop) cùng tồn tại trong DOM; chỉ một ô đang hiện theo breakpoint. */
const SEARCH_INPUT_IDS = ["rental-bar-q", "rental-panel-q"] as const;

/**
 * Bộ lọc `/cho-thue` (design-spec §3.5), Client Component: URL là nguồn sự thật, mỗi lần đổi ô là `router.replace` (`scroll: false`, về trang 1).
 * ≥ lg: bảng lọc 2 hàng áp dụng ngay (gõ chữ/số chờ 300ms). < lg: thanh dính dưới header (từ khoá + "Bộ lọc (n)" + Sắp xếp), bấm "Bộ lọc" mở Sheet.
 * Hai bố cục dùng chung một bản nháp nên ô từ khoá/sắp xếp luôn khớp nhau; phần nào bị ẩn bằng CSS thì không vào cây truy cập.
 */
export function RentalFilters({ filters, options, focusSearch = false }: RentalFiltersProps) {
  const t = useTranslations("page.rentals");
  const { navigate } = useRentalListNavigation();
  const { draft, update } = useLiveDraft(filters, navigate);

  useEffect(() => {
    if (!focusSearch) return;
    const inputs = SEARCH_INPUT_IDS.flatMap((id) => document.getElementById(id) ?? []);
    (inputs.find((input) => input.getClientRects().length > 0) ?? inputs[0])?.focus();
  }, [focusSearch]);
  // Đổi tỉnh ở thanh desktop là đổi URL ngay: phường của tỉnh mới do server trả về (khoá ô phường trong lúc chờ), không cần gọi REST như trong Sheet.
  const wardsLoading = draft.province !== (options.wardsProvince ?? "");

  return (
    <>
      <div role="group" aria-label={t("filtersLabel")} className="sticky top-16 z-(--z-sticky) -mx-gutter flex items-end gap-2 border-b border-border bg-surface px-gutter py-2 lg:hidden">
        <div className="flex min-w-0 flex-1 flex-col">
          <label htmlFor="rental-bar-q" className="sr-only">
            {t("fields.q")}
          </label>
          <Input
            id="rental-bar-q"
            type="search"
            maxLength={100}
            autoComplete="off"
            placeholder={t("fields.qPlaceholder")}
            value={draft.q}
            onChange={(event) => update({ q: event.target.value }, "typing")}
          />
        </div>
        <RentalFilterSheet filters={filters} sort={draft.sort} options={options} />
        <SortSelect id="rental-bar-sort" value={draft.sort} onChange={(sort) => update({ sort }, "now")} showLabel={false} className="w-32 shrink-0" />
      </div>
      <section aria-label={t("filtersLabel")} className="hidden lg:block">
        <FilterFields
          idPrefix="rental-panel"
          layout="panel"
          showSort
          draft={draft}
          options={{ categories: options.categories, provinces: options.provinces, wards: options.wards, wardsLoading }}
          onChange={update}
        />
      </section>
    </>
  );
}
