"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useEffect } from "react";
import { useMediaQuery } from "@/components/layout/use-environment";
import { useReportPending } from "@/components/layout/PendingRegion";
import { ListOptionCell, ListSearchBar } from "@/components/listing/ListSearchBar";
import { OptionSelect } from "@/components/ui/option-select";
import type { RentalFilterOptions } from "@/lib/rentals/rental-list-queries";
import { AREA_HINT_RANGES, type RentalFilters as RentalFilterValues, rentalListQueryString, secondaryFilterCount } from "@/lib/search/url-params";
import { RENTAL_AMENITIES, RENTAL_FURNISHINGS } from "@/shared/types/api";
import { AmenityMultiSelect } from "./AmenityMultiSelect";
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
  /** Trang danh mục (S05): slug danh mục bị khoá; số đếm "Xem n tin" của Sheet vẫn phải tính theo danh mục này. */
  fixedCategory?: string | undefined;
  /** Hàng 2 "Danh mục" (chip link do server dựng): nằm GIỮA ô từ khoá và hàng "Tùy chọn khác" nhưng cùng một form. */
  categoryRow?: ReactNode;
}

const KEYWORD_INPUT_ID = "rental-bar-q";
/** ≥ lg: Popover; ít hơn: Sheet. Trước hydrate `useMediaQuery` = false nên server/lượt đầu luôn là Sheet. */
const DESKTOP_QUERY = "(min-width: 1024px)";
const BEDROOM_VALUES = ["1", "2", "3", "4"] as const;

const rangeValue = (min: string, max: string) => (min === "" && max === "" ? "" : `${min}-${max}`);
const splitRange = (range: string): [string, string] => {
  const [min = "", max = ""] = range.split("-");
  return [min, max];
};

type Translate = ReturnType<typeof useTranslations>;

/** Mục của ô khoảng (giá/diện tích): mốc gợi ý + (nếu URL đang có khoảng tự nhập không trùng mốc nào) một mục hiện khoảng đó để ô không nói sai. */
function rangeOptions(hints: { value: string; label: string }[], current: string, firstLabel: string, customLabel: string) {
  const custom = current !== "" && !hints.some((hint) => hint.value === current) ? [{ value: current, label: customLabel }] : [];
  return [{ value: "", label: firstLabel }, ...hints, ...custom];
}

function priceOptions(draft: FilterDraft, t: Translate) {
  const hints = PRICE_HINTS.map((hint) => ({ value: rangeValue(hint.min, hint.max), label: t(`priceHints.${hint.key}`) }));
  const current = rangeValue(draft.priceMin, draft.priceMax);
  return { current, options: rangeOptions(hints, current, t("chips.price"), t("fields.priceCustom")) };
}

function areaOptions(draft: FilterDraft, t: Translate, tHints: Translate) {
  const hints = AREA_HINT_RANGES.map((hint) => ({ value: rangeValue(hint.min === undefined ? "" : String(hint.min), hint.max === undefined ? "" : String(hint.max)), label: tHints(`areaHints.${hint.key}`) }));
  const current = rangeValue(draft.areaMin, draft.areaMax);
  return { current, options: rangeOptions(hints, current, t("chips.area"), t("chips.areaCustom")) };
}

/**
 * Tham số trên URL mà thẻ lọc KHÔNG có ô để gửi khi form GET không JS: danh mục (`?category=` ở `/cho-thue`), khoảng giá/diện tích, phường, tiện ích, sắp xếp.
 * Từ khoá và các ô chọn có tên (`province`, `bedrooms`, `furnishing`) tự gửi nên bỏ ra (tránh gửi trùng).
 */
function preservedParams(filters: RentalFilterValues): Record<string, string> {
  const query = rentalListQueryString({ ...filters, page: 1 }).slice(1);
  const params = Object.fromEntries(new URLSearchParams(query));
  for (const name of ["q", "province", "bedrooms", "furnishing"]) delete params[name];
  return params;
}

/**
 * Thẻ lọc nổi của `/cho-thue` + danh mục (BL-045, design-spec S04), Client Component: URL là nguồn sự thật, mỗi lần đổi ô là `router.replace` (`scroll: false`, về trang 1).
 * Hàng 1 từ khoá + "Tìm kiếm"; hàng 2 chip danh mục (link, do trang truyền qua `categoryRow`); hàng 3 "Tùy chọn khác": Khu vực · Mức giá · Diện tích · Phòng ngủ · Nội thất · Tiện ích (chọn nhiều)
 * + nút "Bộ lọc (n)" (Popover ≥ lg / Sheet < lg: phường + khoảng giá/diện tích tự nhập). Chọn ô áp dụng ngay, gõ chữ chờ 300ms, "Tìm kiếm" áp dụng tức thì; không JS thì form GET thật
 * gửi cùng tên tham số (`q`, `province`, `bedrooms`, `furnishing`; mốc giá/diện tích và tiện ích cần JS như trước).
 */
export function RentalFilters({ filters, options, focusSearch = false, fixedCategory, categoryRow }: RentalFiltersProps) {
  const t = useTranslations("page.rentals");
  const tHints = useTranslations("page.home.search");
  const { actionPath, pending, draft, update, submit } = useRentalListNavigation();
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const activeCount = secondaryFilterCount(filters);
  const price = priceOptions(draft, t);
  const area = areaOptions(draft, t, tHints);
  // Đổi tỉnh ở Popover là đổi URL ngay: phường của tỉnh mới do server trả về (khoá ô phường trong lúc chờ), không cần gọi REST như trong Sheet.
  const wardsLoading = draft.province !== (options.wardsProvince ?? "");
  useReportPending(pending);

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
      categoryRow={categoryRow}
      moreLabel={t("moreLabel")}
      filtersSlot={
        isDesktop ? (
          <RentalFilterPopover draft={draft} onChange={update} options={{ wards: options.wards, wardsLoading }} activeCount={activeCount} />
        ) : (
          <RentalFilterSheet filters={filters} options={options} fixedCategory={fixedCategory} />
        )
      }
    >
      <ListOptionCell>
        <OptionSelect
          progressive
          variant="chip"
          id="rental-bar-province"
          name="province"
          aria-label={t("fields.province")}
          value={draft.province}
          onValueChange={(province) => update({ province, ward: "" }, "now")}
          options={[{ value: "", label: t("chips.province") }, ...options.provinces.map((province) => ({ value: province.slug, label: province.name }))]}
          className="w-full"
        />
      </ListOptionCell>
      <ListOptionCell>
        <OptionSelect
          progressive
          variant="chip"
          id="rental-bar-price"
          aria-label={t("fields.price")}
          value={price.current}
          onValueChange={(range) => {
            const [priceMin, priceMax] = splitRange(range);
            update({ priceMin, priceMax }, "now");
          }}
          options={price.options}
          className="w-full"
        />
      </ListOptionCell>
      <ListOptionCell>
        <OptionSelect
          progressive
          variant="chip"
          id="rental-bar-area"
          aria-label={t("fields.area")}
          value={area.current}
          onValueChange={(range) => {
            const [areaMin, areaMax] = splitRange(range);
            update({ areaMin, areaMax }, "now");
          }}
          options={area.options}
          className="w-full"
        />
      </ListOptionCell>
      <ListOptionCell>
        <OptionSelect
          progressive
          variant="chip"
          id="rental-bar-bedrooms"
          name="bedrooms"
          aria-label={t("fields.bedrooms")}
          value={draft.bedrooms}
          onValueChange={(bedrooms) => update({ bedrooms }, "now")}
          options={[{ value: "", label: t("chips.bedrooms") }, ...BEDROOM_VALUES.map((value) => ({ value, label: t("chips.bedroomsValue", { value: t(`bedroomsOption.${value}`) }) }))]}
          className="w-full"
        />
      </ListOptionCell>
      <ListOptionCell>
        <OptionSelect
          progressive
          variant="chip"
          id="rental-bar-furnishing"
          name="furnishing"
          aria-label={t("fields.furnishing")}
          value={draft.furnishing}
          onValueChange={(furnishing) => update({ furnishing }, "now")}
          options={[{ value: "", label: t("chips.furnishing") }, ...RENTAL_FURNISHINGS.map((value) => ({ value, label: t(`furnishingOption.${value}`) }))]}
          className="w-full"
        />
      </ListOptionCell>
      <ListOptionCell>
        <AmenityMultiSelect
          label={t("fields.amenities")}
          selectedLabel={t("chips.amenitiesCount", { count: draft.amenities.length })}
          options={RENTAL_AMENITIES.map((value) => ({ value, label: t(`amenityOption.${value}`) }))}
          selected={draft.amenities}
          onChange={(amenities) => update({ amenities }, "now")}
        />
      </ListOptionCell>
    </ListSearchBar>
  );
}
