"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ListSearchBar, ListSearchField } from "@/components/listing/ListSearchBar";
import { useReportPending } from "@/components/layout/PendingRegion";
import { OptionSelect } from "@/components/ui/option-select";
import { projectQueryString, SALES_STATUS_VALUES } from "@/lib/projects/project-filters";

export interface ProvinceOption {
  slug: string;
  name: string;
}

interface ProjectFiltersProps {
  /** Đường dẫn của chính trang (đã có tiền tố ngôn ngữ): đích của form GET. */
  actionPath: string;
  provinces: ProvinceOption[];
  selectedProvince?: string;
  selectedStatus?: string;
  /** Slug danh mục đang lọc bằng `?category=` (chỉ ở `/du-an`): giữ lại khi áp bộ lọc khác. Trang danh mục khoá danh mục bằng đường dẫn nên không truyền. */
  hiddenCategory?: string;
}

/**
 * Băng tìm kiếm gọn của `/du-an` (design-spec S02, BL-020 P3): hai ô chọn Tỉnh/thành + Trạng thái trên `ListSearchBar` (không có ô từ khoá — danh sách dự án không tìm theo chữ,
 * và không có lọc phụ nên không có nút "Bộ lọc"). Form GET thật: không JS thì `<select name>` gốc (OptionSelect progressive) gửi `?province=&status=` (+ `category` giữ bằng input ẩn);
 * có JS thì `router.push` cùng query, chờ gửi báo lên `PendingRegion`. Không tự gửi khi đổi giá trị (WCAG 3.2.2); gửi luôn về trang 1.
 * Cha nên đặt `key` theo bộ lọc trên URL để ô nạp lại khi URL đổi từ ngoài (chip, nút Xoá).
 */
export function ProjectFilters({ actionPath, provinces, selectedProvince = "", selectedStatus = "", hiddenCategory }: ProjectFiltersProps) {
  const t = useTranslations("page.projects");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [province, setProvince] = useState(selectedProvince);
  const [status, setStatus] = useState(selectedStatus);
  useReportPending(pending);

  function submit() {
    const query = projectQueryString({ ...(hiddenCategory ? { category: hiddenCategory } : {}), province, status });
    startTransition(() => router.push(`${actionPath}${query}`));
  }

  return (
    <ListSearchBar
      action={actionPath}
      label={t("filtersLabel")}
      submitLabel={t("apply")}
      onSubmit={submit}
      preservedParams={hiddenCategory ? { category: hiddenCategory } : {}}
    >
      <ListSearchField label={t("provinceLabel")} htmlFor="project-filter-province">
        <OptionSelect
          progressive
          id="project-filter-province"
          name="province"
          value={province}
          onValueChange={setProvince}
          options={[{ value: "", label: t("barAllProvinces") }, ...provinces.map((item) => ({ value: item.slug, label: item.name }))]}
          className="rounded-md"
        />
      </ListSearchField>
      <ListSearchField label={t("statusLabel")} htmlFor="project-filter-status">
        <OptionSelect
          progressive
          id="project-filter-status"
          name="status"
          value={status}
          onValueChange={setStatus}
          options={[{ value: "", label: t("barAllStatuses") }, ...SALES_STATUS_VALUES.map((value) => ({ value, label: t(`salesStatus.${value}`) }))]}
          className="rounded-md"
        />
      </ListSearchField>
    </ListSearchBar>
  );
}
