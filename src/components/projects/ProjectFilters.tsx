import { useTranslations } from "next-intl";
import Form from "next/form";
import { FormPendingMarker, PendingLink } from "@/components/layout/PendingRegion";
import { Button } from "@/components/ui/button";
import { OptionSelect } from "@/components/ui/option-select";
import { SALES_STATUS_VALUES } from "@/lib/projects/project-filters";

export interface ProvinceOption {
  slug: string;
  name: string;
}

interface ProjectFiltersProps {
  /** Đường dẫn của chính trang (đã có tiền tố ngôn ngữ): đích của form GET và của nút "Xoá bộ lọc". */
  actionPath: string;
  provinces: ProvinceOption[];
  selectedProvince?: string;
  selectedStatus?: string;
  /** Slug danh mục đang lọc bằng `?category=` (chỉ ở `/du-an`): giữ lại khi áp bộ lọc khác. Trang danh mục khoá danh mục bằng đường dẫn nên không truyền. */
  hiddenCategory?: string;
  /** Có bộ lọc đang bật → hiện nút xoá. */
  active: boolean;
}

/**
 * Hai ô lọc Tỉnh/thành và Trạng thái (design-spec S02): `<Form>` (next/form, GET) nên chia sẻ được qua URL, dùng được
 * không cần JS (rơi về form GET thường) và bằng bàn phím (ô chọn TAMI, trước khi hydrate là `select` gốc đã style + nút "Lọc"; không tự gửi khi đổi giá trị, WCAG 3.2.2). Gửi form luôn về trang 1.
 * Chờ gửi báo lên `PendingRegion`.
 */
export function ProjectFilters({ actionPath, provinces, selectedProvince, selectedStatus, hiddenCategory, active }: ProjectFiltersProps) {
  const t = useTranslations("page.projects");
  return (
    <Form action={actionPath} aria-label={t("filtersLabel")} className="grid w-full grid-cols-2 gap-3 lg:flex lg:w-auto lg:items-end">
      {hiddenCategory && <input type="hidden" name="category" value={hiddenCategory} />}
      <div className="flex min-w-0 flex-col gap-1 lg:w-56">
        <label htmlFor="project-filter-province" className="text-small font-semibold">
          {t("provinceLabel")}
        </label>
        <OptionSelect
          progressive
          id="project-filter-province"
          name="province"
          defaultValue={selectedProvince ?? ""}
          options={[{ value: "", label: t("allProvinces") }, ...provinces.map((province) => ({ value: province.slug, label: province.name }))]}
        />
      </div>
      <div className="flex min-w-0 flex-col gap-1 lg:w-48">
        <label htmlFor="project-filter-status" className="text-small font-semibold">
          {t("statusLabel")}
        </label>
        <OptionSelect
          progressive
          id="project-filter-status"
          name="status"
          defaultValue={selectedStatus ?? ""}
          options={[{ value: "", label: t("allStatuses") }, ...SALES_STATUS_VALUES.map((status) => ({ value: status, label: t(`salesStatus.${status}`) }))]}
        />
      </div>
      <div className="col-span-2 flex items-center gap-3 lg:col-span-1">
        <Button type="submit" variant="outline" className="flex-1 lg:flex-none">
          {t("apply")}
        </Button>
        {active && (
          <PendingLink href={actionPath} className="inline-flex min-h-11 items-center px-2 text-small font-semibold underline underline-offset-4">
            {t("clear")}
          </PendingLink>
        )}
      </div>
      <FormPendingMarker />
    </Form>
  );
}
