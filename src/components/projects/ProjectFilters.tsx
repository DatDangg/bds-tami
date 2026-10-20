"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import { ListOptionCell, ListSearchBar } from "@/components/listing/ListSearchBar";
import { useReportPending } from "@/components/layout/PendingRegion";
import { OptionSelect } from "@/components/ui/option-select";
import { projectQueryString, SALES_STATUS_VALUES } from "@/lib/projects/project-filters";

export interface ProvinceOption {
  slug: string;
  name: string;
}

export interface DeveloperOption {
  id: string;
  name: string;
}

interface ProjectFiltersProps {
  /** Đường dẫn của chính trang (đã có tiền tố ngôn ngữ): đích của form GET. */
  actionPath: string;
  provinces: ProvinceOption[];
  /** Chủ đầu tư có dự án công khai (giá trị lọc `?developer=` là id). */
  developers: DeveloperOption[];
  selectedProvince?: string;
  selectedStatus?: string;
  selectedDeveloper?: string;
  /** Từ khoá đang trên URL (`?q=`). */
  query?: string;
  /** Sắp xếp đang trên URL (`price_asc` | `price_desc`): không có ô trong thẻ lọc nên giữ lại khi áp bộ lọc. */
  sort?: string;
  /** Slug danh mục đang lọc bằng `?category=` (chỉ ở `/du-an`): giữ lại khi áp bộ lọc khác. Trang danh mục khoá danh mục bằng đường dẫn nên không truyền. */
  hiddenCategory?: string;
  /** Hàng 2 "Loại hình" (chip link do server dựng): nằm GIỮA ô từ khoá và hàng "Tùy chọn khác" nhưng cùng một form. */
  categoryRow?: ReactNode;
}

/**
 * Nội dung thẻ lọc nổi của `/du-an` (BL-045, design-spec S02): ô từ khoá `q` + "Tìm kiếm", hàng chip loại hình, hàng "Tùy chọn khác" = Tỉnh/thành + Tình trạng + Chủ đầu tư (OptionSelect `chip`).
 * Form GET thật: không JS thì `<input name="q">` và `<select name>` gốc (OptionSelect progressive) gửi `?q=&province=&status=&developer=` (+ `category`, `sort` giữ bằng input ẩn);
 * có JS thì `router.push` cùng query, chờ gửi báo lên `PendingRegion`. Không tự gửi khi đổi ô chọn (WCAG 3.2.2); gửi luôn về trang 1.
 * Cha nên đặt `key` theo bộ lọc trên URL để các ô nạp lại khi URL đổi từ ngoài (chip, "Xoá bộ lọc", sắp xếp, back).
 */
export function ProjectFilters({
  actionPath,
  provinces,
  developers,
  selectedProvince = "",
  selectedStatus = "",
  selectedDeveloper = "",
  query = "",
  sort = "",
  hiddenCategory,
  categoryRow,
}: ProjectFiltersProps) {
  const t = useTranslations("page.projects");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [keyword, setKeyword] = useState(query);
  const [province, setProvince] = useState(selectedProvince);
  const [status, setStatus] = useState(selectedStatus);
  const [developer, setDeveloper] = useState(selectedDeveloper);
  useReportPending(pending);

  function submit() {
    const url = projectQueryString({ ...(hiddenCategory ? { category: hiddenCategory } : {}), province, status, q: keyword.trim(), developer, sort });
    startTransition(() => router.push(`${actionPath}${url}`));
  }

  return (
    <ListSearchBar
      action={actionPath}
      label={t("filtersLabel")}
      keyword={{ id: "project-filter-q", name: "q", label: t("keywordLabel"), placeholder: t("keywordPlaceholder"), value: keyword, onChange: setKeyword }}
      submitLabel={t("search")}
      onSubmit={submit}
      preservedParams={{ ...(hiddenCategory ? { category: hiddenCategory } : {}), ...(sort ? { sort } : {}) }}
      categoryRow={categoryRow}
      moreLabel={t("moreLabel")}
    >
      <ListOptionCell>
        <OptionSelect
          progressive
          variant="chip"
          name="province"
          aria-label={t("provinceLabel")}
          value={province}
          onValueChange={setProvince}
          options={[{ value: "", label: t("chips.province") }, ...provinces.map((item) => ({ value: item.slug, label: item.name }))]}
          className="w-full"
        />
      </ListOptionCell>
      <ListOptionCell>
        <OptionSelect
          progressive
          variant="chip"
          name="status"
          aria-label={t("statusLabel")}
          value={status}
          onValueChange={setStatus}
          options={[{ value: "", label: t("chips.status") }, ...SALES_STATUS_VALUES.map((value) => ({ value, label: t(`salesStatus.${value}`) }))]}
          className="w-full"
        />
      </ListOptionCell>
      {developers.length > 0 && (
        <ListOptionCell>
          <OptionSelect
            progressive
            variant="chip"
            name="developer"
            aria-label={t("chips.developer")}
            value={developer}
            onValueChange={setDeveloper}
            options={[{ value: "", label: t("chips.developer") }, ...developers.map((item) => ({ value: item.id, label: item.name }))]}
            className="w-full"
          />
        </ListOptionCell>
      )}
    </ListSearchBar>
  );
}
