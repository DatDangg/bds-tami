"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useReportPending } from "@/components/layout/PendingRegion";
import { OptionSelect } from "@/components/ui/option-select";
import { type RentalFilters, rentalListQueryString } from "@/lib/search/url-params";
import { RENTAL_SORTS } from "@/shared/types/api";

interface RentalSortControlProps {
  /** Đường dẫn của chính trang (`/cho-thue` hoặc route danh mục, đã có tiền tố ngôn ngữ). */
  actionPath: string;
  /** Bộ lọc + sắp xếp đang trên URL (đã đối chiếu): đổi sắp xếp giữ nguyên lọc, về trang 1. */
  filters: RentalFilters;
}

/**
 * Ô "Sắp xếp theo" ở hàng kết quả `/cho-thue` (BL-052, cùng kiểu `ProjectSortControl`): Mới nhất (mặc định, không lên URL) / Giá tăng dần / Giá giảm dần;
 * đổi là điều hướng ngay, giữ mọi bộ lọc trên URL. Nhãn chỉ hiện từ `sm` (< sm còn nhãn cho trình đọc màn hình) để giá trị đọc được ở 375px. Cần JS như trước.
 */
export function RentalSortControl({ actionPath, filters }: RentalSortControlProps) {
  const t = useTranslations("page.rentals");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useReportPending(pending);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <label htmlFor="rental-sort" className="text-small font-semibold max-sm:sr-only">
        {t("sortBy")}
      </label>
      <OptionSelect
        id="rental-sort"
        variant="chip"
        value={filters.sort}
        onValueChange={(sort) => startTransition(() => router.push(`${actionPath}${rentalListQueryString({ ...filters, sort: sort as RentalFilters["sort"], page: 1 })}`, { scroll: false }))}
        options={RENTAL_SORTS.map((sort) => ({ value: sort, label: t(`sort.${sort}`) }))}
        className="w-full min-w-[11rem] bg-surface sm:w-52"
      />
    </div>
  );
}
