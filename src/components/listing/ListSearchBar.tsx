"use client";

import { type ComponentProps, type ReactNode, useId } from "react";
import { ArrowRight, MagnifyingGlass, SlidersHorizontal } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ListSearchBarProps {
  /** Đường dẫn công khai của trang (đã có tiền tố ngôn ngữ): đích của form GET khi chưa có JS. */
  action: string;
  /** Nhãn vùng `role="search"`. */
  label: string;
  /** Ô từ khoá (`q`, ≤ 100 ký tự). */
  keyword: { id: string; name: string; label: string; placeholder: string; value: string; onChange: (value: string) => void };
  submitLabel: string;
  /** Có JS: chặn submit gốc và áp dụng bộ lọc bằng đổi URL phía client (cùng query với form GET). */
  onSubmit: () => void;
  /** Tham số đang có trên URL mà thẻ này không có ô (lọc phụ, giá, sắp xếp, danh mục): giữ lại khi form GET gửi không JS. Giá trị rỗng bị bỏ. */
  preservedParams?: Record<string, string>;
  /** Hàng 2: chip loại hình / danh mục (link) do server dựng, bọc bằng `ListFilterRow`. */
  categoryRow?: ReactNode;
  /** Nhãn hàng 3 "Tùy chọn khác"; không có ô nào (`children` rỗng và không `filtersSlot`) thì hàng 3 không hiện. */
  moreLabel: string;
  /** Hàng 3: các ô chọn kiểu chip, mỗi ô bọc bằng `ListOptionCell`. */
  children?: ReactNode;
  /** Nút "Bộ lọc" (+ Sheet/Popover của nó) cuối hàng 3; dựng bằng `ListFiltersButton`. */
  filtersSlot?: ReactNode;
}

/** Nhãn đầu hàng: cùng bề rộng ≥ md để các hàng thẳng cột như mockup `.frow` / ô tìm kiếm trang chủ. */
const ROW_LABEL = "shrink-0 text-small font-semibold text-text md:w-40 md:whitespace-nowrap md:pt-2.5";

/**
 * Nội dung thẻ lọc nổi dùng chung cho trang danh sách (BL-045, mockup `.fcard`): MỘT form GET bao ba hàng — (1) ô từ khoá + "Tìm kiếm", (2) chip loại hình/danh mục (link, do trang truyền vào),
 * (3) "Tùy chọn khác" các ô chọn viên thuốc. Không biết gì về Cho thuê/Dự án: trang cấp ô chọn và `onSubmit`. Form GET thật nên không JS vẫn lọc được
 * (ô chọn dùng `OptionSelect progressive` ở phía gọi). Khung thẻ trắng do `CategoryListTemplate` dựng.
 */
export function ListSearchBar({ action, label, keyword, submitLabel, onSubmit, preservedParams = {}, categoryRow, moreLabel, children, filtersSlot }: ListSearchBarProps) {
  const moreId = useId();
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
      className="flex flex-col gap-4"
    >
      {Object.entries(preservedParams).map(([name, value]) => (value === "" ? null : <input key={name} type="hidden" name={name} value={value} />))}
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor={keyword.id} className="sr-only">
          {keyword.label}
        </label>
        <div className="relative min-w-0 sm:flex-1">
          <Input
            id={keyword.id}
            name={keyword.name}
            type="search"
            maxLength={100}
            autoComplete="off"
            placeholder={keyword.placeholder}
            value={keyword.value}
            onChange={(event) => keyword.onChange(event.target.value)}
            className="pr-11"
          />
          <MagnifyingGlass size={20} aria-hidden="true" className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-text-muted" />
        </div>
        <Button type="submit" className="h-12 shrink-0 sm:px-6">
          <MagnifyingGlass size={16} aria-hidden="true" />
          {submitLabel}
          <ArrowRight size={16} aria-hidden="true" />
        </Button>
      </div>
      {categoryRow}
      {(children || filtersSlot) && (
        <div role="group" aria-labelledby={moreId} className="flex flex-col gap-2 md:flex-row md:items-start md:gap-3">
          <p id={moreId} className={ROW_LABEL}>
            {moreLabel}
          </p>
          <div className="flex min-w-0 flex-wrap gap-2 md:flex-1">
            {children}
            {filtersSlot}
          </div>
        </div>
      )}
    </form>
  );
}

/** Một hàng có nhãn đầu hàng (hàng chip loại hình / danh mục; vùng `nav` có nhãn nằm trong `children`): nhãn trên nội dung < md, cùng cột ≥ md. */
export function ListFilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-start md:gap-3">
      <p className={ROW_LABEL}>
        {label}
      </p>
      <div className="min-w-0 md:flex-1">{children}</div>
    </div>
  );
}

/** Một ô của hàng "Tùy chọn khác": 2 ô/hàng ở mobile, bề rộng cố định từ sm để các chip thẳng cột. */
export function ListOptionCell({ children }: { children: ReactNode }) {
  return <div className="w-[calc(50%-0.25rem)] min-w-0 sm:w-44">{children}</div>;
}

type FiltersButtonProps = Omit<ComponentProps<typeof Button>, "children" | "variant"> & {
  label: string;
  /** Số lọc phụ đang bật (huy hiệu số); 0 = không hiện. */
  count: number;
};

/** Nút "Bộ lọc" kiểu viên thuốc + huy hiệu số lọc phụ đang bật. Dùng làm trigger (`asChild`) của Sheet/Popover; `aria-label` luôn là "Bộ lọc (n)". */
export function ListFiltersButton({ label, count, className, ...props }: FiltersButtonProps) {
  return (
    <Button variant="secondary" aria-label={count > 0 ? `${label} (${count})` : label} className={cn("h-11 gap-1.5 px-4 text-small normal-case md:h-10", className)} {...props}>
      <SlidersHorizontal size={16} aria-hidden="true" />
      {label}
      {count > 0 && (
        <span aria-hidden="true" data-testid="filters-count" className="inline-flex size-6 items-center justify-center rounded-full bg-dark text-xsmall text-on-dark">
          {count}
        </span>
      )}
    </Button>
  );
}
