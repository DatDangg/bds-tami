"use client";

import { useState, useSyncExternalStore } from "react";
import { CaretDown } from "@/components/icons";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

export interface SelectOption {
  value: string;
  label: string;
}

/** Radix SelectItem cấm `value=""`: mục "Tất cả…" dùng giá trị này nội bộ, luôn map về "" ở ranh giới (URL/state/FormData không bao giờ thấy). */
const EMPTY_SENTINEL = "__tami_empty__";
const subscribeNever = () => () => {};
const toRadix = (value: string) => (value === "" ? EMPTY_SENTINEL : value);
const fromRadix = (value: string) => (value === EMPTY_SENTINEL ? "" : value);

interface OptionSelectProps {
  id?: string;
  /** Có `name` → tự render `<input type="hidden">` mang giá trị đã map (không dùng `name` của Radix vì nó sẽ gửi sentinel). */
  name?: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Hiện khi giá trị hiện tại không khớp mục nào (vd "" mà không có mục value=""). */
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
  "aria-required"?: true;
  "aria-label"?: string;
  /**
   * `true`: trước khi hydrate (SSR / không JS) vẫn render `<select>` gốc đã style để form GET lọc được; sau mount mới chuyển sang Select TAMI.
   * Dùng cho form GET ở Server Component (ProjectFilters, JobFilters).
   */
  progressive?: boolean;
}

const nativeClass =
  "block h-12 w-full min-w-0 cursor-pointer appearance-none truncate rounded-md border border-input bg-surface py-0 pr-10 pl-4 font-sans text-body text-text focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-50 aria-invalid:border-error";

/** Ô chọn theo token TAMI với API giống `<select>` (value là chuỗi, "" = rỗng). Controlled (`value`) hoặc uncontrolled (`defaultValue`). */
export function OptionSelect({
  id,
  name,
  options,
  value,
  defaultValue = "",
  onValueChange,
  placeholder,
  disabled,
  className,
  progressive = false,
  ...aria
}: OptionSelectProps) {
  const [inner, setInner] = useState(defaultValue);
  // Server snapshot = false (SSR + lượt render hydrate đầu) → `<select>` gốc; client = true ngay sau hydrate. Không cần setState trong effect.
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false);
  const mounted = !progressive || hydrated;
  const isControlled = value !== undefined;
  const rawCurrent = value ?? inner;
  // Giá trị không khớp mục nào coi như "" (hiện mục "" hoặc placeholder; không gửi giá trị lạ).
  const current = options.some((option) => option.value === rawCurrent) ? rawCurrent : "";
  // Radix chỉ hiện placeholder khi value === "": chỉ dùng sentinel khi thực sự có mục "".
  const radixValue = current === "" && !options.some((option) => option.value === "") ? "" : toRadix(current);
  const change = (next: string) => {
    setInner(next);
    onValueChange?.(next);
  };

  if (!mounted) {
    return (
      <div className="relative">
        <select id={id} name={name} {...(isControlled ? { value: rawCurrent } : { defaultValue })} disabled={disabled} onChange={(event) => change(event.target.value)} className={cn(nativeClass, className)} {...aria}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <CaretDown size={16} aria-hidden="true" className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2" />
      </div>
    );
  }

  return (
    <>
      <Select value={radixValue} onValueChange={(next) => change(fromRadix(next))} disabled={disabled}>
        <SelectTrigger id={id} className={className} {...aria}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={toRadix(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {name && <input type="hidden" name={name} value={current} disabled={disabled} />}
    </>
  );
}
