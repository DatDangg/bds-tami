"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { RENTAL_SORTS } from "@/shared/types/api";

export const FIELD_CLASS =
  "h-12 w-full min-w-0 rounded-sm border border-input bg-surface px-3 font-sans text-body text-text focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-50";

interface SortSelectProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  /** Nhãn hiện thấy trên ô; `false` = chỉ có nhãn cho trình đọc màn hình (thanh dính mobile). */
  showLabel?: boolean;
}

/** Ô Sắp xếp (Mới nhất / Giá tăng dần / Giá giảm dần): `select` gốc, đổi là áp dụng ngay (design-spec S04). */
export function SortSelect({ id, value, onChange, className, showLabel = true }: SortSelectProps) {
  const t = useTranslations("page.rentals");
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <label htmlFor={id} className={cn("text-small font-semibold", !showLabel && "sr-only")}>
        {t("fields.sort")}
      </label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={FIELD_CLASS}>
        {RENTAL_SORTS.map((sort) => (
          <option key={sort} value={sort}>
            {t(`sort.${sort}`)}
          </option>
        ))}
      </select>
    </div>
  );
}
