"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { OptionSelect } from "@/components/ui/option-select";
import type { ProvinceOption, WardOption } from "@/lib/rentals/rental-list-queries";
import { PRICE_HINT_RANGES } from "@/lib/search/url-params";
import { cn } from "@/lib/utils";
import { RENTAL_AMENITIES, RENTAL_FURNISHINGS } from "@/shared/types/api";
import type { FilterDraft } from "./use-rental-draft";

export interface FieldOptions {
  provinces: ProvinceOption[];
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

/** Mốc giá gợi ý (VNĐ/tháng) theo design-spec §3.5: < 5tr, 5-10tr, 10-20tr, > 20tr. Cũng là các mục của ô "Khoảng giá" trên băng tìm kiếm. */
export const PRICE_HINTS = PRICE_HINT_RANGES.map((hint) => ({ key: hint.key, min: hint.min === undefined ? "" : String(hint.min), max: hint.max === undefined ? "" : String(hint.max) }));

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
 * Các ô LỌC PHỤ của Cho thuê (design-spec §3.5): Tỉnh/Phường, Giá/tháng tuỳ chọn + mốc gợi ý, Diện tích, Phòng ngủ, Nội thất, Tiện ích (chọn nhiều, BL-044) — nằm trong Popover (≥ lg)
 * hoặc Sheet (< lg) sau nút "Bộ lọc". Từ khoá, Danh mục, Khoảng giá nhanh và Sắp xếp ở nơi khác (băng tìm kiếm, hàng kết quả). Ô chọn TAMI (Radix) cho Tỉnh/Phường;
 * giá/diện tích là hai ô số (không slider); chip bấm lại để bỏ chọn. Phường bị khoá cho tới khi chọn tỉnh.
 */
export function FilterFields({ idPrefix, draft, onChange, options }: FilterFieldsProps) {
  const t = useTranslations("page.rentals");
  const id = (name: string) => `${idPrefix}-${name}`;
  const wardDisabled = draft.province === "" || options.wardsLoading === true;
  const toggleAmenity = (value: string) =>
    onChange({ amenities: draft.amenities.includes(value) ? draft.amenities.filter((item) => item !== value) : [...draft.amenities, value] }, "now");

  return (
    <div className="flex flex-col gap-5">
      <Field label={t("fields.province")} htmlFor={id("province")}>
        <OptionSelect
          id={id("province")}
          value={draft.province}
          onValueChange={(province) => onChange({ province, ward: "" }, "now")}
          options={[{ value: "", label: t("fields.allProvinces") }, ...options.provinces.map((province) => ({ value: province.slug, label: province.name }))]}
        />
      </Field>
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
      />
      <fieldset className="flex min-w-0 flex-col gap-1">
        <legend className="mb-1 text-small font-semibold">{t("fields.bedrooms")}</legend>
        <div className="flex flex-wrap gap-2">
          {BEDROOM_VALUES.map((value) => (
            <Chip key={value} pressed={draft.bedrooms === value} onClick={() => onChange({ bedrooms: draft.bedrooms === value ? "" : value }, "now")}>
              {t(`bedroomsOption.${value}`)}
            </Chip>
          ))}
        </div>
      </fieldset>
      <fieldset className="flex min-w-0 flex-col gap-1">
        <legend className="mb-1 text-small font-semibold">{t("fields.furnishing")}</legend>
        <div className="flex flex-wrap gap-2">
          {RENTAL_FURNISHINGS.map((value) => (
            <Chip key={value} pressed={draft.furnishing === value} onClick={() => onChange({ furnishing: draft.furnishing === value ? "" : value }, "now")}>
              {t(`furnishingOption.${value}`)}
            </Chip>
          ))}
        </div>
      </fieldset>
      <fieldset className="flex min-w-0 flex-col gap-1">
        <legend className="mb-1 text-small font-semibold">{t("fields.amenities")}</legend>
        <div className="flex flex-wrap gap-2">
          {RENTAL_AMENITIES.map((value) => (
            <Chip key={value} pressed={draft.amenities.includes(value)} onClick={() => toggleAmenity(value)}>
              {t(`amenityOption.${value}`)}
            </Chip>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
