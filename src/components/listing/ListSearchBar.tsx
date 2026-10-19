"use client";

import type { ComponentProps, ReactNode } from "react";
import { MagnifyingGlass, SlidersHorizontal } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ListSearchBarProps {
  /** Đường dẫn công khai của trang (đã có tiền tố ngôn ngữ): đích của form GET khi chưa có JS. */
  action: string;
  /** Nhãn vùng `role="search"`. */
  label: string;
  /** Ô từ khoá (`q`). Bỏ trống khi trang không hỗ trợ tìm theo chữ (vd `/du-an`): băng chỉ còn các ô chọn + nút gửi. */
  keyword?: { id: string; name: string; label: string; placeholder: string; value: string; onChange: (value: string) => void };
  submitLabel: string;
  /** Có JS: chặn submit gốc và áp dụng bộ lọc bằng đổi URL phía client (cùng query với form GET). */
  onSubmit: () => void;
  /** Tham số đang có trên URL mà băng này không có ô (lọc phụ, sắp xếp): giữ lại khi form GET gửi không JS. Giá trị rỗng bị bỏ. */
  preservedParams?: Record<string, string>;
  /** Các ô chọn chính, mỗi ô bọc bằng `ListSearchField`. */
  children?: ReactNode;
  /** Nút "Bộ lọc" (+ Sheet/Popover của nó); dựng bằng `ListFiltersButton`. */
  filtersSlot?: ReactNode;
}

/**
 * Băng tìm kiếm gọn dùng chung cho trang danh sách (BL-020 P3): thẻ trắng bo 20px đè mép dưới banner, một hàng ≥ lg, xếp dọc < lg.
 * Không biết gì về Cho thuê/Dự án: trang cấp ô chọn, nút lọc phụ và `onSubmit`. Form GET thật nên không JS vẫn lọc được
 * (ô chọn dùng `OptionSelect progressive` ở phía gọi).
 */
export function ListSearchBar({ action, label, keyword, submitLabel, onSubmit, preservedParams = {}, children, filtersSlot }: ListSearchBarProps) {
  return (
    <form
      action={action}
      method="get"
      role="search"
      aria-label={label}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-lg lg:flex-row lg:items-center lg:p-5"
    >
      {Object.entries(preservedParams).map(([name, value]) => (value === "" ? null : <input key={name} type="hidden" name={name} value={value} />))}
      {keyword && (
        <ListSearchField label={keyword.label} htmlFor={keyword.id} className="lg:flex-[1.4]">
          <Input
            id={keyword.id}
            name={keyword.name}
            type="search"
            maxLength={100}
            autoComplete="off"
            placeholder={keyword.placeholder}
            value={keyword.value}
            onChange={(event) => keyword.onChange(event.target.value)}
            className="rounded-md"
          />
        </ListSearchField>
      )}
      {children}
      <div className="flex gap-3 lg:contents">
        {filtersSlot}
        <Button type="submit" className="h-12 flex-1 lg:flex-none lg:px-8">
          <MagnifyingGlass size={18} aria-hidden="true" />
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

/** Một ô của băng: nhãn chỉ dành cho trình đọc màn hình (ô tự nói giá trị đang chọn), chiếm phần bằng nhau của hàng ≥ lg. */
export function ListSearchField({ label, htmlFor, className, children }: { label: string; htmlFor: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn("flex min-w-0 flex-col lg:flex-1", className)}>
      <label htmlFor={htmlFor} className="sr-only">
        {label}
      </label>
      {children}
    </div>
  );
}

type FiltersButtonProps = Omit<ComponentProps<typeof Button>, "children" | "variant"> & {
  label: string;
  /** Số lọc phụ đang bật (huy hiệu số); 0 = không hiện. */
  count: number;
};

/** Nút "Bộ lọc" kiểu viên thuốc + huy hiệu số lọc phụ đang bật. Dùng làm trigger (`asChild`) của Sheet/Popover; `aria-label` luôn là "Bộ lọc (n)". */
export function ListFiltersButton({ label, count, className, ...props }: FiltersButtonProps) {
  return (
    <Button variant="secondary" aria-label={count > 0 ? `${label} (${count})` : label} className={cn("h-12 px-5", className)} {...props}>
      <SlidersHorizontal size={18} aria-hidden="true" />
      {label}
      {count > 0 && (
        <span aria-hidden="true" data-testid="filters-count" className="inline-flex size-6 items-center justify-center rounded-full bg-dark text-xsmall text-on-dark">
          {count}
        </span>
      )}
    </Button>
  );
}
