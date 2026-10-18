import { useTranslations } from "next-intl";
import Form from "next/form";
import { FormPendingMarker, PendingLink } from "@/components/layout/PendingRegion";
import { Button } from "@/components/ui/button";
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

const SELECT_CLASS =
  "h-12 w-full rounded-sm border border-input bg-surface px-3 font-sans text-body text-text focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

/**
 * Hai ô lọc Tỉnh/thành và Trạng thái (design-spec S02): `<Form>` (next/form, GET) nên chia sẻ được qua URL, dùng được
 * không cần JS (rơi về form GET thường) và bằng bàn phím (`select` gốc + nút "Lọc"; không tự gửi khi đổi giá trị, WCAG 3.2.2). Gửi form luôn về trang 1.
 * Chờ gửi báo lên `PendingRegion`.
 */
export function ProjectFilters({ actionPath, provinces, selectedProvince, selectedStatus, hiddenCategory, active }: ProjectFiltersProps) {
  const t = useTranslations("page.projects");
  return (
    <Form action={actionPath} aria-label={t("filtersLabel")} className="grid w-full grid-cols-2 gap-3 lg:flex lg:w-auto lg:items-end">
      {hiddenCategory && <input type="hidden" name="category" value={hiddenCategory} />}
      <label className="flex min-w-0 flex-col gap-1 text-small font-semibold lg:w-56">
        {t("provinceLabel")}
        <select name="province" defaultValue={selectedProvince ?? ""} className={SELECT_CLASS}>
          <option value="">{t("allProvinces")}</option>
          {provinces.map((province) => (
            <option key={province.slug} value={province.slug}>
              {province.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-w-0 flex-col gap-1 text-small font-semibold lg:w-48">
        {t("statusLabel")}
        <select name="status" defaultValue={selectedStatus ?? ""} className={SELECT_CLASS}>
          <option value="">{t("allStatuses")}</option>
          {SALES_STATUS_VALUES.map((status) => (
            <option key={status} value={status}>
              {t(`salesStatus.${status}`)}
            </option>
          ))}
        </select>
      </label>
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
