"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { ListFiltersButton } from "@/components/listing/ListSearchBar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { RentalFilterOptions } from "@/lib/rentals/rental-list-queries";
import { parseRentalFilters, type RentalFilters, rentalCountApiPath, secondaryFilterCount } from "@/lib/search/url-params";
import { FilterFields } from "./FilterFields";
import { useRentalListNavigation } from "./RentalListNavigation";
import { useApiJson } from "./use-api-json";
import { draftOf, type FilterDraft, queryOfDraft } from "./use-rental-draft";
import { useWardOptions } from "./use-ward-options";

interface CountResponse {
  data?: { total?: number };
}

interface RentalFilterSheetProps {
  /** Bộ lọc đang trên URL (nạp vào Sheet mỗi lần mở; số trên nút "Bộ lọc (n)"). */
  filters: RentalFilters;
  /** Sắp xếp đang chọn (Sheet không có ô sắp xếp nhưng khi áp dụng phải giữ nó). */
  sort: string;
  options: RentalFilterOptions;
  /** Trang danh mục (S05): danh mục khoá, không nằm trong bản nháp nhưng phải có trong truy vấn đếm. */
  fixedCategory?: string | undefined;
}

/** "Xoá" chỉ dọn các lọc PHỤ trong Sheet; từ khoá và danh mục nằm ở băng tìm kiếm nên giữ nguyên. */
const CLEARED: Pick<FilterDraft, "province" | "ward" | "priceMin" | "priceMax" | "areaMin" | "areaMax" | "bedrooms" | "furnishing"> = { province: "", ward: "", priceMin: "", priceMax: "", areaMin: "", areaMax: "", bedrooms: "", furnishing: "" };

/**
 * Nút "Bộ lọc" (+ huy hiệu n) + Sheet từ dưới lên cao 90svh (design-spec §3.5, < lg) chứa các lọc phụ. Khác Popover desktop: ô lọc KHÔNG đổi URL ngay mà gom vào bản nháp; chân Sheet
 * dính có "Xoá" và "Xem n tin" (n lấy sống từ `GET /api/public/rentals?limit=1` theo bản nháp). Áp dụng mới đổi URL.
 */
export function RentalFilterSheet({ filters, sort, options, fixedCategory }: RentalFilterSheetProps) {
  const t = useTranslations("page.rentals.mobile");
  const locale = useLocale() as "vi" | "en";
  const { navigate } = useRentalListNavigation();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => draftOf(filters));
  const { wards, loading: wardsLoading } = useWardOptions(draft.province, options);
  const draftFilters = parseRentalFilters(fixedCategory ? { ...draft, category: fixedCategory } : draft);
  const count = useApiJson<CountResponse>(open ? rentalCountApiPath(draftFilters, locale) : null, 300);
  const total = count.data?.data?.total;
  const activeCount = secondaryFilterCount(filters);

  function handleOpenChange(next: boolean) {
    if (next) setDraft(draftOf(filters));
    setOpen(next);
  }

  function apply() {
    navigate(queryOfDraft({ ...draft, sort }));
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <ListFiltersButton label={t("filters")} count={activeCount} />
      </SheetTrigger>
      <SheetContent side="bottom" closeLabel={t("close")} className="h-[90svh] gap-0 rounded-t-md p-0">
        <div className="flex flex-col gap-1 border-b border-border px-6 py-4 pr-14">
          <SheetTitle>{t("sheetTitle")}</SheetTitle>
          <SheetDescription>{t("sheetDescription")}</SheetDescription>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <FilterFields
            idPrefix="rental-sheet"
            draft={draft}
            options={{ provinces: options.provinces, wards, wardsLoading }}
            onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
          />
        </div>
        <div className="flex items-center gap-3 border-t border-border bg-surface px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Button variant="outline" onClick={() => setDraft((current) => ({ ...current, ...CLEARED }))}>
            {t("clear")}
          </Button>
          <Button className="flex-1" onClick={apply}>
            {total === undefined ? t("showUnknown") : t("show", { count: total })}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
