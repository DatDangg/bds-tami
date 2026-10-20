"use client";

import { CaretDown } from "@/components/icons";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface AmenityMultiSelectProps {
  /** Tên ô ("Tiện ích"); cũng là `aria-label` của nút và tên nhóm ô tích. */
  label: string;
  /** Chữ trên nút khi đã chọn (vd "Tiện ích (2)"). */
  selectedLabel: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
}

/**
 * Ô "Tiện ích" chọn NHIỀU giá trị của thẻ lọc Cho thuê (BL-045): nút viên thuốc cùng kiểu `OptionSelect variant="chip"`, bấm xổ bảng có ô tích (AND như F3 — tin phải có đủ mọi tiện ích chọn).
 * Mỗi lần tích đổi lọc ngay (cha áp dụng); bảng đóng bằng Esc / bấm ra ngoài. Cần JS như chip tiện ích trước đây; không JS thì tiện ích đang trên URL vẫn được giữ bằng input ẩn của form.
 */
export function AmenityMultiSelect({ label, selectedLabel, options, selected, onChange }: AmenityMultiSelectProps) {
  const toggle = (value: string) => onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className={cn(
            "flex h-11 w-full min-w-0 cursor-pointer items-center justify-between gap-1.5 rounded-pill border border-input-border pr-2.5 pl-3.5 font-sans text-small text-text md:h-10",
            selected.length > 0 ? "bg-primary-soft" : "bg-surface hover:border-accent-text",
          )}
        >
          <span className="min-w-0 truncate text-left">{selected.length > 0 ? selectedLabel : label}</span>
          <CaretDown size={16} aria-hidden="true" className="shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" aria-label={label} className="max-h-[min(60dvh,420px)] w-72 overflow-y-auto p-2">
        <fieldset>
          <legend className="sr-only">{label}</legend>
          <ul>
            {options.map((option) => (
              <li key={option.value}>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-3 text-small hover:bg-surface-muted">
                  <Checkbox checked={selected.includes(option.value)} onCheckedChange={() => toggle(option.value)} />
                  {option.label}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      </PopoverContent>
    </Popover>
  );
}
