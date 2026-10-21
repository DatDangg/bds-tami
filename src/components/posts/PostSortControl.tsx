"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useReportPending } from "@/components/layout/PendingRegion";
import { listingHref } from "@/components/listing/listing-params";
import { OptionSelect } from "@/components/ui/option-select";
import { DEFAULT_POST_SORT, POST_SORT_VALUES } from "@/lib/posts/post-filters";

interface PostSortControlProps {
  /** Đường dẫn của chính trang (`/tin-bds` hoặc route danh mục, đã có tiền tố ngôn ngữ). */
  actionPath: string;
  /** Bộ lọc + sắp xếp đang trên URL (đã đối chiếu, không `page`): đổi sắp xếp giữ nguyên lọc, về trang 1. */
  current: Record<string, string>;
}

/**
 * Ô "Sắp xếp theo" ở hàng kết quả `/tin-bds` (BL-052, cùng kiểu `RentalSortControl`): Mới nhất (mặc định, không lên URL) / Giá tăng dần / Giá giảm dần;
 * đổi là điều hướng ngay, giữ mọi bộ lọc trên URL. Nhãn chỉ hiện từ `sm` (< sm còn cho trình đọc màn hình). Cần JS như ô sắp xếp các trang danh sách khác.
 */
export function PostSortControl({ actionPath, current }: PostSortControlProps) {
  const t = useTranslations("page.posts.list");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useReportPending(pending);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <label htmlFor="post-sort" className="text-small font-semibold max-sm:sr-only">
        {t("sortBy")}
      </label>
      <OptionSelect
        id="post-sort"
        variant="chip"
        value={current.sort ?? DEFAULT_POST_SORT}
        onValueChange={(sort) => startTransition(() => router.push(listingHref(actionPath, current, { sort: sort === DEFAULT_POST_SORT ? null : sort }), { scroll: false }))}
        options={POST_SORT_VALUES.map((sort) => ({ value: sort, label: t(`sort.${sort}`) }))}
        className="w-full min-w-[11rem] bg-surface sm:w-52"
      />
    </div>
  );
}
