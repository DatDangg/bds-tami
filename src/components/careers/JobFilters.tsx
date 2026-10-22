import { useTranslations } from "next-intl";
import Form from "next/form";
import { MagnifyingGlass, MapPin } from "@/components/icons";
import { FormPendingMarker, PendingLink } from "@/components/layout/PendingRegion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  /** Từ khoá đang trên URL (`?q=`). */
  keyword?: string;
  /** Slug danh mục đang lọc bằng `?category=`: giữ lại khi áp bộ lọc tỉnh / từ khoá. */
  hiddenCategory?: string;
  /** Có bộ lọc đang bật → hiện nút xoá. */
  active: boolean;
}

/**
 * Ô "Khu vực" + ô tìm theo tên vị trí (BL-054, design `tuyen-dung.webp`): MỘT `<Form>` (next/form, GET) nên chia sẻ được qua URL, chạy không cần JS
 * (rơi về form GET thường) và bằng bàn phím (ô chọn TAMI, trước khi hydrate là `select` gốc đã style; không tự gửi khi đổi giá trị, WCAG 3.2.2 → nút "Tìm").
 * Nhãn ẩn trực quan (design chỉ có icon + placeholder) nhưng vẫn gắn `label`. Gửi form luôn về trang 1. Server Component.
 */
export function JobFilters({ actionPath, provinces, selectedProvince, keyword, hiddenCategory, active }: JobFiltersProps) {
  const t = useTranslations("page.careers");
  const tv = useTranslations("page.careers.v2");
  return (
    <Form action={actionPath} aria-label={t("filtersLabel")} className="grid w-full grid-cols-1 gap-3 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_auto] sm:items-center xl:w-auto xl:grid-cols-[13rem_18rem_auto]">
      {hiddenCategory && <input type="hidden" name="category" value={hiddenCategory} />}
      <div className="relative min-w-0">
        <label htmlFor="job-filter-province" className="sr-only">
          {tv("provinceLabel")}
        </label>
        <MapPin size={18} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 text-text" />
        <OptionSelect
          progressive
          id="job-filter-province"
          name="province"
          defaultValue={selectedProvince ?? ""}
          className="rounded-pill pl-11 text-small"
          options={[{ value: "", label: tv("allProvinces") }, ...provinces.map((province) => ({ value: province.slug, label: province.name }))]}
        />
      </div>
      <div className="relative min-w-0">
        <label htmlFor="job-filter-q" className="sr-only">
          {tv("searchLabel")}
        </label>
        <MagnifyingGlass size={18} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-text-muted" />
        {/* `key` theo từ khoá trên URL: back / chip đổi `q` thì ô nạp lại giá trị mới. */}
        <Input
          key={keyword ?? ""}
          id="job-filter-q"
          name="q"
          type="search"
          maxLength={100}
          autoComplete="off"
          placeholder={tv("searchPlaceholder")}
          defaultValue={keyword ?? ""}
          className="rounded-pill pl-11 text-small"
        />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="outline" className="flex-1 sm:flex-none">
          {tv("submit")}
        </Button>
        {active && (
          <PendingLink href={actionPath} className="inline-flex min-h-11 items-center px-2 text-small font-semibold whitespace-nowrap underline underline-offset-4">
            {t("clear")}
          </PendingLink>
        )}
      </div>
      <FormPendingMarker />
    </Form>
  );
}
