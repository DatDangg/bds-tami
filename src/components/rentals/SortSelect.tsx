"use client";

import { useTranslations } from "next-intl";
import { OptionSelect } from "@/components/ui/option-select";
import { cn } from "@/lib/utils";
import { RENTAL_SORTS } from "@/shared/types/api";

interface SortSelectProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  /** Lớp thêm cho nhãn (vd `max-sm:sr-only` để ẩn nhãn trên màn nhỏ nhưng vẫn gắn với ô). */
  labelClassName?: string;
  /** Lớp thêm cho chính ô chọn (kích thước). */
  selectClassName?: string;
  /** Nhãn hiện thấy trên ô; `false` = chỉ có nhãn cho trình đọc màn hình (thanh dính mobile). */
  showLabel?: boolean;
}

/** Ô Sắp xếp (Mới nhất / Giá tăng dần / Giá giảm dần): ô chọn TAMI, đổi là áp dụng ngay (design-spec S04). */
export function SortSelect({ id, value, onChange, className, labelClassName, selectClassName, showLabel = true }: SortSelectProps) {
  const t = useTranslations("page.rentals");
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <label htmlFor={id} className={cn("text-small font-semibold", !showLabel && "sr-only", labelClassName)}>
        {t("fields.sort")}
      </label>
      <OptionSelect id={id} value={value} onValueChange={onChange} options={RENTAL_SORTS.map((sort) => ({ value: sort, label: t(`sort.${sort}`) }))} {...(selectClassName ? { className: selectClassName } : {})} />
    </div>
  );
}
