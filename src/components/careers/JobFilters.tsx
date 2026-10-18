import { useTranslations } from "next-intl";
import Form from "next/form";
import { FormPendingMarker, PendingLink } from "@/components/layout/PendingRegion";
import { Button } from "@/components/ui/button";

export interface JobProvinceOption {
  slug: string;
  name: string;
}

interface JobFiltersProps {
  /** Đường dẫn của chính trang (đã có tiền tố ngôn ngữ): đích của form GET và của nút "Xoá bộ lọc". */
  actionPath: string;
  provinces: JobProvinceOption[];
  selectedProvince?: string;
  /** Slug danh mục đang lọc bằng `?category=`: giữ lại khi áp bộ lọc tỉnh. */
  hiddenCategory?: string;
  /** Có bộ lọc đang bật → hiện nút xoá. */
  active: boolean;
}

const SELECT_CLASS =
  "h-12 w-full rounded-sm border border-input bg-surface px-3 font-sans text-body text-text focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

/**
 * Ô lọc Nơi làm việc (design-spec S12): `<Form>` (next/form, GET) nên chia sẻ được qua URL, dùng được không cần JS (rơi về form GET thường) và bằng bàn phím
 * (`select` gốc + nút "Lọc", không tự gửi khi đổi giá trị, WCAG 3.2.2). Gửi form luôn về trang 1. Server Component.
 */
export function JobFilters({ actionPath, provinces, selectedProvince, hiddenCategory, active }: JobFiltersProps) {
  const t = useTranslations("page.careers");
  return (
    <Form action={actionPath} aria-label={t("filtersLabel")} className="grid w-full grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-end lg:flex lg:w-auto">
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
      <div className="flex items-center gap-3">
        <Button type="submit" variant="outline" className="flex-1 sm:flex-none">
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
