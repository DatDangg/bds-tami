"use client";

import { useTranslations } from "next-intl";
import { type KeyboardEvent, useId, useRef, useState } from "react";
import { RentalCard } from "@/components/rentals/RentalCard";
import type { RentalTabView } from "@/lib/home/home-view-listings";
import { cn } from "@/lib/utils";
import { CardSlider, type CardSliderLabels } from "@/components/layout/CardSlider";
import { SectionHeading } from "./SectionHeading";
import { SectionMoreLink } from "./SectionMoreLink";

/** 80% < sm (lộ thẻ kế), 2 thẻ ≥ sm, 4 thẻ ≥ lg (gap 16/24px). */
const SLIDE_WIDTH = "w-[80%] sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-4.5rem)/4)]";
/** Vùng cuộn nằm trong khung `px-gutter` của khối: kéo ra 8px mỗi bên để bóng thẻ không bị cắt, gap 16 / 24px (lg). */
const LIST_INSET = "-mx-2 gap-4 px-2 py-2 [scroll-padding-inline:0.5rem] lg:gap-6";
const TAB_BASE =
  "inline-flex h-11 cursor-pointer items-center justify-center rounded-pill px-5 font-sans text-button-sm font-semibold uppercase transition-colors duration-(--duration-fast) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

/** Slider của một tab (BL-122): `CardSlider` dùng chung (mũi tên + chấm ở mọi breakpoint, đi từng vị trí), hình học Cho thuê giữ nguyên. */
function RentalsSlider({ cards, labelledBy }: { cards: RentalTabView["cards"]; labelledBy: string }) {
  const t = useTranslations("page.home.rentals");
  const labels: CardSliderLabels = { slide: t.raw("slide") as string, previous: t("previous"), next: t("next"), dots: t("dots"), goTo: t.raw("goTo") as string };
  const items = cards.map((card) => <RentalCard key={card.id} data={card} variant="home" headingLevel={3} />);
  return <CardSlider items={items} labelledBy={labelledBy} labels={labels} slideClassName={SLIDE_WIDTH} listClassName={LIST_INSET} />;
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
      <SectionHeading id={headingId} title={heading} className="mb-8" />
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
            <SectionMoreLink href={tab.href}>{t("viewMore")}</SectionMoreLink>
          </div>
        </div>
      ))}
    </div>
  );
}
