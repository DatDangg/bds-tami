"use client";

import { useTranslations } from "next-intl";
import { useListingNavigate } from "@/components/listing/use-listing-filter-nav";
import { OptionSelect } from "@/components/ui/option-select";
import { DEFAULT_POST_SORT, POST_SORT_VALUES } from "@/lib/posts/post-filters";

interface PostSortControlProps {
  /** Sắp xếp đang trên URL; trống = mặc định. */
  value?: string;
}

/**
 * Ô "Sắp xếp theo" ở hàng kết quả `/tin-bds` (BL-052, cùng kiểu `RentalSortControl`): Mới nhất (mặc định, không lên URL) / Giá tăng dần / Giá giảm dần;
 * đổi là điều hướng ngay qua `navigate` của thân trang (giữ bộ lọc trên URL lẫn thay đổi lọc đang chờ, về trang 1). Nhãn chỉ hiện từ `sm` (< sm còn cho trình đọc màn hình).
 * Cần JS như ô sắp xếp các trang danh sách khác; phải nằm trong `PostListBody`.
 */
export function PostSortControl({ value = DEFAULT_POST_SORT }: PostSortControlProps) {
  const t = useTranslations("page.posts.list");
  const navigate = useListingNavigate();

  return (
    <div className="flex min-w-0 items-center gap-3">
      <label htmlFor="post-sort" className="text-small font-semibold max-sm:sr-only">
        {t("sortBy")}
      </label>
      <OptionSelect
        id="post-sort"
        variant="chip"
        value={value}
        onValueChange={(sort) => navigate({ sort: sort === DEFAULT_POST_SORT ? null : sort })}
        options={POST_SORT_VALUES.map((sort) => ({ value: sort, label: t(`sort.${sort}`) }))}
        className="w-full min-w-[11rem] bg-surface sm:w-52"
      />
    </div>
  );
}
