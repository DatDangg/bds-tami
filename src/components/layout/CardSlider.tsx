"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SliderArrow, useSnapSlider } from "./use-snap-slider";

/** Nhãn ARIA đã dịch sẵn (chuỗi thuần để Server Component truyền được); `{index}` / `{total}` được thay trong component. */
export interface CardSliderLabels {
  /** Nhãn mỗi slide, vd "Dự án {index} / {total}". */
  slide: string;
  previous: string;
  next: string;
  /** Nhãn nhóm chấm phân trang. */
  dots: string;
  /** Nhãn mỗi chấm, vd "Chuyển tới dự án {index}". */
  goTo: string;
}

interface CardSliderProps {
  /** Mỗi phần tử là một thẻ (vd `<ProjectCard />`); thứ tự cố định, không thêm/bớt khi đang xem. */
  items: ReactNode[];
  /** `id` của heading đặt tên cho vùng carousel. */
  labelledBy: string;
  labels: CardSliderLabels;
  /** Vị trí mũi tên: `below` (mặc định) cạnh chấm dưới slider; `sides` (BL-052 "Dự án tương tự") tròn nền trắng đè hai mép danh sách (từ md), chấm vẫn ở dưới. */
  arrows?: "below" | "sides";
  /** BL-075: ít thẻ hơn một hàng thì căn giữa hàng thẻ (`safe center`: khi tràn tự rơi về căn trái nên thẻ đầu vẫn cuộn tới được). Mặc định tắt, consumer khác giữ nguyên. */
  centerWhenFits?: boolean;
  /** BL-122: bề rộng mỗi slide (mặc định `SLIDE_WIDTH`). Cho thuê trang chủ cần 80% < sm · 2 thẻ ≥ sm · 4 thẻ ≥ lg. */
  slideClassName?: string;
  /** BL-122: gap + đệm + scroll-padding của vùng cuộn (mặc định `LIST_GUTTER`: đệm `px-gutter`). Cho thuê nằm trong khung `px-gutter` nên dùng `-mx-2 px-2`. */
  listClassName?: string;
}

/** 82% < sm (lộ thẻ kế), 320px ≥ sm, 272px ≥ lg (khung 1280 vừa 4 thẻ). */
const SLIDE_WIDTH = "w-[82%] sm:w-[320px] lg:w-[272px]";

/** Mặc định của vùng cuộn: gap 16px, đệm `px-gutter` (+ scroll-padding cùng giá trị). */
const LIST_GUTTER = "gap-4 px-gutter pt-1 pb-2 [scroll-padding-inline:var(--spacing-gutter)]";

/**
 * Mũi tên biến thể `sides`: < md nằm trong hàng `‹ chấm ›` dưới slider (BL-122, như `below`); từ md tròn nền trắng đè hai mép danh sách
 * (giữa chiều cao danh sách, trừ hàng chấm 44px + khe 24px bên dưới), bóng để nổi trên thẻ. Khối chứa định vị là `region` (hàng chấm không `relative`).
 */
const SIDE_ARROW_CLASS = "md:absolute md:top-[calc(50%-2.125rem)] md:z-10 md:-translate-y-1/2 md:border-border md:bg-surface md:shadow-md md:hover:bg-text";

const fill = (template: string, values: Record<string, number>) => template.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));

/**
 * Slider thẻ DÙNG CHUNG (trang chủ "Dự án nổi bật", "Dự án tương tự", "Căn tương tự"; BL-045): cuộn ngang CSS scroll-snap (vuốt/phím mũi tên, KHÔNG autoplay),
 * mũi tên tròn (mọi breakpoint, BL-122: < md trong hàng `‹ chấm ›` dưới slider) + chấm giữa dưới. Số chấm = số vị trí cuộn thật (`pageCount`, BL-038), không phải số thẻ; mũi tên/chấm chỉ hiện khi `pageCount > 1`.
 * Slider không biết loại thẻ: nhận thẻ qua `items`.
 */
export function CardSlider({ items, labelledBy, labels, arrows = "below", centerWhenFits = false, slideClassName = SLIDE_WIDTH, listClassName = LIST_GUTTER }: CardSliderProps) {
  const count = items.length;
  const { listRef, current, pageCount, scrollToSlide } = useSnapSlider(count, true);
  const sides = arrows === "sides";
  // Mũi tên hiện ở mọi breakpoint (BL-122); `sides` thêm class đè hai mép từ md.
  const previousClass = cn(sides && SIDE_ARROW_CLASS, sides && "md:left-0");
  const nextClass = cn(sides && SIDE_ARROW_CLASS, sides && "md:right-0");

  return (
    <div role="region" aria-roledescription="carousel" aria-labelledby={labelledBy} className={sides ? "relative" : undefined}>
      <ul
        ref={listRef}
        // `tabIndex=0`: vùng cuộn ngang dùng được bằng bàn phím (mũi tên) khi chưa có điều khiển nào nhận focus.
        tabIndex={0}
        aria-labelledby={labelledBy}
        className={cn(
          "flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] motion-reduce:scroll-auto [&::-webkit-scrollbar]:hidden",
          listClassName,
          centerWhenFits && "justify-center-safe",
        )}
      >
        {items.map((item, position) => (
          <li
            key={position}
            data-index={position}
            role="group"
            aria-roledescription="slide"
            aria-label={fill(labels.slide, { index: position + 1, total: count })}
            // `relative`: phần tử định vị tuyệt đối trong thẻ (vd nhãn `sr-only` phòng ngủ/tắm) lấy slide làm khối chứa, không thoát vùng cuộn ngang làm trang rộng ra (P3-T06).
            className={cn("relative shrink-0 snap-start", slideClassName)}
          >
            {item}
          </li>
        ))}
      </ul>

      {pageCount > 1 && (
        // < md: gap 8px, không đệm ngang để `‹ 8 chấm ›` (44 + 8×24 + 44 + 2×8 = 296px) vừa 320px; từ md giữ gap 16px + px-gutter.
        <div className="mx-auto mt-6 flex w-full max-w-container items-center justify-center gap-2 md:gap-4 md:px-gutter">
          <SliderArrow direction="previous" label={labels.previous} onClick={() => scrollToSlide(current - 1)} showOnMobile className={previousClass} />
          <div role="group" aria-label={labels.dots} className="flex items-center">
            {Array.from({ length: pageCount }, (_, position) => (
              <button
                key={position}
                type="button"
                aria-label={fill(labels.goTo, { index: position + 1 })}
                aria-current={position === current ? "true" : undefined}
                onClick={() => scrollToSlide(position)}
                className="group inline-flex h-11 w-6 cursor-pointer md:w-11 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-focus-ring"
              >
                <span
                  aria-hidden="true"
                  className={cn("h-2 rounded-full transition-all duration-(--duration-base) motion-reduce:transition-none", position === current ? "w-6 bg-primary" : "w-2 bg-text-muted/50 group-hover:bg-text-muted")}
                />
              </button>
            ))}
          </div>
          <SliderArrow direction="next" label={labels.next} onClick={() => scrollToSlide(current + 1)} showOnMobile className={nextClass} />
        </div>
      )}
    </div>
  );
}
