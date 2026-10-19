import { useTranslations } from "next-intl";
import Form from "next/form";
import { FormPendingMarker, PendingLink } from "@/components/layout/PendingRegion";
import { Button } from "@/components/ui/button";
import { OptionSelect } from "@/components/ui/option-select";

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

/**
 * Ô lọc Nơi làm việc (design-spec S12): `<Form>` (next/form, GET) nên chia sẻ được qua URL, dùng được không cần JS (rơi về form GET thường) và bằng bàn phím
 * (ô chọn TAMI, trước khi hydrate là `select` gốc đã style + nút "Lọc", không tự gửi khi đổi giá trị, WCAG 3.2.2). Gửi form luôn về trang 1. Server Component.
 */
export function JobFilters({ actionPath, provinces, selectedProvince, hiddenCategory, active }: JobFiltersProps) {
  const t = useTranslations("page.careers");
  return (
    <Form action={actionPath} aria-label={t("filtersLabel")} className="grid w-full grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-end lg:flex lg:w-auto">
      {hiddenCategory && <input type="hidden" name="category" value={hiddenCategory} />}
      <div className="flex min-w-0 flex-col gap-1 lg:w-56">
        <label htmlFor="job-filter-province" className="text-small font-semibold">
          {t("provinceLabel")}
        </label>
        <OptionSelect
          progressive
          id="job-filter-province"
          name="province"
          defaultValue={selectedProvince ?? ""}
          options={[{ value: "", label: t("allProvinces") }, ...provinces.map((province) => ({ value: province.slug, label: province.name }))]}
        />
      </div>
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
