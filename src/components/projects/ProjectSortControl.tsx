"use client";

import { useTranslations } from "next-intl";
import { useListingNavigate } from "@/components/listing/use-listing-filter-nav";
import { OptionSelect } from "@/components/ui/option-select";
import { DEFAULT_PROJECT_SORT, PROJECT_SORT_VALUES } from "@/lib/projects/project-filters";

interface ProjectSortControlProps {
  /** Sắp xếp đang trên URL; trống = mặc định `newest`. */
  value?: string;
}

/**
 * Ô "Sắp xếp theo" ở hàng kết quả `/du-an` (BL-045; nhãn BL-052): Mới nhất (mặc định, không lên URL) / Giá tăng / Giá giảm; đổi là điều hướng ngay qua `navigate`
 * của thân trang (giữ bộ lọc trên URL lẫn thay đổi lọc đang chờ, về trang 1). Phải nằm trong `ProjectListBody`.
 */
export function ProjectSortControl({ value = DEFAULT_PROJECT_SORT }: ProjectSortControlProps) {
  const t = useTranslations("page.projects");
  const navigate = useListingNavigate();

  return (
    <div className="flex min-w-0 items-center gap-3">
      <label htmlFor="project-sort" className="text-small font-semibold max-sm:sr-only">
        {t("sortBy")}
      </label>
      <OptionSelect
        id="project-sort"
        variant="chip"
        value={value}
        onValueChange={(sort) => navigate({ sort: sort === DEFAULT_PROJECT_SORT ? null : sort })}
        options={PROJECT_SORT_VALUES.map((sort) => ({ value: sort, label: t(`sort.${sort}`) }))}
        className="w-full min-w-[11rem] bg-surface sm:w-52"
      />
    </div>
  );
}
