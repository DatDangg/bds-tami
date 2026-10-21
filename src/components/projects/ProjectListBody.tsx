"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { PendingRegion } from "@/components/layout/PendingRegion";
import { CheckboxFacetList, ChipChoice, type FacetOption, FilterGroup, SelectFacet } from "@/components/listing/FilterFacets";
import { FilterSheet, FilterSidebar } from "@/components/listing/FilterPanel";
import type { RawListingParams } from "@/components/listing/listing-params";
import { RangeSliderFacet, type RangeValue } from "@/components/listing/RangeSliderFacet";
import { ResultsBar } from "@/components/listing/ResultsBar";
import { useListingFilterNav } from "@/components/listing/use-listing-filter-nav";
import type { SelectOption } from "@/components/ui/option-select";
import { PROJECT_PRICE_MAX_BILLION } from "@/lib/projects/project-filters";

/** Thứ tự chip "Tình trạng" theo design: Tất cả · Đang mở bán · Sắp mở bán · Đã bàn giao. */
const STATUS_ORDER = ["selling", "upcoming", "handed_over"] as const;
/** Tỉnh hiện sẵn trước "Xem thêm" (spec BL-052 `/du-an`). */
const PROVINCES_VISIBLE = 6;

/** Giá trị bộ lọc đang trên URL (đã đối chiếu ở server). */
export interface ProjectFilterValues {
  status: string;
  provinces: string[];
  developer: string;
  /** Tỷ đồng; `null` = đầu ở mép (không lọc). */
  price: RangeValue;
  types: string[];
  features: string[];
}

/** Danh sách lựa chọn + số đếm "trừ chính chiều đó" (server dựng từ `listPublicProjects().facets`). */
export interface ProjectFilterOptions {
  provinces: FacetOption[];
  developers: SelectOption[];
  types: FacetOption[];
  features: FacetOption[];
}

interface ProjectFilterFieldsProps {
  values: ProjectFilterValues;
  options: ProjectFilterOptions;
  navigate: (patch: Record<string, string | readonly string[] | null>) => void;
}

/**
 * Các nhóm lọc của `/du-an` (BL-052, design `list-du-an`): Tình trạng (chip) · Tỉnh/thành (ô tìm + ô tích + số, 6 + "Xem thêm") · Chủ đầu tư (Select)
 * · Mức giá (thanh trượt 0 – 50+ tỷ) · Loại hình · Tiện ích nổi bật (ô tích + số). Mỗi ô có `name` (form GET không JS); có JS thì đổi là điều hướng ngay.
 */
function ProjectFilterFields({ values, options, navigate }: ProjectFilterFieldsProps) {
  const t = useTranslations("page.projects");
  const formatPrice = (value: number) => (value >= PROJECT_PRICE_MAX_BILLION ? t("priceValueMax", { value }) : t("priceValue", { value }));
  return (
    <>
      <FilterGroup title={t("filterGroups.status")}>
        <ChipChoice
          name="status"
          options={[{ value: "", label: t("all") }, ...STATUS_ORDER.map((value) => ({ value, label: t(`salesStatus.${value}`) }))]}
          value={values.status}
          onChange={(status) => navigate({ status })}
        />
      </FilterGroup>
      {options.provinces.length > 0 && (
        <FilterGroup title={t("filterGroups.province")}>
          <CheckboxFacetList
            name="province"
            label={t("filterGroups.province")}
            options={options.provinces}
            value={values.provinces}
            searchPlaceholder={t("provinceSearch")}
            initialVisible={PROVINCES_VISIBLE}
            onChange={(province) => navigate({ province })}
          />
        </FilterGroup>
      )}
      {options.developers.length > 0 && (
        <FilterGroup title={t("filterGroups.developer")}>
          <SelectFacet
            name="developer"
            label={t("filterGroups.developer")}
            options={[{ value: "", label: t("allDevelopers") }, ...options.developers]}
            value={values.developer}
            onChange={(developer) => navigate({ developer })}
          />
        </FilterGroup>
      )}
      <FilterGroup title={t("filterGroups.price")}>
        <RangeSliderFacet
          names={["priceMin", "priceMax"]}
          min={0}
          max={PROJECT_PRICE_MAX_BILLION}
          step={1}
          value={values.price}
          formatValue={formatPrice}
          thumbLabels={[t("priceLow"), t("priceHigh")]}
          onCommit={([low, high]) => navigate({ priceMin: low === null ? null : String(low), priceMax: high === null ? null : String(high) })}
        />
      </FilterGroup>
      <FilterGroup title={t("filterGroups.type")}>
        <CheckboxFacetList name="type" label={t("filterGroups.type")} options={options.types} value={values.types} onChange={(type) => navigate({ type })} />
      </FilterGroup>
      <FilterGroup title={t("filterGroups.feature")}>
        <CheckboxFacetList name="feature" label={t("filterGroups.feature")} options={options.features} value={values.features} onChange={(feature) => navigate({ feature })} />
      </FilterGroup>
    </>
  );
}

interface ProjectListBodyProps {
  /** Đường dẫn `/du-an` theo ngôn ngữ. */
  path: string;
  /** Tham số lọc / sắp xếp hợp lệ đang trên URL (không `page`): gốc để dựng URL khi đổi một ô lọc. */
  current: RawListingParams;
  values: ProjectFilterValues;
  options: ProjectFilterOptions;
  /** Tham số không có ô trong bộ lọc (`q`, `sort`, `category`): input ẩn của form GET không JS. */
  preservedParams: Record<string, string>;
  /** Badge nút "Bộ lọc" (< lg). */
  activeCount: number;
  /** "Xoá tất cả" → trang sạch. */
  clearHref: string;
  /** Thẻ nổi bật (trang 1, có dự án nổi bật khớp lọc). */
  spotlight?: ReactNode;
  /** "N dự án" của hàng kết quả. */
  countLabel: string;
  /** Ô sắp xếp (ẩn khi không có kết quả). */
  sort?: ReactNode;
  /** Lưới + phân trang, hoặc trạng thái trống. */
  children: ReactNode;
}

/**
 * Thân trang `/du-an` (BL-052): ≥ lg cột trái `FilterSidebar` | cột phải thẻ nổi bật → "N dự án phù hợp" + sắp xếp → lưới → phân trang; < lg nút "Bộ lọc" (+ badge)
 * ở hàng kết quả mở `FilterSheet` cùng nội dung. Gọi `useListingFilterNav` MỘT lần: `navigate` cho ô lọc của cả sidebar lẫn Sheet, `reset` cho "Xoá tất cả" của cả hai,
 * `generation` làm `key` nội dung bộ lọc (huỷ hẹn giờ thanh trượt + bỏ giá trị lạc quan khi xoá). Phần kết quả do server dựng, truyền qua `children`.
 */
export function ProjectListBody({ path, current, values, options, preservedParams, activeCount, clearHref, spotlight, countLabel, sort, children }: ProjectListBodyProps) {
  const { navigate, reset, generation } = useListingFilterNav(path, current);
  const fields = <ProjectFilterFields key={generation} values={values} options={options} navigate={navigate} />;
  return (
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
  );
}
