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
}

/** 82% < sm (lộ thẻ kế), 320px ≥ sm, 272px ≥ lg (~5 thẻ/khung desktop, BL-044). */
const SLIDE_WIDTH = "w-[82%] sm:w-[320px] lg:w-[272px]";

/** Mũi tên hai mép: giữa chiều cao danh sách (trừ hàng chấm 44px + khe 24px bên dưới), nền trắng + bóng để nổi trên thẻ. */
const SIDE_ARROW_CLASS = "absolute top-[calc(50%-2.125rem)] z-10 -translate-y-1/2 border-border bg-surface shadow-md";

const fill = (template: string, values: Record<string, number>) => template.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));

/**
 * Slider thẻ DÙNG CHUNG (trang chủ "Dự án nổi bật", "Dự án tương tự", "Căn tương tự"; BL-045): cuộn ngang CSS scroll-snap (vuốt/phím mũi tên, KHÔNG autoplay),
 * mũi tên tròn (từ md) + chấm giữa dưới. Số chấm = số vị trí cuộn thật (`pageCount`, BL-038), không phải số thẻ; mũi tên/chấm chỉ hiện khi `pageCount > 1`.
 * Slider không biết loại thẻ: nhận thẻ qua `items`.
 */
export function CardSlider({ items, labelledBy, labels, arrows = "below" }: CardSliderProps) {
  const count = items.length;
  const { listRef, current, pageCount, scrollToSlide } = useSnapSlider(count, true);
  const sides = arrows === "sides";
  const previousArrow = (className?: string) => (
    <SliderArrow direction="previous" label={labels.previous} onClick={() => scrollToSlide(current - 1)} {...(className ? { className } : {})} />
  );
  const nextArrow = (className?: string) => <SliderArrow direction="next" label={labels.next} onClick={() => scrollToSlide(current + 1)} {...(className ? { className } : {})} />;

  return (
    <div role="region" aria-roledescription="carousel" aria-labelledby={labelledBy} className={sides ? "relative" : undefined}>
      <ul
        ref={listRef}
        // `tabIndex=0`: vùng cuộn ngang dùng được bằng bàn phím (mũi tên) khi chưa có điều khiển nào nhận focus.
        tabIndex={0}
        aria-labelledby={labelledBy}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-gutter pt-1 pb-2 [scroll-padding-inline:var(--spacing-gutter)] [scrollbar-width:none] motion-reduce:scroll-auto [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, position) => (
          <li
            key={position}
            data-index={position}
            role="group"
            aria-roledescription="slide"
            aria-label={fill(labels.slide, { index: position + 1, total: count })}
            className={cn("shrink-0 snap-start", SLIDE_WIDTH)}
          >
            {item}
          </li>
        ))}
      </ul>

      {sides && pageCount > 1 && (
        <>
          {previousArrow(cn(SIDE_ARROW_CLASS, "left-0"))}
          {nextArrow(cn(SIDE_ARROW_CLASS, "right-0"))}
        </>
      )}

      {pageCount > 1 && (
        <div className="mx-auto mt-6 flex w-full max-w-container items-center justify-center gap-4 px-gutter">
          {!sides && previousArrow()}
          <div role="group" aria-label={labels.dots} className="flex items-center">
            {Array.from({ length: pageCount }, (_, position) => (
              <button
                key={position}
                type="button"
                aria-label={fill(labels.goTo, { index: position + 1 })}
                aria-current={position === current ? "true" : undefined}
                onClick={() => scrollToSlide(position)}
                className="group inline-flex size-11 cursor-pointer items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-focus-ring"
              >
                <span
                  aria-hidden="true"
                  className={cn("h-2 rounded-full transition-all duration-(--duration-base) motion-reduce:transition-none", position === current ? "w-6 bg-primary" : "w-2 bg-text-muted/50 group-hover:bg-text-muted")}
                />
              </button>
            ))}
          </div>
          {!sides && nextArrow()}
        </div>
      )}
    </div>
  );
}
