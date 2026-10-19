"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { type KeyboardEvent, useId, useRef, useState } from "react";
import { MagnifyingGlass } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OptionSelect } from "@/components/ui/option-select";
import type { HeroSearchChipView } from "@/lib/home/home-view";
import { SALES_STATUS_VALUES } from "@/lib/projects/project-filters";
import { cn } from "@/lib/utils";

/** Tên tham số từ khoá CÓ SẴN của `/cho-thue` (`parseRentalFilters`, trùng `GET /api/public/rentals`). `/du-an` không có từ khoá: tab Dự án lọc bằng `province`/`status` có sẵn của nó. */
export const RENTAL_KEYWORD_PARAM = "q";
const TABS = ["rentals", "projects"] as const;
type Tab = (typeof TABS)[number];

const TAB_BASE =
  "inline-flex h-11 cursor-pointer items-center justify-center rounded-pill px-5 font-sans text-button-sm font-semibold uppercase transition-colors duration-(--duration-fast) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

interface HeroSearchProps {
  placeholder: string | null;
  chips: HeroSearchChipView[];
  /** Đường dẫn đã bản địa hoá của danh sách cho thuê / dự án (form GET gửi thẳng tới đây). */
  rentalsHref: string;
  projectsHref: string;
  /** Tỉnh/thành cho ô lọc tab Dự án (slug là giá trị `?province=` của `/du-an`). */
  provinces: { slug: string; name: string }[];
}

/**
 * Ô tìm kiếm đè đáy hero từ md (dưới hero trên mobile) — design-spec S01.1b. Tab "Cho thuê" là form GET `?q=` tới `/cho-thue`, tab "Dự án" là form GET tới `/du-an`
 * với ĐÚNG hai tham số lọc có sẵn của trang đó (`province`, `status`; danh sách dự án chưa có từ khoá, không thêm tham số mới ở đây). HTML server render sẵn tab Cho thuê nên form dùng được khi chưa có JS.
 * Chip "Dự án được quan tâm" là link thẳng tới chi tiết dự án, mobile vuốt ngang. Dữ liệu chip do server nạp (không fetch ở client).
 */
export function HeroSearch({ placeholder, chips, rentalsHref, projectsHref, provinces }: HeroSearchProps) {
  const t = useTranslations("page.home.search");
  const tProjects = useTranslations("page.projects");
  const [tab, setTab] = useState<Tab>("rentals");
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});
  const uid = useId();
  const inputId = `${uid}-keyword`;
  const chipsLabelId = `${uid}-chips`;
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

  return (
    <section aria-label={t("region")} data-hero-search="" className="pointer-events-none relative z-10 scroll-mt-(--header-offset) px-gutter pt-6 pb-2 md:-mt-24 md:pt-0 md:pb-8">
      <div className="pointer-events-auto mx-auto w-full max-w-4xl rounded-xl border border-border bg-surface p-4 shadow-lg md:p-6">
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

        <div role="tabpanel" id={`${uid}-panel-rentals`} aria-labelledby={`${uid}-tab-rentals`} hidden={tab !== "rentals"} className="mt-4">
          <form action={rentalsHref} method="get" role="search" className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor={inputId} className="sr-only">
              {t("keywordLabel")}
            </label>
            <Input id={inputId} type="search" name={RENTAL_KEYWORD_PARAM} maxLength={100} autoComplete="off" placeholder={placeholder ?? t("placeholder")} className="sm:flex-1" />
            <Button type="submit" className="h-12 sm:px-8">
              <MagnifyingGlass size={18} aria-hidden="true" />
              {t("submit")}
            </Button>
          </form>
        </div>
        <div role="tabpanel" id={`${uid}-panel-projects`} aria-labelledby={`${uid}-tab-projects`} hidden={tab !== "projects"} className="mt-4">
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
            <Button type="submit" className="h-12 sm:px-8">
              <MagnifyingGlass size={18} aria-hidden="true" />
              {t("submit")}
            </Button>
          </form>
        </div>

        {chips.length > 0 && (
          <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
            <p id={chipsLabelId} className="shrink-0 text-small font-semibold text-text">
              {t("chips")}
            </p>
            <ul aria-labelledby={chipsLabelId} className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 md:flex-wrap md:overflow-visible md:pb-0">
              {chips.map((chip) => (
                <li key={chip.id} className="shrink-0 snap-start">
                  <Link
                    href={chip.href}
                    className="inline-flex h-11 items-center rounded-pill border border-border bg-surface px-4 text-small text-text transition-colors duration-(--duration-fast) hover:border-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  >
                    {chip.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
