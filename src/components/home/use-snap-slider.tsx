"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CaretLeft, CaretRight } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "./use-environment";

/**
 * Cơ chế chung của các slider trang chủ (dự án, ưu đãi): vùng cuộn ngang CSS scroll-snap (vuốt/phím mũi tên/cuộn gốc), KHÔNG autoplay.
 * Khi `trackCurrent` và có ≥ 2 slide, hook đo vị trí cuộn của từng thẻ (offset mép trái so với thẻ đầu) rồi suy ra:
 * - `pageCount`: số vị trí cuộn thực sự đến được (thẻ cuối không thể cuộn tới mép trái nên các thẻ cuối gộp thành một vị trí);
 * - `current`: vị trí gần `scrollLeft` nhất (cuộn hết = vị trí cuối). Theo dõi bằng scroll listener passive gộp bằng rAF.
 * Chưa có layout (jsdom, chưa đo) → `pageCount = count`, `current = 0`, cuộn bằng scrollIntoView.
 */
export function useSnapSlider(count: number, trackCurrent: boolean) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const listRef = useRef<HTMLUListElement>(null);
  const offsetsRef = useRef<number[]>([]);
  const maxScrollRef = useRef(0);
  const pagesRef = useRef(0);
  const [current, setCurrent] = useState(0);
  const [measuredPages, setMeasuredPages] = useState<number | null>(null);
  const behavior = reducedMotion ? "auto" : "smooth";
  const observe = trackCurrent && count > 1;
  const pageCount = observe && measuredPages !== null ? measuredPages : count;

  useEffect(() => {
    const list = listRef.current;
    if (!observe || !list) return;
    let frame = 0;

    const updateCurrent = () => {
      const offsets = offsetsRef.current;
      if (offsets.length === 0) return;
      const max = maxScrollRef.current;
      const pages = pagesRef.current;
      const scrolled = list.scrollLeft;
      if (scrolled >= max - 1) return setCurrent(pages - 1);
      let nearest = 0;
      for (let index = 1; index < pages; index++) {
        if (Math.abs(Math.min(offsets[index] ?? 0, max) - scrolled) < Math.abs(Math.min(offsets[nearest] ?? 0, max) - scrolled)) nearest = index;
      }
      setCurrent(nearest);
    };

    const measure = () => {
      if (list.clientWidth === 0 || list.children.length === 0) {
        offsetsRef.current = [];
        setMeasuredPages(null);
        return;
      }
      const firstLeft = list.children[0]?.getBoundingClientRect().left ?? 0;
      offsetsRef.current = Array.from(list.children, (child) => child.getBoundingClientRect().left - firstLeft);
      maxScrollRef.current = list.scrollWidth - list.clientWidth;
      const firstReachingEnd = offsetsRef.current.findIndex((offset) => offset >= maxScrollRef.current - 1);
      pagesRef.current = firstReachingEnd === -1 ? offsetsRef.current.length : firstReachingEnd + 1;
      setMeasuredPages(pagesRef.current);
      updateCurrent();
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        updateCurrent();
      });
    };

    measure();
    list.addEventListener("scroll", onScroll, { passive: true });
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    resizeObserver?.observe(list);
    return () => {
      list.removeEventListener("scroll", onScroll);
      resizeObserver?.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [observe, count]);

  const scrollToSlide = useCallback(
    (target: number) => {
      const list = listRef.current;
      if (!list) return;
      const index = ((target % pageCount) + pageCount) % pageCount;
      const offsets = offsetsRef.current;
      if (offsets.length > 0 && list.scrollTo) {
        list.scrollTo({ left: Math.min(offsets[index] ?? 0, maxScrollRef.current), behavior });
        return;
      }
      list.children[index]?.scrollIntoView?.({ behavior, inline: "start", block: "nearest" });
    },
    [pageCount, behavior],
  );

  /** Cuộn một "trang" (≈ 90% bề rộng vùng nhìn thấy): dùng khi nhiều thẻ cùng hiện nên "slide hiện tại" không rõ. */
  const scrollByPage = useCallback(
    (direction: 1 | -1) => {
      const list = listRef.current;
      list?.scrollBy?.({ left: direction * list.clientWidth * 0.9, behavior });
    },
    [behavior],
  );

  return { listRef, current, pageCount, scrollToSlide, scrollByPage };
}

const ARROW_BUTTON =
  "hidden size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-text text-text transition-colors duration-(--duration-fast) hover:bg-text hover:text-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring md:inline-flex";

/** Nút trước/sau tròn 44px, chỉ hiện từ md (mobile dùng vuốt). */
export function SliderArrow({ direction, label, onClick, className }: { direction: "previous" | "next"; label: string; onClick: () => void; className?: string }) {
  const Icon = direction === "previous" ? CaretLeft : CaretRight;
  return (
    <button type="button" aria-label={label} onClick={onClick} className={cn(ARROW_BUTTON, className)}>
      <Icon size={20} aria-hidden="true" />
    </button>
  );
}
