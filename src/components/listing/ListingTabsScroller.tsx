"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, type FocusEvent, type ReactNode } from "react";
import { SliderArrow } from "@/components/layout/use-snap-slider";
import { useMediaQuery } from "@/components/layout/use-environment";
import { cn } from "@/lib/utils";

const EDGE_TOLERANCE = 1;
// Một nguồn cho bề rộng fade: dùng cho style fade, scroll-padding và đoạn đẩy link focus bàn phím.
const FADE_WIDTH_PX = 32;
const FADE_STYLE = { width: FADE_WIDTH_PX };
const SCROLL_PADDING_STYLE = { scrollPaddingInline: FADE_WIDTH_PX };
const FADE_CLASS = "pointer-events-none absolute inset-y-0 z-10 from-surface to-transparent";
// Nút nằm trong làn riêng (không đè vùng cuộn); ở mép không còn chỗ cuộn → mờ + không bấm được nhưng vẫn giữ focus (aria-disabled).
const ARROW_CLASS = "border-border bg-surface shadow-md aria-disabled:cursor-default aria-disabled:opacity-40 aria-disabled:shadow-none aria-disabled:hover:bg-surface aria-disabled:hover:text-text";
const LANE_CLASS = "hidden w-12 shrink-0 items-center justify-center md:flex";

/** `:focus-visible` = focus bàn phím; trình duyệt không hỗ trợ selector → coi là bàn phím (chỉ là nudge, vô hại). */
function isKeyboardFocus(element: HTMLElement) {
  try {
    return element.matches(":focus-visible");
  } catch {
    return true;
  }
}

/**
 * Vùng cuộn ngang của thanh tab danh mục (BL-084, BL-086): link vẫn render phía server (children), lớp client chỉ thêm gợi ý tràn.
 * Tràn khung → từ md hai làn nút ‹ › (≥ 44px) nằm NGOÀI vùng cuộn (vùng cuộn thu hẹp nhường chỗ, nút không bao giờ đè tab), fade ở mép trong vùng cuộn
 * phía còn nội dung (cả < md, nơi chỉ vuốt); nút ở mép giữ nguyên + `aria-disabled` (không unmount → không mất focus). Tab `aria-current` được cuộn vào giữa khi mount (chỉ theo chiều ngang).
 * Không tràn → không làn/fade/nút. Không JS → vẫn là danh sách link cuộn ngang được.
 */
export function ListingTabsScroller({ children }: { children: ReactNode }) {
  const t = useTranslations("page.listing.tabs");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const frameRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const centeredRef = useRef(false);
  const [edges, setEdges] = useState({ overflowing: false, canScrollBack: false, canScrollForward: false });

  useEffect(() => {
    const frame = frameRef.current;
    const scroller = scrollerRef.current;
    if (!frame || !scroller) return;
    let pendingFrame = 0;

    const measure = () => {
      pendingFrame = 0;
      // "Tràn" so nội dung với khung NGOÀI (không đổi khi làn xuất hiện) → không dao động ở bề rộng biên.
      const overflowing = scroller.scrollWidth > frame.clientWidth + EDGE_TOLERANCE;
      const canScrollBack = scroller.scrollLeft > EDGE_TOLERANCE;
      const canScrollForward = scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - EDGE_TOLERANCE;
      setEdges((previous) =>
        previous.overflowing === overflowing && previous.canScrollBack === canScrollBack && previous.canScrollForward === canScrollForward ? previous : { overflowing, canScrollBack, canScrollForward },
      );
    };
    const scheduleMeasure = () => {
      if (!pendingFrame) pendingFrame = requestAnimationFrame(measure);
    };

    measure();
    scroller.addEventListener("scroll", scheduleMeasure, { passive: true });
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(scheduleMeasure);
    resizeObserver?.observe(frame);
    resizeObserver?.observe(scroller);
    if (scroller.firstElementChild) resizeObserver?.observe(scroller.firstElementChild);
    return () => {
      scroller.removeEventListener("scroll", scheduleMeasure);
      resizeObserver?.disconnect();
      if (pendingFrame) cancelAnimationFrame(pendingFrame);
    };
  }, []);

  // Căn tab đang chọn vào giữa vùng nhìn một lần, SAU khi làn đã render (vùng cuộn đã thu hẹp); gán scrollLeft trực tiếp để không kéo cuộn dọc trang.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!edges.overflowing || centeredRef.current || !scroller) return;
    centeredRef.current = true;
    const current = scroller.querySelector<HTMLElement>('[aria-current="page"]');
    if (!current) return;
    const scrollerBox = scroller.getBoundingClientRect();
    const currentBox = current.getBoundingClientRect();
    const hidden = currentBox.left < scrollerBox.left || currentBox.right > scrollerBox.right;
    if (hidden) scroller.scrollLeft += currentBox.left - scrollerBox.left - (scrollerBox.width - currentBox.width) / 2;
  }, [edges.overflowing]);

  const scrollByPage = useCallback(
    (direction: 1 | -1) => {
      const scroller = scrollerRef.current;
      scroller?.scrollBy?.({ left: direction * scroller.clientWidth * 0.8, behavior: reducedMotion ? "auto" : "smooth" });
    },
    [reducedMotion],
  );

  // Chrome không cuộn khi link focus đã hở một phần ở mép → tự đẩy link vào ngoài vùng fade (scroll-padding chỉ có tác dụng khi trình duyệt tự cuộn).
  // CHỈ cho focus bàn phím (:focus-visible): focus do chuột xảy ra ở mousedown, dịch thanh lúc đó làm click rơi khỏi link.
  const keepFocusedLinkClearOfFade = useCallback((event: FocusEvent<HTMLDivElement>) => {
    const scroller = event.currentTarget;
    const target = event.target;
    if (target === scroller || !(target instanceof HTMLElement) || !isKeyboardFocus(target)) return;
    const scrollerBox = scroller.getBoundingClientRect();
    const targetBox = target.getBoundingClientRect();
    if (targetBox.width > scrollerBox.width - 2 * FADE_WIDTH_PX) return; // tab rộng hơn vùng nhìn: không thể tránh fade, đừng giật
    const overshootStart = scrollerBox.left + FADE_WIDTH_PX - targetBox.left;
    const overshootEnd = targetBox.right - (scrollerBox.right - FADE_WIDTH_PX);
    if (overshootStart > 0) scroller.scrollLeft -= overshootStart;
    else if (overshootEnd > 0) scroller.scrollLeft += overshootEnd;
  }, []);

  return (
    <div ref={frameRef} data-tabs-frame="" className="mx-auto flex w-full max-w-container">
      {edges.overflowing && (
        <div data-tabs-lane="start" className={LANE_CLASS}>
          <SliderArrow direction="previous" label={t("previous")} onClick={() => scrollByPage(-1)} disabled={!edges.canScrollBack} className={ARROW_CLASS} />
        </div>
      )}
      <div className="relative min-w-0 flex-1">
        {/* scroll-padding = bề rộng fade: link focus bằng bàn phím không nằm dưới fade. */}
        <div ref={scrollerRef} data-tabs-scroller="" onFocus={keepFocusedLinkClearOfFade} style={SCROLL_PADDING_STYLE} className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {children}
        </div>
        {edges.canScrollBack && <span aria-hidden="true" data-tabs-fade="start" style={FADE_STYLE} className={cn(FADE_CLASS, "left-0 bg-linear-to-r")} />}
        {edges.canScrollForward && <span aria-hidden="true" data-tabs-fade="end" style={FADE_STYLE} className={cn(FADE_CLASS, "right-0 bg-linear-to-l")} />}
      </div>
      {edges.overflowing && (
        <div data-tabs-lane="end" className={LANE_CLASS}>
          <SliderArrow direction="next" label={t("next")} onClick={() => scrollByPage(1)} disabled={!edges.canScrollForward} className={ARROW_CLASS} />
        </div>
      )}
    </div>
  );
}
