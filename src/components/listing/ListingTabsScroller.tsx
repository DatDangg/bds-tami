"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { SliderArrow } from "@/components/layout/use-snap-slider";
import { useMediaQuery } from "@/components/layout/use-environment";
import { cn } from "@/lib/utils";

const EDGE_TOLERANCE = 1;
const FADE_CLASS = "pointer-events-none absolute inset-y-0 z-10 w-12 from-surface to-transparent";
const ARROW_CLASS = "absolute top-1/2 z-20 -translate-y-1/2 border-border bg-surface shadow-md";

/**
 * Vùng cuộn ngang của thanh tab danh mục (BL-084): link vẫn render phía server (children), lớp client chỉ thêm gợi ý tràn —
 * fade mép còn nội dung, nút mũi tên (từ md, ≥ 44px), và cuộn tab `aria-current` vào tầm nhìn khi mount (chỉ theo chiều ngang, không đụng cuộn dọc trang).
 * Không tràn → không fade/nút. Không JS → vẫn là danh sách link cuộn ngang được.
 */
export function ListingTabsScroller({ children }: { children: ReactNode }) {
  const t = useTranslations("page.listing.tabs");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ canScrollBack: false, canScrollForward: false });

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    let frame = 0;

    const measure = () => {
      frame = 0;
      const canScrollBack = scroller.scrollLeft > EDGE_TOLERANCE;
      const canScrollForward = scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - EDGE_TOLERANCE;
      setEdges((previous) => (previous.canScrollBack === canScrollBack && previous.canScrollForward === canScrollForward ? previous : { canScrollBack, canScrollForward }));
    };
    const scheduleMeasure = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    // Đưa tab đang chọn vào giữa vùng nhìn nếu bị khuất; gán scrollLeft trực tiếp để không kéo cuộn dọc trang.
    const current = scroller.querySelector<HTMLElement>('[aria-current="page"]');
    if (current) {
      const scrollerBox = scroller.getBoundingClientRect();
      const currentBox = current.getBoundingClientRect();
      const hidden = currentBox.left < scrollerBox.left || currentBox.right > scrollerBox.right;
      if (hidden) scroller.scrollLeft += currentBox.left - scrollerBox.left - (scrollerBox.width - currentBox.width) / 2;
    }

    measure();
    scroller.addEventListener("scroll", scheduleMeasure, { passive: true });
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(scheduleMeasure);
    resizeObserver?.observe(scroller);
    if (scroller.firstElementChild) resizeObserver?.observe(scroller.firstElementChild);
    return () => {
      scroller.removeEventListener("scroll", scheduleMeasure);
      resizeObserver?.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const scrollByPage = useCallback(
    (direction: 1 | -1) => {
      const scroller = scrollerRef.current;
      scroller?.scrollBy?.({ left: direction * scroller.clientWidth * 0.8, behavior: reducedMotion ? "auto" : "smooth" });
    },
    [reducedMotion],
  );

  return (
    <div className="relative mx-auto w-full max-w-container">
      <div ref={scrollerRef} data-tabs-scroller="" className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
      {edges.canScrollBack && (
        <>
          <span aria-hidden="true" data-tabs-fade="start" className={cn(FADE_CLASS, "left-0 bg-linear-to-r")} />
          <SliderArrow direction="previous" label={t("previous")} onClick={() => scrollByPage(-1)} className={cn(ARROW_CLASS, "left-1")} />
        </>
      )}
      {edges.canScrollForward && (
        <>
          <span aria-hidden="true" data-tabs-fade="end" className={cn(FADE_CLASS, "right-0 bg-linear-to-l")} />
          <SliderArrow direction="next" label={t("next")} onClick={() => scrollByPage(1)} className={cn(ARROW_CLASS, "right-1")} />
        </>
      )}
    </div>
  );
}
