"use client";

import { useTranslations } from "next-intl";
import { X } from "@/components/icons";
import { ListFiltersButton } from "@/components/listing/ListSearchBar";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FilterFields, type FieldOptions } from "./FilterFields";
import type { FilterDraft } from "./use-rental-draft";

interface RentalFilterPopoverProps {
  /** Dùng chung bản nháp với băng tìm kiếm (áp dụng ngay, như thanh lọc cũ ≥ lg). */
  draft: FilterDraft;
  onChange: (patch: Partial<FilterDraft>, mode: "now" | "typing") => void;
  options: FieldOptions;
  activeCount: number;
}

/** "Bộ lọc" ≥ lg: Popover modal (bẫy focus, Esc đóng, trả focus về nút) chứa các lọc phụ; mỗi ô đổi URL ngay. */
export function RentalFilterPopover({ draft, onChange, options, activeCount }: RentalFilterPopoverProps) {
  const t = useTranslations("page.rentals.mobile");
  return (
    <Popover modal>
      <PopoverTrigger asChild>
        <ListFiltersButton label={t("filters")} count={activeCount} />
      </PopoverTrigger>
      <PopoverContent aria-label={t("sheetTitle")} className="max-h-[min(70dvh,640px)] w-[26rem] overflow-y-auto pt-12">
        <PopoverClose aria-label={t("close")} className="absolute top-2 right-2 inline-flex size-11 cursor-pointer items-center justify-center rounded-sm text-text-secondary hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
          <X size={20} aria-hidden="true" />
        </PopoverClose>
        <FilterFields idPrefix="rental-popover" draft={draft} options={options} onChange={onChange} />
      </PopoverContent>
    </Popover>
  );
}
