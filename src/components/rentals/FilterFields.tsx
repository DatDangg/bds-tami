"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import type { CategoryOption, ProvinceOption, WardOption } from "@/lib/rentals/rental-list-queries";
import { cn } from "@/lib/utils";
import { RENTAL_FURNISHINGS } from "@/shared/types/api";
import { FIELD_CLASS, SortSelect } from "./SortSelect";
import type { FilterDraft } from "./use-rental-draft";

export interface FieldOptions {
  categories: CategoryOption[];
  provinces: ProvinceOption[];
  wards: WardOption[];
  /** Đang tải phường của tỉnh vừa chọn (Sheet đổi tỉnh khi chưa có danh sách). */
  wardsLoading?: boolean;
}

interface FilterFieldsProps {
  /** Tiền tố id để cùng một trường xuất hiện ở hai nơi (thanh desktop + Sheet) mà không trùng id. */
  idPrefix: string;
  draft: FilterDraft;
  onChange: (patch: Partial<FilterDraft>, mode: "now" | "typing") => void;
  options: FieldOptions;
  /** `panel`: lưới 2 hàng ≥ lg; `stack`: một cột trong Sheet. */
  layout: "panel" | "stack";
  showSort?: boolean;
}

/** Mốc giá gợi ý (VNĐ/tháng) theo design-spec §3.5: < 5tr, 5-10tr, 10-20tr, > 20tr. */
const PRICE_HINTS = [
  { key: "under5", min: "", max: "5000000" },
  { key: "from5to10", min: "5000000", max: "10000000" },
  { key: "from10to20", min: "10000000", max: "20000000" },
  { key: "over20", min: "20000000", max: "" },
] as const;

const BEDROOM_VALUES = ["1", "2", "3", "4"] as const;

function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full border px-4 text-small font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
        pressed ? "border-dark bg-dark text-on-dark" : "border-border text-text hover:border-input-border",
      )}
    >
      {children}
    </button>
  );
}

function Field({ label, htmlFor, className, children }: { label: string; htmlFor: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <label htmlFor={htmlFor} className="text-small font-semibold">
        {label}
      </label>
      {children}
    </div>
  );
}

interface RangeFieldsProps {
  legend: string;
  fromLabel: string;
  toLabel: string;
  fromId: string;
  toId: string;
  fromValue: string;
  toValue: string;
  onChange: (from: string, to: string) => void;
  className?: string;
  children?: ReactNode;
}

function RangeFields({ legend, fromLabel, toLabel, fromId, toId, fromValue, toValue, onChange, className, children }: RangeFieldsProps) {
  const t = useTranslations("page.rentals.fields");
  return (
    <fieldset className={cn("flex min-w-0 flex-col gap-1", className)}>
      <legend className="mb-1 text-small font-semibold">{legend}</legend>
      <div className="grid grid-cols-2 gap-2">
        <Input
          id={fromId}
          type="number"
          inputMode="decimal"
          min={0}
          aria-label={fromLabel}
          placeholder={t("fromPlaceholder")}
          value={fromValue}
          onChange={(event) => onChange(event.target.value, toValue)}
        />
        <Input
          id={toId}
          type="number"
          inputMode="decimal"
          min={0}
          aria-label={toLabel}
          placeholder={t("toPlaceholder")}
          value={toValue}
          onChange={(event) => onChange(fromValue, event.target.value)}
        />
      </div>
      {children}
    </fieldset>
  );
}

/**
 * Mọi ô của bộ lọc Cho thuê (design-spec §3.5), dùng chung cho thanh lọc desktop và Sheet mobile: chỉ khác `layout` và cách cha xử lý `onChange`.
 * `select` gốc cho Danh mục/Tỉnh/Phường (bàn phím + trình đọc màn hình tốt, mobile mở bộ chọn hệ điều hành); giá/diện tích là hai ô số
 * (không slider); chip bấm lại để bỏ chọn. Phường bị khoá cho tới khi chọn tỉnh.
 */
export function FilterFields({ idPrefix, draft, onChange, options, layout, showSort = false }: FilterFieldsProps) {
  const t = useTranslations("page.rentals");
  const id = (name: string) => `${idPrefix}-${name}`;
  const panel = layout === "panel";
  const span = (columns: string) => (panel ? columns : undefined);
  const wardDisabled = draft.province === "" || options.wardsLoading === true;

  return (
    <div className={cn(panel ? "grid gap-x-3 gap-y-4 lg:grid-cols-12" : "flex flex-col gap-5")}>
      <Field label={t("fields.q")} htmlFor={id("q")} className={span("lg:col-span-3")}>
        <Input
          id={id("q")}
          type="search"
          maxLength={100}
          autoComplete="off"
          placeholder={t("fields.qPlaceholder")}
          value={draft.q}
          onChange={(event) => onChange({ q: event.target.value }, "typing")}
        />
      </Field>
      <Field label={t("fields.category")} htmlFor={id("category")} className={span("lg:col-span-2")}>
        <select id={id("category")} value={draft.category} onChange={(event) => onChange({ category: event.target.value }, "now")} className={FIELD_CLASS}>
          <option value="">{t("fields.allCategories")}</option>
          {options.categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.depth === 1 ? `– ${category.label}` : category.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t("fields.province")} htmlFor={id("province")} className={span("lg:col-span-2")}>
        <select id={id("province")} value={draft.province} onChange={(event) => onChange({ province: event.target.value, ward: "" }, "now")} className={FIELD_CLASS}>
          <option value="">{t("fields.allProvinces")}</option>
          {options.provinces.map((province) => (
            <option key={province.slug} value={province.slug}>
              {province.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t("fields.ward")} htmlFor={id("ward")} className={span("lg:col-span-2")}>
        <select id={id("ward")} value={draft.ward} disabled={wardDisabled} onChange={(event) => onChange({ ward: event.target.value }, "now")} className={FIELD_CLASS}>
          <option value="">{draft.province === "" ? t("fields.wardNeedsProvince") : t("fields.allWards")}</option>
          {options.wards.map((ward) => (
            <option key={ward.slug} value={ward.slug}>
              {ward.name}
            </option>
          ))}
        </select>
      </Field>
      <RangeFields
        legend={t("fields.price")}
        fromLabel={t("fields.priceFrom")}
        toLabel={t("fields.priceTo")}
        fromId={id("priceMin")}
        toId={id("priceMax")}
        fromValue={draft.priceMin}
        toValue={draft.priceMax}
        onChange={(priceMin, priceMax) => onChange({ priceMin, priceMax }, "typing")}
        className={span("lg:col-span-3")}
      >
        <div role="group" aria-label={t("fields.priceHintsLabel")} className="flex flex-wrap gap-2 pt-1">
          {PRICE_HINTS.map((hint) => {
            const pressed = draft.priceMin === hint.min && draft.priceMax === hint.max;
            return (
              <Chip key={hint.key} pressed={pressed} onClick={() => onChange(pressed ? { priceMin: "", priceMax: "" } : { priceMin: hint.min, priceMax: hint.max }, "now")}>
                {t(`priceHints.${hint.key}`)}
              </Chip>
            );
          })}
        </div>
      </RangeFields>
      <RangeFields
        legend={t("fields.area")}
        fromLabel={t("fields.areaFrom")}
        toLabel={t("fields.areaTo")}
        fromId={id("areaMin")}
        toId={id("areaMax")}
        fromValue={draft.areaMin}
        toValue={draft.areaMax}
        onChange={(areaMin, areaMax) => onChange({ areaMin, areaMax }, "typing")}
        className={span("lg:col-span-3")}
      />
      <fieldset className={cn("flex min-w-0 flex-col gap-1", span("lg:col-span-3"))}>
        <legend className="mb-1 text-small font-semibold">{t("fields.bedrooms")}</legend>
        <div className="flex flex-wrap gap-2">
          {BEDROOM_VALUES.map((value) => (
            <Chip key={value} pressed={draft.bedrooms === value} onClick={() => onChange({ bedrooms: draft.bedrooms === value ? "" : value }, "now")}>
              {t(`bedroomsOption.${value}`)}
            </Chip>
          ))}
        </div>
      </fieldset>
      <fieldset className={cn("flex min-w-0 flex-col gap-1", span(showSort ? "lg:col-span-3" : "lg:col-span-6"))}>
        <legend className="mb-1 text-small font-semibold">{t("fields.furnishing")}</legend>
        <div className="flex flex-wrap gap-2">
          {RENTAL_FURNISHINGS.map((value) => (
            <Chip key={value} pressed={draft.furnishing === value} onClick={() => onChange({ furnishing: draft.furnishing === value ? "" : value }, "now")}>
              {t(`furnishingOption.${value}`)}
            </Chip>
          ))}
        </div>
      </fieldset>
      {showSort && <SortSelect id={id("sort")} value={draft.sort} onChange={(sort) => onChange({ sort }, "now")} className={span("lg:col-span-3")} />}
    </div>
  );
}
