"use client";

import { useTranslations } from "next-intl";
import { type ComponentProps, type ReactNode, useId } from "react";
import { SlidersHorizontal } from "@/components/icons";
import { PendingLink } from "@/components/layout/PendingRegion";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useHydrated } from "./FilterFacets";

type FiltersButtonProps = Omit<ComponentProps<typeof Button>, "children" | "variant"> & {
  label: string;
  /** Số lọc đang bật (huy hiệu số); 0 = không hiện. */
  count: number;
};

/** Nút "Bộ lọc" kiểu viên thuốc + huy hiệu số lọc đang bật: trigger (`asChild`) của Sheet; `aria-label` luôn là "Bộ lọc (n)". */
function ListFiltersButton({ label, count, className, ...props }: FiltersButtonProps) {
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

interface FilterFormProps {
  /** Đường dẫn của chính trang (đã có tiền tố ngôn ngữ): đích form GET khi chưa có JS. */
  action: string;
  /** Tham số không có ô trong thẻ lọc (vd `q`, `sort`, danh mục dạng query): giữ lại khi form GET gửi không JS. Không lặp tên với ô bên trong. */
  preservedParams?: Record<string, string>;
  /** Các `FilterGroup`. */
  children: ReactNode;
}

/** Một form GET bao các nhóm lọc: chưa có JS thì có nút "Áp dụng" (gửi form); có JS thì ô tự điều hướng khi đổi (`useListingFilterNav`) và nút ẩn. */
function FilterForm({ action, preservedParams = {}, children }: FilterFormProps) {
  const t = useTranslations("page.listing.filters");
  const hydrated = useHydrated();
  return (
    <form action={action} method="get" className="flex flex-col gap-5">
      {Object.entries(preservedParams).map(([name, value]) => (value.trim() === "" ? null : <input key={name} type="hidden" name={name} value={value} />))}
      {children}
      {!hydrated && (
        <Button type="submit" className="w-full">
          {t("apply")}
        </Button>
      )}
    </form>
  );
}

interface FilterSidebarProps extends FilterFormProps {
  /** URL "Xoá tất cả" (trang sạch, có thể giữ `q`/danh mục tuỳ trang). Không truyền → không có link xoá. */
  clearHref?: string;
  /** Gọi khi bấm "Xoá tất cả" (truyền `reset` của `useListingFilterNav`). */
  onClear?: () => void;
  className?: string;
}

/**
 * Thẻ "Bộ lọc" cột trái ≥ lg (BL-052, design `list-du-an`): thẻ trắng, tiêu đề + "Xoá tất cả", các nhóm lọc trong `FilterForm`.
 * Có JS: dòng gợi ý (chỉ trình đọc màn hình) báo đổi ô là danh sách cập nhật ngay (WCAG 3.2.2). < lg ẩn — dùng `FilterSheet` cùng nội dung.
 */
export function FilterSidebar({ action, clearHref, onClear, preservedParams, children, className }: FilterSidebarProps) {
  const t = useTranslations("page.listing.filters");
  const hydrated = useHydrated();
  const titleId = useId();
  const hintId = useId();
  return (
    <aside aria-labelledby={titleId} aria-describedby={hydrated ? hintId : undefined} className={cn("rounded-[20px] border border-border bg-surface p-5 shadow-sm max-lg:hidden", className)}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 id={titleId} className="text-h4 font-semibold text-text">
          {t("title")}
        </h2>
        {clearHref && (
          <PendingLink href={clearHref} scroll={false} onClick={onClear} className="inline-flex min-h-11 items-center text-small text-text-secondary underline-offset-4 hover:text-text hover:underline lg:min-h-9">
            {t("clearAll")}
          </PendingLink>
        )}
      </div>
      {hydrated && (
        <p id={hintId} className="sr-only">
          {t("sheetDescription")}
        </p>
      )}
      <FilterForm action={action} preservedParams={preservedParams}>
        {children}
      </FilterForm>
    </aside>
  );
}

interface FilterSheetProps extends FilterFormProps {
  /** Số lọc đang bật (badge trên nút, `countActiveFilters`). */
  activeCount: number;
  clearHref?: string;
  /** Gọi khi bấm "Xoá tất cả" (truyền `reset` của `useListingFilterNav`). */
  onClear?: () => void;
  className?: string;
}

/**
 * < lg: nút "Bộ lọc" (+ badge số lọc đang bật) mở `Sheet` từ dưới lên chứa cùng nội dung với `FilterSidebar` (BL-052). Chân Sheet: "Xoá tất cả" + "Xem kết quả" (đóng Sheet).
 * Chưa có JS (Sheet không mở được): cùng chỗ là `<details>` gốc — nút "Bộ lọc" cùng cỡ mở ra `FilterForm` có "Áp dụng", nên < lg vẫn lọc được bằng form GET
 * và lúc hydrate chỉ đổi nút thu gọn sang nút Sheet cùng kích thước (không xô lệch bố cục).
 */
export function FilterSheet({ activeCount, clearHref, onClear, action, preservedParams, children, className }: FilterSheetProps) {
  const t = useTranslations("page.listing.filters");
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <details className={cn("lg:hidden", className)}>
        <summary className={cn(buttonVariants({ variant: "secondary" }), "h-11 w-fit list-none gap-1.5 px-4 text-small normal-case [&::-webkit-details-marker]:hidden")}>
          <SlidersHorizontal size={16} aria-hidden="true" />
          {t("title")}
          {activeCount > 0 && (
            <span aria-hidden="true" data-testid="filters-count" className="inline-flex size-6 items-center justify-center rounded-full bg-dark text-xsmall text-on-dark">
              {activeCount}
            </span>
          )}
          {/* Tên đọc giống nút Sheet sau hydrate: "Bộ lọc (n)". */}
          {activeCount > 0 && <span className="sr-only"> ({activeCount})</span>}
        </summary>
        <div className="mt-3 rounded-[20px] border border-border bg-surface p-5">
          <FilterForm action={action} preservedParams={preservedParams}>
            {children}
          </FilterForm>
        </div>
      </details>
    );
  }

  return (
    <div className={cn("lg:hidden", className)}>
      <Sheet>
        <SheetTrigger asChild>
          <ListFiltersButton label={t("title")} count={activeCount} className="md:h-11" />
        </SheetTrigger>
        <SheetContent side="bottom" closeLabel={t("close")} className="h-[90svh] gap-0 rounded-t-md p-0">
          <div className="flex flex-col gap-1 border-b border-border px-6 py-4 pr-14">
            <SheetTitle>{t("title")}</SheetTitle>
            <SheetDescription>{t("sheetDescription")}</SheetDescription>
          </div>
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">{children}</div>
          <div className="flex items-center gap-3 border-t border-border bg-surface px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {clearHref && (
              <Button asChild variant="outline">
                <PendingLink href={clearHref} scroll={false} onClick={onClear}>
                  {t("clearAll")}
                </PendingLink>
              </Button>
            )}
            <SheetClose asChild>
              <Button className="flex-1">{t("showResults")}</Button>
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
