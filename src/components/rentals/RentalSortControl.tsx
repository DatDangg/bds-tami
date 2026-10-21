"use client";

import { useTranslations } from "next-intl";
import { useListingNavigate } from "@/components/listing/use-listing-filter-nav";
import { OptionSelect } from "@/components/ui/option-select";
import { DEFAULT_RENTAL_SORT } from "@/lib/search/url-params";
import { RENTAL_SORTS, type RentalSort } from "@/shared/types/api";

interface RentalSortControlProps {
  /** Sắp xếp đang trên URL (đã đối chiếu). */
  value: RentalSort;
}

/**
 * Ô "Sắp xếp theo" ở hàng kết quả `/cho-thue` (BL-052, cùng kiểu `ProjectSortControl`): Mới nhất (mặc định, không lên URL) / Giá tăng dần / Giá giảm dần;
 * đổi là điều hướng ngay qua `navigate` của thân trang (giữ bộ lọc trên URL lẫn thay đổi lọc đang chờ, về trang 1). Nhãn chỉ hiện từ `sm` (< sm còn nhãn cho trình đọc màn hình)
 * để giá trị đọc được ở 375px. Cần JS như trước; phải nằm trong `RentalListBody`.
 */
export function RentalSortControl({ value }: RentalSortControlProps) {
  const t = useTranslations("page.rentals");
  const navigate = useListingNavigate();

  return (
    <div className="flex min-w-0 items-center gap-3">
      <label htmlFor="rental-sort" className="text-small font-semibold max-sm:sr-only">
        {t("sortBy")}
      </label>
      <OptionSelect
        id="rental-sort"
        variant="chip"
        value={value}
        onValueChange={(sort) => navigate({ sort: sort === DEFAULT_RENTAL_SORT ? null : sort })}
        options={RENTAL_SORTS.map((sort) => ({ value: sort, label: t(`sort.${sort}`) }))}
        className="w-full min-w-[11rem] bg-surface sm:w-52"
      />
    </div>
  );
}
