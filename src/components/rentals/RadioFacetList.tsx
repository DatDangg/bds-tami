"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { type FacetOption, useHydrated, useUrlBackedState } from "@/components/listing/FilterFacets";
import { cn } from "@/lib/utils";

interface RadioFacetListProps {
  /** Tên tham số (form GET không JS gửi `name=value`; mục "Tất cả" gửi rỗng = không lọc). */
  name: string;
  /** Tên danh sách cho trình đọc màn hình (vd "Tỉnh/thành"). */
  label: string;
  /** Chữ mục đầu "Tất cả…" (giá trị `""`). */
  allLabel: string;
  options: readonly FacetOption[];
  /** Giá trị đang trên URL; `""` = "Tất cả". */
  value: string;
  onChange?: (value: string) => void;
  /** Chỉ hiện N mục đầu + "Xem thêm" (mục đang chọn nằm sau N thì mở sẵn). Chưa có JS luôn hiện hết. */
  initialVisible?: number;
}

/**
 * Danh sách chọn MỘT + số đếm (BL-052 `/cho-thue` "Tỉnh/thành": chọn một vì phường phụ thuộc tỉnh): `radio` gốc có `name` nên bàn phím (mũi tên) và form GET
 * không JS chạy sẵn; có JS thì chọn là gọi `onChange`. Cùng dáng `CheckboxFacetList` (ô tròn thay ô vuông), mục đếm 0 mờ nhưng vẫn chọn được.
 */
export function RadioFacetList({ name, label, allLabel, options, value, onChange, initialVisible }: RadioFacetListProps) {
  const t = useTranslations("page.listing.filters");
  const hydrated = useHydrated();
  const listId = useId();
  const [selected, setSelected] = useUrlBackedState(value);
  const limit = initialVisible ?? options.length;
  const [expanded, setExpanded] = useState(() => options.findIndex((option) => option.value === value) >= limit);
  const collapsible = hydrated && options.length > limit;
  const visible = !hydrated || expanded ? options : options.slice(0, limit);
  const items: readonly FacetOption[] = [{ value: "", label: allLabel }, ...visible];

  return (
    <div className="flex flex-col gap-1">
      <ul id={listId} aria-label={label} className="flex flex-col">
        {items.map((option) => (
          <li key={option.value} data-empty={option.count === 0 ? "true" : undefined} className={cn(option.count === 0 && "opacity-60")}>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-small text-text lg:min-h-10">
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected === option.value}
                onChange={() => {
                  setSelected(option.value);
                  onChange?.(option.value);
                }}
                className="size-5 shrink-0 cursor-pointer accent-primary"
              />
              <span className="min-w-0 flex-1 break-words">{option.label}</span>
              {option.count !== undefined && <span className="shrink-0 text-xsmall text-text-muted tabular-nums">({option.count})</span>}
            </label>
          </li>
        ))}
      </ul>
      {collapsible && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded((open) => !open)}
          className="inline-flex min-h-11 cursor-pointer items-center self-start text-small font-semibold text-accent-text transition-colors duration-(--duration-fast) hover:text-text lg:min-h-9"
        >
          {expanded ? t("showLess") : t("showMore")}
        </button>
      )}
    </div>
  );
}
