"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { PendingRegion } from "@/components/layout/PendingRegion";
import { CheckboxFacetList, ChipChoice, type FacetOption, FilterGroup, SelectFacet } from "@/components/listing/FilterFacets";
import { FilterSheet, FilterSidebar } from "@/components/listing/FilterPanel";
import type { RawListingParams } from "@/components/listing/listing-params";
import { RangeSliderFacet, type RangeValue } from "@/components/listing/RangeSliderFacet";
import { ResultsBar } from "@/components/listing/ResultsBar";
import { ListingNavigateContext, useListingFilterNav } from "@/components/listing/use-listing-filter-nav";
import type { SelectOption } from "@/components/ui/option-select";
import { RENTAL_AMENITIES, RENTAL_FURNISHINGS, type RentalAmenity } from "@/shared/types/api";
import { RadioFacetList } from "./RadioFacetList";

/** Thanh trượt Giá thuê (BL-052): 0 – 100+ triệu/tháng, bước 1 triệu. Đơn vị của ô = VNĐ như tham số `priceMin`/`priceMax` (form không JS gửi thẳng). */
export const RENTAL_PRICE_MAX_VND = 100_000_000;
const RENTAL_PRICE_STEP_VND = 1_000_000;
/** Thanh trượt Diện tích: 0 – 300+ m², bước 5. */
export const RENTAL_AREA_MAX_M2 = 300;
const RENTAL_AREA_STEP_M2 = 5;
/** Chip Phòng ngủ 1 · 2 · 3 · 4+ (`bedrooms=4` = từ 4 phòng, như hiện tại). */
const BEDROOM_VALUES = ["1", "2", "3", "4"] as const;
/** Tỉnh hiện sẵn trước "Xem thêm" (như `/du-an`). */
const PROVINCES_VISIBLE = 6;

/** Giá trị bộ lọc đang trên URL (đã đối chiếu ở server). */
export interface RentalFilterValues {
  province: string;
  ward: string;
  project: string;
  /** VNĐ; `null` = đầu ở mép (không lọc). */
  price: RangeValue;
  /** m²; `null` = đầu ở mép. */
  area: RangeValue;
  bedrooms: string;
  furnishing: string;
  amenities: readonly string[];
}

/** Lựa chọn của các ô (server dựng; tỉnh có số đếm "trừ chiều tỉnh"). */
export interface RentalFilterOptionsView {
  provinces: FacetOption[];
  /** Phường của tỉnh đang trên URL (rỗng khi chưa chọn tỉnh). */
  wards: SelectOption[];
  projects: SelectOption[];
  /** Số đếm ô Tiện ích "trừ chiều tiện ích"; `undefined` khi truy vấn lỗi (ô tích không hiện số). */
  amenityCounts?: Readonly<Record<RentalAmenity, number>>;
}

interface RentalFilterFieldsProps {
  values: RentalFilterValues;
  options: RentalFilterOptionsView;
  navigate: (patch: Record<string, string | readonly string[] | null>) => void;
}

const rangePatch = (names: readonly [string, string], [low, high]: RangeValue) => ({ [names[0]]: low === null ? null : String(low), [names[1]]: high === null ? null : String(high) });

/**
 * Các nhóm lọc của `/cho-thue` (BL-052): Tỉnh/thành (chọn một + số; chọn tỉnh → Select Phường) · Dự án (Select) · Giá thuê (thanh trượt triệu/tháng) · Diện tích (thanh trượt m²)
 * · Phòng ngủ (chip) · Nội thất (chip) · Tiện ích (ô tích, AND). Không có ô Loại hình: danh mục là thanh tab. Mỗi ô có `name` (form GET không JS); có JS thì đổi là điều hướng ngay.
 */
function RentalFilterFields({ values, options, navigate }: RentalFilterFieldsProps) {
  const t = useTranslations("page.rentals");
  const millions = (value: number) => value / RENTAL_PRICE_STEP_VND;
  const formatPrice = (value: number) => (value >= RENTAL_PRICE_MAX_VND ? t("priceValueMax", { value: millions(value) }) : t("priceValue", { value: millions(value) }));
  const formatArea = (value: number) => (value >= RENTAL_AREA_MAX_M2 ? t("areaValueMax", { value }) : t("areaValue", { value }));
  return (
    <>
      {options.provinces.length > 0 && (
        <FilterGroup title={t("fields.province")}>
          <RadioFacetList
            name="province"
            label={t("fields.province")}
            allLabel={t("fields.allProvinces")}
            options={options.provinces}
            value={values.province}
            initialVisible={PROVINCES_VISIBLE}
            onChange={(province) => navigate({ province, ward: null })}
          />
        </FilterGroup>
      )}
      {values.province !== "" && options.wards.length > 0 && (
        <FilterGroup title={t("fields.ward")}>
          <SelectFacet name="ward" label={t("fields.ward")} options={[{ value: "", label: t("fields.allWards") }, ...options.wards]} value={values.ward} onChange={(ward) => navigate({ ward })} />
        </FilterGroup>
      )}
      {options.projects.length > 0 && (
        <FilterGroup title={t("filterGroups.project")}>
          <SelectFacet name="project" label={t("filterGroups.project")} options={[{ value: "", label: t("allProjects") }, ...options.projects]} value={values.project} onChange={(project) => navigate({ project })} />
        </FilterGroup>
      )}
      <FilterGroup title={t("filterGroups.price")}>
        <RangeSliderFacet
          names={["priceMin", "priceMax"]}
          min={0}
          max={RENTAL_PRICE_MAX_VND}
          step={RENTAL_PRICE_STEP_VND}
          value={values.price}
          formatValue={formatPrice}
          thumbLabels={[t("priceLow"), t("priceHigh")]}
          onCommit={(range) => navigate(rangePatch(["priceMin", "priceMax"], range))}
        />
      </FilterGroup>
      <FilterGroup title={t("filterGroups.area")}>
        <RangeSliderFacet
          names={["areaMin", "areaMax"]}
          min={0}
          max={RENTAL_AREA_MAX_M2}
          step={RENTAL_AREA_STEP_M2}
          value={values.area}
          formatValue={formatArea}
          thumbLabels={[t("areaLow"), t("areaHigh")]}
          onCommit={(range) => navigate(rangePatch(["areaMin", "areaMax"], range))}
        />
      </FilterGroup>
      <FilterGroup title={t("fields.bedrooms")}>
        <ChipChoice
          name="bedrooms"
          options={[{ value: "", label: t("all") }, ...BEDROOM_VALUES.map((value) => ({ value, label: t(`bedroomsOption.${value}`) }))]}
          value={values.bedrooms}
          onChange={(bedrooms) => navigate({ bedrooms })}
        />
      </FilterGroup>
      <FilterGroup title={t("fields.furnishing")}>
        <ChipChoice
          name="furnishing"
          options={[{ value: "", label: t("all") }, ...RENTAL_FURNISHINGS.map((value) => ({ value, label: t(`furnishingOption.${value}`) }))]}
          value={values.furnishing}
          onChange={(furnishing) => navigate({ furnishing })}
        />
      </FilterGroup>
      <FilterGroup title={t("fields.amenities")}>
        <CheckboxFacetList
          name="amenities"
          label={t("fields.amenities")}
          options={RENTAL_AMENITIES.map((value) => ({ value, label: t(`amenityOption.${value}`), ...(options.amenityCounts ? { count: options.amenityCounts[value] } : {}) }))}
          value={values.amenities}
          onChange={(amenities) => navigate({ amenities })}
        />
      </FilterGroup>
    </>
  );
}

interface RentalListBodyProps {
  /** Đường dẫn của trang (`/cho-thue` hoặc route danh mục) theo ngôn ngữ. */
  path: string;
  /** Tham số lọc / sắp xếp hợp lệ đang trên URL (không `page`): gốc để dựng URL khi đổi một ô lọc. */
  current: RawListingParams;
  values: RentalFilterValues;
  options: RentalFilterOptionsView;
  /** Tham số không có ô trong bộ lọc (`q`, `sort`, `category` của link cũ): input ẩn của form GET không JS. */
  preservedParams: Record<string, string>;
  /** Badge nút "Bộ lọc" (< lg). */
  activeCount: number;
  /** "Xoá tất cả" → trang sạch (trang danh mục giữ danh mục). */
  clearHref: string;
  /** Thẻ nổi bật (trang 1, có tin nổi bật khớp lọc). */
  spotlight?: ReactNode;
  /** "N căn" của hàng kết quả; không có (truy vấn lỗi) → không có hàng số. */
  countLabel?: string;
  /** Ô sắp xếp (ẩn khi không có kết quả). */
  sort?: ReactNode;
  /** Lưới + phân trang, trạng thái trống hoặc khung lỗi. */
  children: ReactNode;
}

/**
 * Thân trang `/cho-thue` (BL-052, cùng khung `ProjectListBody` của `/du-an`): ≥ lg cột trái `FilterSidebar` | cột phải thẻ nổi bật → "N căn phù hợp" + sắp xếp → lưới → phân trang;
 * < lg nút "Bộ lọc" (+ badge) ở hàng kết quả mở `FilterSheet` cùng nội dung. Gọi `useListingFilterNav` MỘT lần: `navigate` cho ô lọc của cả sidebar lẫn Sheet,
 * `reset` cho "Xoá tất cả" của cả hai, `generation` làm `key` nội dung bộ lọc. Phần kết quả do server dựng, truyền qua `children`.
 */
export function RentalListBody({ path, current, values, options, preservedParams, activeCount, clearHref, spotlight, countLabel, sort, children }: RentalListBodyProps) {
  const { navigate, reset, generation } = useListingFilterNav(path, current);
  const fields = <RentalFilterFields key={generation} values={values} options={options} navigate={navigate} />;
  const sheet = (
    <FilterSheet action={path} activeCount={activeCount} clearHref={clearHref} onClear={reset} preservedParams={preservedParams}>
      {fields}
    </FilterSheet>
  );
  return (
    <ListingNavigateContext value={navigate}>
      <div className="mx-auto grid w-full max-w-container items-start gap-8 px-gutter pt-8 pb-section-tight lg:grid-cols-[16rem_minmax(0,1fr)] lg:pt-10 xl:grid-cols-[17.5rem_minmax(0,1fr)]">
        <FilterSidebar action={path} clearHref={clearHref} onClear={reset} preservedParams={preservedParams}>
          {fields}
        </FilterSidebar>
        <div className="flex min-w-0 flex-col gap-6">
          {spotlight && <PendingRegion>{spotlight}</PendingRegion>}
          {countLabel === undefined ? sheet : <ResultsBar countLabel={countLabel} sort={sort} leading={sheet} />}
          <PendingRegion className="flex flex-col gap-8">{children}</PendingRegion>
        </div>
      </div>
    </ListingNavigateContext>
  );
}
