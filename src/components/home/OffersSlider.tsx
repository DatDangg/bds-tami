"use client";

import { useTranslations } from "next-intl";
import { PostCard } from "@/components/posts/PostCard";
import type { PostCardData } from "@/lib/posts/post-view";
import { SliderArrow, useSnapSlider } from "@/components/layout/use-snap-slider";

/** Rộng 80% < sm (lộ thẻ kế), 2 thẻ ≥ sm, 3 thẻ ≥ lg (gap 16/24px); khớp `sizes` của ảnh bên dưới. */
const SLIDE_WIDTH = "w-[80%] sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-3rem)/3)]";
const IMAGE_SIZES = "(min-width: 1280px) 400px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 80vw";

/**
 * Slider thẻ ưu đãi (design-spec S01.5, BL-020): cuộn ngang scroll-snap (vuốt/phím mũi tên, không autoplay), thẻ là `PostCard` bo 20px.
 * Nút trước/sau từ md khi có > 1 thẻ; mỗi lần cuộn một "trang" vì nhiều thẻ cùng hiện.
 */
export function OffersSlider({ cards, labelledBy }: { cards: PostCardData[]; labelledBy: string }) {
  const t = useTranslations("page.home.offers");
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
          <li
            key={card.id}
            role="group"
            aria-roledescription="slide"
            aria-label={t("slide", { index: position + 1, total: cards.length })}
            className={`shrink-0 snap-start ${SLIDE_WIDTH}`}
          >
            <PostCard data={card} headingLevel="h3" imageSizes={IMAGE_SIZES} />
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
