"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useReportPending } from "@/components/layout/PendingRegion";
import { OptionSelect } from "@/components/ui/option-select";
import { DEFAULT_PROJECT_SORT, PROJECT_SORT_VALUES, projectQueryString, type ProjectQueryParams } from "@/lib/projects/project-filters";

interface ProjectSortControlProps {
  /** Đường dẫn của chính trang (đã có tiền tố ngôn ngữ). */
  actionPath: string;
  /** Sắp xếp đang trên URL; trống = mặc định `newest`. */
  value?: string;
  /** Bộ lọc đang trên URL (danh mục, tỉnh, tình trạng, từ khoá, chủ đầu tư, loại, tiện ích, giá): giữ nguyên, đổi sắp xếp luôn về trang 1. */
  params: Omit<ProjectQueryParams, "sort" | "page">;
}

/** Ô "Sắp xếp theo" ở hàng kết quả `/du-an` (BL-045; nhãn BL-052): Mới nhất (mặc định, không lên URL) / Giá tăng / Giá giảm; đổi là đổi URL ngay, giữ mọi bộ lọc trên URL. */
export function ProjectSortControl({ actionPath, value = DEFAULT_PROJECT_SORT, params }: ProjectSortControlProps) {
  const t = useTranslations("page.projects");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useReportPending(pending);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <label htmlFor="project-sort" className="text-small font-semibold max-sm:sr-only">
        {t("sortBy")}
      </label>
      <OptionSelect
        id="project-sort"
        variant="chip"
        value={value}
        onValueChange={(sort) => startTransition(() => router.push(`${actionPath}${projectQueryString({ ...params, sort })}`))}
        options={PROJECT_SORT_VALUES.map((sort) => ({ value: sort, label: t(`sort.${sort}`) }))}
        className="w-full min-w-[11rem] bg-surface sm:w-52"
      />
    </div>
  );
}
