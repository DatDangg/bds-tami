"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, type KeyboardEvent, useId, useRef, useState } from "react";
import { ArrowRight, CaretDown, MagnifyingGlass } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OptionSelect, type SelectOption } from "@/components/ui/option-select";
import type { HeroSearchChipView } from "@/lib/home/home-view";
import { SALES_STATUS_VALUES } from "@/lib/projects/project-filters";
import { AREA_HINT_RANGES, PRICE_HINT_RANGES, type RentalFilters, rentalListQueryString } from "@/lib/search/url-params";
import { cn } from "@/lib/utils";
import { RENTAL_AMENITIES, RENTAL_FURNISHINGS } from "@/shared/types/api";

/** Tên tham số từ khoá CÓ SẴN của `/cho-thue` (`parseRentalFilters`, trùng `GET /api/public/rentals`). `/du-an` không có từ khoá: tab Dự án lọc bằng `province`/`status` có sẵn của nó. */
export const RENTAL_KEYWORD_PARAM = "q";
/** Mốc diện tích (BL-044): dùng chung với thẻ lọc Cho thuê nên nằm ở `url-params`; re-export giữ tên cũ. Tên ô `areaRange`/`priceRange` KHÔNG trùng tham số của `/cho-thue` (mốc cần JS để tách min/max). */
export { AREA_HINT_RANGES };
const TABS = ["rentals", "projects"] as const;
type Tab = (typeof TABS)[number];

const TAB_BASE =
  "inline-flex h-11 cursor-pointer items-center justify-center rounded-pill px-5 font-sans text-button-sm font-semibold uppercase transition-colors duration-(--duration-fast) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";
const CHIP_LINK =
  "inline-flex h-11 items-center rounded-pill border border-border bg-surface px-4 text-small text-text transition-colors duration-(--duration-fast) hover:border-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring md:h-10";
/** Nhãn đầu hàng chip / "Tùy chọn khác": cùng bề rộng ≥ md để hai hàng thẳng cột như mockup. */
const ROW_LABEL = "shrink-0 text-small font-semibold text-text md:w-40 md:whitespace-nowrap";
const ROUND_BUTTON =
  "inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-input-border text-text transition-colors duration-(--duration-fast) hover:border-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring md:size-10";

interface HeroSearchProps {
  placeholder: string | null;
  chips: HeroSearchChipView[];
  /** Đường dẫn đã bản địa hoá của danh sách cho thuê / dự án (form GET gửi thẳng tới đây). */
  rentalsHref: string;
  projectsHref: string;
  /** Tỉnh/thành cho ô lọc tab Dự án (slug là giá trị `?province=` của `/du-an`). */
  provinces: { slug: string; name: string }[];
  /** Danh mục cho thuê cấp 1 cho ô "Loại căn hộ" (slug là giá trị `?category=` của `/cho-thue`). */
  rentalCategories: { slug: string; name: string }[];
}

const isOneOf = <T extends string>(list: readonly T[], value: FormDataEntryValue | null): value is T => typeof value === "string" && (list as readonly string[]).includes(value);

/**
 * Bộ lọc của `/cho-thue` từ form tab Cho thuê: giá trị "Tất cả" ("") không lên URL; mốc giá/diện tích tách thành cặp min/max; ô đơn trị chỉ nhận giá trị
 * trong danh sách (giá trị lạ bị bỏ như `parseRentalFilters`).
 */
export function rentalFiltersFromForm(form: FormData): RentalFilters {
  const price = PRICE_HINT_RANGES.find((hint) => hint.key === form.get("priceRange"));
  const area = AREA_HINT_RANGES.find((hint) => hint.key === form.get("areaRange"));
  const keyword = form.get(RENTAL_KEYWORD_PARAM);
  const category = form.get("category");
  const furnishing = form.get("furnishing");
  const amenity = form.get("amenities");
  return {
    ...(typeof keyword === "string" && keyword.trim() ? { q: keyword.trim() } : {}),
    ...(typeof category === "string" && category ? { category } : {}),
    ...(price?.min !== undefined ? { priceMin: price.min } : {}),
    ...(price?.max !== undefined ? { priceMax: price.max } : {}),
    ...(area?.min !== undefined ? { areaMin: area.min } : {}),
    ...(area?.max !== undefined ? { areaMax: area.max } : {}),
    ...(isOneOf(RENTAL_FURNISHINGS, furnishing) ? { furnishing } : {}),
    ...(isOneOf(RENTAL_AMENITIES, amenity) ? { amenities: [amenity] } : {}),
    sort: "newest",
    page: 1,
  };
}

/**
 * Ô tìm kiếm đè đáy hero từ md (dưới hero trên mobile) — SPECIFICATIONS F1 "Bố cục theo mockup mới" (BL-044). Hàng 1 tab Cho thuê / Dự án; hàng 2 ô từ khoá (kính lúp trong ô) + nút Tìm kiếm;
 * hàng 3 chip "Dự án được quan tâm" gọn 1 hàng + nút mở; hàng 4 (chỉ tab Cho thuê) "Tùy chọn khác": 5 ô chọn kiểu chip lọc THẬT của `/cho-thue`
 * (Mức giá → `priceMin`/`priceMax`, Diện tích → `areaMin`/`areaMax`, Loại căn hộ → `category`, Nội thất → `furnishing`, Tiện ích → `amenities`, D2) — có JS thì `onSubmit`
 * dựng URL bằng `rentalListQueryString` (cùng thứ tự khoá với trang đích); chưa có JS thì form GET gửi `q` + ô đơn trị (HTML server dựng sẵn tab Cho thuê).
 * Tab "Dự án" là form GET tới `/du-an` với ĐÚNG hai tham số lọc có sẵn của trang đó (`province`, `status`), giữ nguyên.
 * Chip "Dự án được quan tâm" là link thẳng tới chi tiết dự án, mobile vuốt ngang. Dữ liệu chip/danh mục do server nạp (không fetch ở client).
 */
export function HeroSearch({ placeholder, chips, rentalsHref, projectsHref, provinces, rentalCategories }: HeroSearchProps) {
  const t = useTranslations("page.home.search");
  const tProjects = useTranslations("page.projects");
  const tRentals = useTranslations("page.rentals");
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("rentals");
  const [chipsExpanded, setChipsExpanded] = useState(false);
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});
  const uid = useId();
  const inputId = `${uid}-keyword`;
  const chipsLabelId = `${uid}-chips`;
  const chipsListId = `${uid}-chips-list`;
  const moreOptionsId = `${uid}-more`;
  const provinceId = `${uid}-province`;
  const statusId = `${uid}-status`;

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const lastIndex = TABS.length - 1;
    const nextIndex = {
      ArrowRight: (TABS.indexOf(tab) + 1) % TABS.length,
      ArrowLeft: (TABS.indexOf(tab) + lastIndex) % TABS.length,
      Home: 0,
      End: lastIndex,
    }[event.key];
    if (nextIndex === undefined) return;
    event.preventDefault();
    const next = TABS[nextIndex] ?? "rentals";
    setTab(next);
    tabRefs.current[next]?.focus();
  };

  const onRentalsSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push(`${rentalsHref}${rentalListQueryString(rentalFiltersFromForm(new FormData(event.currentTarget)))}`);
  };

  /**
   * 5 ô "Tùy chọn khác" (Q3: không mũi tên xổ cuối hàng). Mục đầu (giá trị rỗng = không lọc, không lên URL) mang TÊN ô như mockup ("Mức giá ⌄") thay vì "Tất cả".
   * Nhãn mốc giá / nội thất / tiện ích dùng lại chuỗi của `/cho-thue`.
   */
  const moreOptions: { name: string; label: string; options: SelectOption[] }[] = [
    { name: "priceRange", label: t("moreOptions.price"), options: PRICE_HINT_RANGES.map((hint) => ({ value: hint.key, label: tRentals(`priceHints.${hint.key}`) })) },
    { name: "areaRange", label: t("moreOptions.area"), options: AREA_HINT_RANGES.map((hint) => ({ value: hint.key, label: t(`areaHints.${hint.key}`) })) },
    { name: "category", label: t("moreOptions.category"), options: rentalCategories.map((category) => ({ value: category.slug, label: category.name })) },
    { name: "furnishing", label: t("moreOptions.furnishing"), options: RENTAL_FURNISHINGS.map((value) => ({ value, label: tRentals(`furnishingOption.${value}`) })) },
    { name: "amenities", label: t("moreOptions.amenities"), options: RENTAL_AMENITIES.map((value) => ({ value, label: tRentals(`amenityOption.${value}`) })) },
  ].map((field) => ({ ...field, options: [{ value: "", label: field.label }, ...field.options] }));

  /**
   * Hàng "Dự án được quan tâm". < md: vuốt ngang. ≥ md: 1 hàng cao 40px, chip không vừa tự xuống hàng bị ẩn (`flex-wrap` + `overflow-hidden`) nên KHÔNG chip nào bị cắt giữa chữ;
   * nút tròn mở rộng để thấy đủ; chip ở hàng ẩn nhận focus bàn phím thì hàng tự mở (`focus-within`). `scope` làm id duy nhất vì hàng được dựng trong cả 2 panel.
   */
  const renderChips = (scope: Tab) => {
    if (chips.length === 0) return null;
    const labelId = `${chipsLabelId}-${scope}`;
    const listId = `${chipsListId}-${scope}`;
    return (
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:gap-3">
        <p id={labelId} className={cn(ROW_LABEL, "md:pt-2.5")}>
          {t("chips")}
        </p>
        <ul
          id={listId}
          aria-labelledby={labelId}
          className={cn(
            "-mx-1 flex min-w-0 snap-x gap-2 overflow-x-auto px-1 pb-1 md:mx-0 md:flex-1 md:flex-wrap md:px-0 md:pb-0",
            chipsExpanded ? "md:overflow-visible" : "md:h-10 md:overflow-hidden md:focus-within:h-auto md:focus-within:overflow-visible",
          )}
        >
          {chips.map((chip) => (
            <li key={chip.id} className="min-w-0 max-w-full shrink-0 snap-start">
              <Link href={chip.href} title={chip.title} className={cn(CHIP_LINK, "max-w-full")}>
                <span className="truncate">{chip.title}</span>
              </Link>
            </li>
          ))}
        </ul>
        {chips.length > 1 && (
          <button
            type="button"
            aria-expanded={chipsExpanded}
            aria-controls={listId}
            aria-label={chipsExpanded ? t("collapseChips") : t("expandChips")}
            onClick={() => setChipsExpanded((expanded) => !expanded)}
            className={cn(ROUND_BUTTON, "hidden md:inline-flex")}
          >
            <CaretDown size={16} aria-hidden="true" className={cn("transition-transform duration-(--duration-fast) motion-reduce:transition-none", chipsExpanded && "rotate-180")} />
          </button>
        )}
      </div>
    );
  };

  const submitButton = (
    <Button type="submit" className="h-12 shrink-0 sm:px-6">
      <MagnifyingGlass size={16} aria-hidden="true" />
      {t("submit")}
      <ArrowRight size={16} aria-hidden="true" />
    </Button>
  );

  return (
    <section aria-label={t("region")} data-hero-search="" className="pointer-events-none relative z-10 scroll-mt-(--header-offset) px-gutter pt-6 pb-2 md:-mt-24 md:pt-0 md:pb-4">
      {/* Chip "Dự án được quan tâm" dùng chung 2 tab nhưng phải nằm GIỮA hàng tìm kiếm và hàng "Tùy chọn khác" (trong form Cho thuê) → dựng bằng `renderChips` ở cả hai panel (panel ẩn không vào a11y tree); không dùng `display: contents` để role tabpanel/search giữ nguyên trong cây a11y. */}
      <div className="pointer-events-auto mx-auto flex w-full max-w-4xl flex-col gap-4 rounded-xl border border-border bg-surface p-4 shadow-lg md:p-6">
        <div role="tablist" aria-label={t("tabs")} className="flex gap-2">
          {TABS.map((key) => (
            <button
              key={key}
              ref={(node) => {
                tabRefs.current[key] = node;
              }}
              type="button"
              role="tab"
              id={`${uid}-tab-${key}`}
              aria-selected={tab === key}
              aria-controls={`${uid}-panel-${key}`}
              tabIndex={tab === key ? 0 : -1}
              onClick={() => setTab(key)}
              onKeyDown={onTabKeyDown}
              className={cn(TAB_BASE, tab === key ? "bg-dark text-on-dark" : "text-text hover:bg-surface-muted")}
            >
              {t(key)}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`${uid}-panel-rentals`} aria-labelledby={`${uid}-tab-rentals`} hidden={tab !== "rentals"}>
          <form action={rentalsHref} method="get" role="search" onSubmit={onRentalsSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <label htmlFor={inputId} className="sr-only">
                {t("keywordLabel")}
              </label>
              <div className="relative min-w-0 sm:flex-1">
                <Input id={inputId} type="search" name={RENTAL_KEYWORD_PARAM} maxLength={100} autoComplete="off" placeholder={placeholder ?? t("placeholder")} className="pr-11" />
                <MagnifyingGlass size={20} aria-hidden="true" className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-text-muted" />
              </div>
              {submitButton}
            </div>
            {renderChips("rentals")}
            {/* Hàng "Tùy chọn khác" nằm TRONG form để không JS vẫn gửi ô đơn trị. ≥ md: lưới 5 cột đều → luôn 1 hàng (trước và sau hydrate), độ rộng chip không phụ thuộc option dài nhất. */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3" role="group" aria-labelledby={moreOptionsId}>
              <p id={moreOptionsId} className={ROW_LABEL}>
                {t("moreOptions.label")}
              </p>
              <div className="grid min-w-0 grid-cols-2 gap-2 md:flex-1 md:grid-cols-5">
                {moreOptions.map((field) => (
                  <OptionSelect key={field.name} progressive variant="chip" name={field.name} aria-label={field.label} options={field.options} className="w-full min-w-0" />
                ))}
              </div>
            </div>
          </form>
        </div>
        <div role="tabpanel" id={`${uid}-panel-projects`} aria-labelledby={`${uid}-tab-projects`} hidden={tab !== "projects"} className="flex flex-col gap-4">
          <form action={projectsHref} method="get" role="search" className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div className="flex min-w-0 flex-col gap-1">
              <label htmlFor={provinceId} className="text-small font-semibold">
                {tProjects("provinceLabel")}
              </label>
              <OptionSelect
                progressive
                id={provinceId}
                name="province"
                options={[{ value: "", label: tProjects("allProvinces") }, ...provinces.map((province) => ({ value: province.slug, label: province.name }))]}
              />
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <label htmlFor={statusId} className="text-small font-semibold">
                {tProjects("statusLabel")}
              </label>
              <OptionSelect
                progressive
                id={statusId}
                name="status"
                options={[{ value: "", label: tProjects("allStatuses") }, ...SALES_STATUS_VALUES.map((status) => ({ value: status, label: tProjects(`salesStatus.${status}`) }))]}
              />
            </div>
            {submitButton}
          </form>
          {renderChips("projects")}
        </div>
      </div>
    </section>
  );
}
