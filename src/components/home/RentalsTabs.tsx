"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { type KeyboardEvent, useId, useRef, useState } from "react";
import { RentalCard } from "@/components/rentals/RentalCard";
import { Button } from "@/components/ui/button";
import type { RentalTabView } from "@/lib/home/home-view-listings";
import { cn } from "@/lib/utils";
import { SliderArrow, useSnapSlider } from "@/components/layout/use-snap-slider";

/** 80% < sm (lộ thẻ kế), 2 thẻ ≥ sm, 4 thẻ ≥ lg (gap 16/24px). */
const SLIDE_WIDTH = "w-[80%] sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-4.5rem)/4)]";
const TAB_BASE =
  "inline-flex h-11 cursor-pointer items-center justify-center rounded-pill px-5 font-sans text-button-sm font-semibold uppercase transition-colors duration-(--duration-fast) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

/** Slider của một tab: cuộn ngang scroll-snap (vuốt/phím mũi tên, không autoplay); nút trước/sau từ md khi có > 1 thẻ. */
function RentalsSlider({ cards, labelledBy }: { cards: RentalTabView["cards"]; labelledBy: string }) {
  const t = useTranslations("page.home.rentals");
  const { listRef, scrollByPage } = useSnapSlider(cards.length, false);
  return (
    <div role="region" aria-roledescription="carousel" aria-labelledby={labelledBy}>
      <ul
        ref={listRef}
        // `tabIndex=0`: vùng cuộn ngang dùng được bằng bàn phím (mũi tên).
        tabIndex={0}
        aria-labelledby={labelledBy}
        className="-mx-2 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-2 py-2 [scroll-padding-inline:0.5rem] [scrollbar-width:none] motion-reduce:scroll-auto lg:gap-6 [&::-webkit-scrollbar]:hidden"
      >
        {cards.map((card, position) => (
          <li key={card.id} role="group" aria-roledescription="slide" aria-label={t("slide", { index: position + 1, total: cards.length })} className={`shrink-0 snap-start ${SLIDE_WIDTH}`}>
            <RentalCard data={card} headingLevel={3} />
          </li>
        ))}
      </ul>
      {cards.length > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <SliderArrow direction="previous" label={t("previous")} onClick={() => scrollByPage(-1)} />
          <SliderArrow direction="next" label={t("next")} onClick={() => scrollByPage(1)} />
        </div>
      )}
    </div>
  );
}

/**
 * Tablist danh mục + tabpanel chứa slider. HTML server render ĐỦ mọi panel (panel không chọn chỉ có `hidden`), nên khi chưa có JS
 * tab đầu hiện sẵn cùng link thẻ và "Xem thêm". Một danh mục duy nhất thì không dựng tablist (không có gì để chọn).
 * Bàn phím theo mẫu ARIA tabs: ←/→ (vòng), Home/End, roving tabindex, chuyển tab là kích hoạt.
 */
export function RentalsTabs({ title, tabs }: { title: string; tabs: RentalTabView[] }) {
  const t = useTranslations("page.home.rentals");
  const heading = title || t("defaultTitle");
  const uid = useId();
  const headingId = `${uid}-heading`;
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? "");
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const hasTabs = tabs.length > 1;
  const tabId = (id: string) => `${uid}-tab-${id}`;

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const last = tabs.length - 1;
    const index = Math.max(
      0,
      tabs.findIndex((tab) => tab.id === activeId),
    );
    const nextIndex = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + last) % tabs.length, Home: 0, End: last }[event.key];
    const next = nextIndex === undefined ? undefined : tabs[nextIndex];
    if (!next) return;
    event.preventDefault();
    setActiveId(next.id);
    tabRefs.current[next.id]?.focus();
  };

  return (
    <div className="mx-auto w-full max-w-container px-gutter">
      <h2 id={headingId} className="mb-8 text-center font-display text-h2">
        {heading}
      </h2>
      {hasTabs && (
        <div role="tablist" aria-label={t("tabs")} className="mb-8 flex flex-wrap justify-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              ref={(node) => {
                tabRefs.current[tab.id] = node;
              }}
              type="button"
              role="tab"
              id={tabId(tab.id)}
              aria-selected={activeId === tab.id}
              aria-controls={`${uid}-panel-${tab.id}`}
              tabIndex={activeId === tab.id ? 0 : -1}
              onClick={() => setActiveId(tab.id)}
              onKeyDown={onTabKeyDown}
              className={cn(TAB_BASE, activeId === tab.id ? "border border-dark bg-dark text-on-dark" : "border border-border text-text hover:border-text hover:bg-surface-muted")}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role={hasTabs ? "tabpanel" : undefined}
          id={`${uid}-panel-${tab.id}`}
          aria-labelledby={hasTabs ? tabId(tab.id) : undefined}
          hidden={activeId !== tab.id}
        >
          <RentalsSlider cards={tab.cards} labelledBy={hasTabs ? tabId(tab.id) : headingId} />
          <div className="mt-8 flex justify-center">
            <Button asChild variant="outline">
              <Link href={tab.href}>{t("viewMore")}</Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
