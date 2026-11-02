"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { PendingRegion } from "@/components/layout/PendingRegion";
import { CheckboxFacetList, ChipChoice, type FacetOption, FilterGroup } from "@/components/listing/FilterFacets";
import { FilterSheet, FilterSidebar } from "@/components/listing/FilterPanel";
import type { RawListingParams } from "@/components/listing/listing-params";
import { RangeSliderFacet, type RangeValue } from "@/components/listing/RangeSliderFacet";
import { ResultsBar } from "@/components/listing/ResultsBar";
import { ListingNavigateContext, useListingFilterNav } from "@/components/listing/use-listing-filter-nav";
import { POST_AREA_MAX_M2, POST_BATHROOM_VALUES, POST_BEDROOM_VALUES, POST_PRICE_MAX_BILLION } from "@/lib/posts/post-filters";

/** Thanh trượt Diện tích: bước 10 m² (spec BL-052 `/tin-bds`); Mức giá bước 1 tỷ. */
const AREA_STEP_M2 = 10;
/** Tỉnh hiện sẵn trước "Xem thêm" (như `/du-an`). */
const PROVINCES_VISIBLE = 6;

/** Giá trị bộ lọc đang trên URL (đã đối chiếu ở server). */
export interface PostFilterValues {
  types: readonly string[];
  provinces: readonly string[];
  /** Tỷ đồng; `null` = đầu ở mép (không lọc). */
  price: RangeValue;
  /** m²; `null` = đầu ở mép. */
  area: RangeValue;
  bedrooms: string;
  bathrooms: string;
  directions: readonly string[];
  handovers: readonly string[];
}

/** Lựa chọn của các ô tích + số đếm "trừ chính chiều đó" (server dựng từ `loadPostListing().facets`). */
export interface PostFilterOptions {
  types: FacetOption[];
  provinces: FacetOption[];
  directions: FacetOption[];
  handovers: FacetOption[];
}

interface PostFilterFieldsProps {
  values: PostFilterValues;
  options: PostFilterOptions;
  navigate: (patch: Record<string, string | readonly string[] | null>) => void;
}

const rangePatch = (names: readonly [string, string], [low, high]: RangeValue) => ({ [names[0]]: low === null ? null : String(low), [names[1]]: high === null ? null : String(high) });

/**
 * Các nhóm lọc của `/tin-bds` (BL-052): Loại hình · Tỉnh/thành (ô tìm + ô tích, 6 + "Xem thêm") · Mức giá (thanh trượt 0 – 50+ tỷ) · Diện tích (0 – 500+ m²)
 * · Phòng ngủ · Phòng tắm (chip 1 · 2 · 3 · 4+, KHÔNG số đếm — quyết định user) · Hướng · Tình trạng bàn giao (ô tích + số). Mỗi ô có `name` (form GET không JS); có JS thì đổi là điều hướng ngay.
 */
function PostFilterFields({ values, options, navigate }: PostFilterFieldsProps) {
  const t = useTranslations("page.posts");
  const formatPrice = (value: number) => (value >= POST_PRICE_MAX_BILLION ? t("list.priceValueMax", { value }) : t("list.priceValue", { value }));
  const formatArea = (value: number) => (value >= POST_AREA_MAX_M2 ? t("list.areaValueMax", { value }) : t("list.areaValue", { value }));
  return (
    <>
      <FilterGroup title={t("list.filterGroups.type")}>
        <CheckboxFacetList name="type" label={t("list.filterGroups.type")} options={options.types} value={values.types} onChange={(type) => navigate({ type })} />
      </FilterGroup>
      {options.provinces.length > 0 && (
        <FilterGroup title={t("list.filterGroups.province")}>
          <CheckboxFacetList
            name="province"
            label={t("list.filterGroups.province")}
            options={options.provinces}
            value={values.provinces}
            searchPlaceholder={t("list.provinceSearch")}
            initialVisible={PROVINCES_VISIBLE}
            onChange={(province) => navigate({ province })}
          />
        </FilterGroup>
      )}
      <FilterGroup title={t("list.filterGroups.price")}>
        <RangeSliderFacet
          names={["priceMin", "priceMax"]}
          min={0}
          max={POST_PRICE_MAX_BILLION}
          step={1}
          value={values.price}
          formatValue={formatPrice}
          thumbLabels={[t("list.priceLow"), t("list.priceHigh")]}
          onCommit={(range) => navigate(rangePatch(["priceMin", "priceMax"], range))}
        />
      </FilterGroup>
      <FilterGroup title={t("list.filterGroups.area")}>
        <RangeSliderFacet
          names={["areaMin", "areaMax"]}
          min={0}
          max={POST_AREA_MAX_M2}
          step={AREA_STEP_M2}
          value={values.area}
          formatValue={formatArea}
          thumbLabels={[t("list.areaLow"), t("list.areaHigh")]}
          onCommit={(range) => navigate(rangePatch(["areaMin", "areaMax"], range))}
        />
      </FilterGroup>
      <FilterGroup title={t("list.filterGroups.bedrooms")}>
        <ChipChoice
          name="bedrooms"
          options={[{ value: "", label: t("all") }, ...POST_BEDROOM_VALUES.map((count) => ({ value: String(count), label: t(`list.bedroomsOption.${count}`) }))]}
          value={values.bedrooms}
          onChange={(bedrooms) => navigate({ bedrooms })}
        />
      </FilterGroup>
      <FilterGroup title={t("list.filterGroups.bathrooms")}>
        <ChipChoice
          name="bathrooms"
          options={[{ value: "", label: t("all") }, ...POST_BATHROOM_VALUES.map((count) => ({ value: String(count), label: t(`list.bathroomsOption.${count}`) }))]}
          value={values.bathrooms}
          onChange={(bathrooms) => navigate({ bathrooms })}
        />
      </FilterGroup>
      <FilterGroup title={t("list.filterGroups.direction")}>
        <CheckboxFacetList name="direction" label={t("list.filterGroups.direction")} options={options.directions} value={values.directions} onChange={(direction) => navigate({ direction })} />
      </FilterGroup>
      <FilterGroup title={t("list.filterGroups.handover")}>
        <CheckboxFacetList name="handover" label={t("list.filterGroups.handover")} options={options.handovers} value={values.handovers} onChange={(handover) => navigate({ handover })} />
      </FilterGroup>
    </>
  );
}

interface PostListBodyProps {
  /** Đường dẫn của trang (`/tin-bds` hoặc route danh mục) theo ngôn ngữ. */
  path: string;
  /** Tham số lọc / sắp xếp hợp lệ đang trên URL (không `page`): gốc để dựng URL khi đổi một ô lọc. */
  current: RawListingParams;
  values: PostFilterValues;
  options: PostFilterOptions;
  /** Tham số không có ô trong bộ lọc (`q`, `sort`, `category` của link cũ): input ẩn của form GET không JS. */
  preservedParams: Record<string, string>;
  /** Badge nút "Bộ lọc" (< lg). */
  activeCount: number;
  /** "Xoá tất cả" → trang sạch (trang danh mục giữ danh mục). */
  clearHref: string;
  /** Thẻ nổi bật (trang 1, có tin nổi bật khớp lọc). */
  spotlight?: ReactNode;
  /** "N tin" của hàng kết quả. */
  countLabel: string;
  /** Ô sắp xếp (ẩn khi không có kết quả). */
  sort?: ReactNode;
  /** Lưới + phân trang, hoặc trạng thái trống. */
  children: ReactNode;
}

/**
 * Thân trang `/tin-bds` (BL-052, cùng khung `RentalListBody` / `ProjectListBody`): ≥ lg cột trái `FilterSidebar` | cột phải thẻ nổi bật → "N tin phù hợp" + sắp xếp → lưới → phân trang;
 * < lg nút "Bộ lọc" (+ badge) ở hàng kết quả mở `FilterSheet` cùng nội dung. Gọi `useListingFilterNav` MỘT lần: `navigate` cho ô lọc của cả sidebar lẫn Sheet,
 * `reset` cho "Xoá tất cả" của cả hai, `generation` làm `key` nội dung bộ lọc. Phần kết quả do server dựng, truyền qua `children`.
 */
export function PostListBody({ path, current, values, options, preservedParams, activeCount, clearHref, spotlight, countLabel, sort, children }: PostListBodyProps) {
  const { navigate, reset, generation } = useListingFilterNav(path, current);
  const fields = <PostFilterFields key={generation} values={values} options={options} navigate={navigate} />;
  return (
    <ListingNavigateContext value={navigate}>
      <div className="mx-auto grid w-full max-w-container items-start gap-8 px-gutter pt-8 pb-section-tight lg:grid-cols-[16rem_minmax(0,1fr)] lg:pt-10 xl:grid-cols-[17.5rem_minmax(0,1fr)]">
        <FilterSidebar action={path} clearHref={clearHref} onClear={reset} preservedParams={preservedParams}>
          {fields}
        </FilterSidebar>
        <div className="flex min-w-0 flex-col gap-6">
          {spotlight && <PendingRegion>{spotlight}</PendingRegion>}
          <ResultsBar
            countLabel={countLabel}
            sort={sort}
            leading={
              <FilterSheet action={path} activeCount={activeCount} clearHref={clearHref} onClear={reset} preservedParams={preservedParams}>
                {fields}
              </FilterSheet>
            }
          />
          <PendingRegion className="flex flex-col gap-8">{children}</PendingRegion>
        </div>
      </div>
    </ListingNavigateContext>
  );
}
