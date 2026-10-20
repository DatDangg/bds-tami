"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { OptionSelect } from "@/components/ui/option-select";
import type { WardOption } from "@/lib/rentals/rental-list-queries";
import { PRICE_HINT_RANGES } from "@/lib/search/url-params";
import { cn } from "@/lib/utils";
import type { FilterDraft } from "./use-rental-draft";

export interface FieldOptions {
  wards: WardOption[];
  /** Đang tải phường của tỉnh vừa chọn (Sheet đổi tỉnh khi chưa có danh sách). */
  wardsLoading?: boolean;
}

interface FilterFieldsProps {
  /** Tiền tố id để cùng một trường xuất hiện ở hai nơi (Popover desktop + Sheet mobile) mà không trùng id. */
  idPrefix: string;
  draft: FilterDraft;
  onChange: (patch: Partial<FilterDraft>, mode: "now" | "typing") => void;
  options: FieldOptions;
}

/** Mốc giá gợi ý (VNĐ/tháng) theo design-spec §3.5: < 5tr, 5-10tr, 10-20tr, > 20tr. Cũng là các mục của ô "Mức giá" trên thẻ lọc (`RentalFilters`). */
export const PRICE_HINTS = PRICE_HINT_RANGES.map((hint) => ({ key: hint.key, min: hint.min === undefined ? "" : String(hint.min), max: hint.max === undefined ? "" : String(hint.max) }));

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
}

function RangeFields({ legend, fromLabel, toLabel, fromId, toId, fromValue, toValue, onChange }: RangeFieldsProps) {
  const t = useTranslations("page.rentals.fields");
  return (
    <fieldset className="flex min-w-0 flex-col gap-1">
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
    </fieldset>
  );
}

/**
 * Các ô trong Popover (≥ lg) / Sheet (< lg) của nút "Bộ lọc" (BL-045): CHỈ còn Phường/xã (khoá tới khi chọn tỉnh ở hàng "Tùy chọn khác" — không lặp ô tỉnh) và hai khoảng TỰ NHẬP
 * (giá/tháng, diện tích). Tỉnh, mốc giá, mốc diện tích, phòng ngủ, nội thất, tiện ích nằm ở hàng "Tùy chọn khác" của thẻ lọc; từ khoá, danh mục, sắp xếp ở nơi khác.
 * Hai khoảng là ô số (không slider).
 */
export function FilterFields({ idPrefix, draft, onChange, options }: FilterFieldsProps) {
  const t = useTranslations("page.rentals");
  const id = (name: string) => `${idPrefix}-${name}`;
  const wardDisabled = draft.province === "" || options.wardsLoading === true;

  return (
    <div className="flex flex-col gap-5">
      <Field label={t("fields.ward")} htmlFor={id("ward")}>
        <OptionSelect
          id={id("ward")}
          value={draft.ward}
          disabled={wardDisabled}
          onValueChange={(ward) => onChange({ ward }, "now")}
          options={[
            { value: "", label: draft.province === "" ? t("fields.wardNeedsProvince") : t("fields.allWards") },
            ...options.wards.map((ward) => ({ value: ward.slug, label: ward.name })),
          ]}
        />
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
      />
      <RangeFields
        legend={t("fields.area")}
        fromLabel={t("fields.areaFrom")}
        toLabel={t("fields.areaTo")}
        fromId={id("areaMin")}
        toId={id("areaMax")}
        fromValue={draft.areaMin}
        toValue={draft.areaMax}
        onChange={(areaMin, areaMax) => onChange({ areaMin, areaMax }, "typing")}
      />
    </div>
  );
}
