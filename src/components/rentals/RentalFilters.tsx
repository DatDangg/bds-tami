"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useMediaQuery } from "@/components/home/use-environment";
import { ListSearchBar, ListSearchField } from "@/components/listing/ListSearchBar";
import { OptionSelect } from "@/components/ui/option-select";
import type { RentalFilterOptions } from "@/lib/rentals/rental-list-queries";
import { type RentalFilters as RentalFilterValues, rentalListQueryString, secondaryFilterCount } from "@/lib/search/url-params";
import { PRICE_HINTS } from "./FilterFields";
import { RentalFilterPopover } from "./RentalFilterPopover";
import { RentalFilterSheet } from "./RentalFilterSheet";
import { useRentalListNavigation } from "./RentalListNavigation";
import type { FilterDraft } from "./use-rental-draft";

interface RentalFiltersProps {
  /** Bộ lọc đang trên URL (đã bỏ slug lạ): nguồn sự thật. */
  filters: RentalFilterValues;
  options: RentalFilterOptions;
  /** Vào từ nút tìm kiếm của header (`?q=` rỗng): đưa con trỏ vào ô từ khoá để gõ ngay. */
  focusSearch?: boolean;
  /** Trang danh mục (S05): slug danh mục bị khoá. `options.categories` rỗng nên không có ô Loại; số đếm "Xem n tin" của Sheet vẫn phải tính theo danh mục này. */
  fixedCategory?: string | undefined;
}

const KEYWORD_INPUT_ID = "rental-bar-q";
/** ≥ lg: Popover; ít hơn: Sheet. Trước hydrate `useMediaQuery` = false nên server/lượt đầu luôn là Sheet. */
const DESKTOP_QUERY = "(min-width: 1024px)";

const rangeValue = (min: string, max: string) => (min === "" && max === "" ? "" : `${min}-${max}`);

/** Mục "Khoảng giá": mốc gợi ý + (nếu URL đang có khoảng tự nhập không trùng mốc nào) một mục hiện khoảng đó để ô không nói sai. */
function priceOptions(draft: FilterDraft, t: ReturnType<typeof useTranslations>) {
  const hints = PRICE_HINTS.map((hint) => ({ value: rangeValue(hint.min, hint.max), label: t(`priceHints.${hint.key}`) }));
  const current = rangeValue(draft.priceMin, draft.priceMax);
  const custom = current !== "" && !hints.some((hint) => hint.value === current) ? [{ value: current, label: t("fields.priceCustom") }] : [];
  return { current, options: [{ value: "", label: t("fields.priceAny") }, ...hints, ...custom] };
}

/** Tham số trên URL mà băng không có ô (lọc phụ, giá, sắp xếp): giữ lại khi form GET gửi không JS. */
function preservedParams(filters: RentalFilterValues): Record<string, string> {
  const query = rentalListQueryString({ ...filters, page: 1 }).slice(1);
  const params = Object.fromEntries(new URLSearchParams(query));
  delete params.q;
  delete params.category;
  return params;
}

/**
 * Băng tìm kiếm + lọc phụ của `/cho-thue` (design-spec S04), Client Component: URL là nguồn sự thật, mỗi lần đổi ô là `router.replace` (`scroll: false`, về trang 1).
 * Băng (ListSearchBar): từ khoá + Loại (danh mục) + Khoảng giá + "Tìm kiếm" + "Bộ lọc (n)". Chọn ô áp dụng ngay, gõ chữ chờ 300ms, "Tìm kiếm" áp dụng tức thì;
 * không JS thì form GET thật gửi cùng tên tham số. "Bộ lọc" mở Popover (≥ lg, áp dụng ngay) hoặc Sheet (< lg, áp dụng khi bấm "Xem n tin").
 */
export function RentalFilters({ filters, options, focusSearch = false, fixedCategory }: RentalFiltersProps) {
  const t = useTranslations("page.rentals");
  const { actionPath, draft, update, submit } = useRentalListNavigation();
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const activeCount = secondaryFilterCount(filters);
  const price = priceOptions(draft, t);
  // Đổi tỉnh ở Popover là đổi URL ngay: phường của tỉnh mới do server trả về (khoá ô phường trong lúc chờ), không cần gọi REST như trong Sheet.
  const wardsLoading = draft.province !== (options.wardsProvince ?? "");

  useEffect(() => {
    if (focusSearch) document.getElementById(KEYWORD_INPUT_ID)?.focus();
  }, [focusSearch]);

  return (
    <ListSearchBar
      action={actionPath}
      label={t("searchBarLabel")}
      keyword={{ id: KEYWORD_INPUT_ID, name: "q", label: t("fields.q"), placeholder: t("fields.qPlaceholder"), value: draft.q, onChange: (q) => update({ q }, "typing") }}
      submitLabel={t("search")}
      onSubmit={submit}
      preservedParams={preservedParams(filters)}
      filtersSlot={
        isDesktop ? (
          <RentalFilterPopover draft={draft} onChange={update} options={{ provinces: options.provinces, wards: options.wards, wardsLoading }} activeCount={activeCount} />
        ) : (
          <RentalFilterSheet filters={filters} options={options} fixedCategory={fixedCategory} />
        )
      }
    >
      {/* Trang danh mục (S05) truyền danh sách rỗng: danh mục đã khoá, đổi danh mục = sang trang khác bằng chip. */}
      {options.categories.length > 0 && (
        <ListSearchField label={t("fields.category")} htmlFor="rental-bar-category">
          <OptionSelect
            progressive
            id="rental-bar-category"
            name="category"
            value={draft.category}
            onValueChange={(category) => update({ category }, "now")}
            options={[
              { value: "", label: t("fields.allCategories") },
              ...options.categories.map((category) => ({ value: category.slug, label: category.depth === 1 ? `– ${category.label}` : category.label })),
            ]}
            className="rounded-md"
          />
        </ListSearchField>
      )}
      <ListSearchField label={t("fields.price")} htmlFor="rental-bar-price">
        <OptionSelect
          progressive
          id="rental-bar-price"
          value={price.current}
          onValueChange={(range) => {
            const [priceMin = "", priceMax = ""] = range.split("-");
            update({ priceMin, priceMax }, "now");
          }}
          options={price.options}
          className="rounded-md"
        />
      </ListSearchField>
    </ListSearchBar>
  );
}
