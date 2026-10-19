"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CaretLeft, CaretRight } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "./use-environment";

/**
 * Cơ chế chung của các slider trang chủ (dự án, ưu đãi): vùng cuộn ngang CSS scroll-snap (vuốt/phím mũi tên/cuộn gốc), KHÔNG autoplay.
 * `current` (slide đang hiện, cho chấm phân trang) chỉ theo dõi khi `trackCurrent` và có ≥ 2 slide; lấy bằng IntersectionObserver, không dùng scroll listener.
 */
export function useSnapSlider(count: number, trackCurrent: boolean) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const listRef = useRef<HTMLUListElement>(null);
  const [current, setCurrent] = useState(0);
  const behavior = reducedMotion ? "auto" : "smooth";
  const observe = trackCurrent && count > 1;

  useEffect(() => {
    const list = listRef.current;
    if (!observe || !list || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setCurrent(Number((entry.target as HTMLElement).dataset.index));
        }
      },
      { root: list, threshold: 0.6 },
    );
    for (const item of list.children) observer.observe(item);
    return () => observer.disconnect();
  }, [observe, count]);

  const scrollToSlide = useCallback(
    (target: number) => {
      const slide = listRef.current?.children[(target + count) % count];
      slide?.scrollIntoView?.({ behavior, inline: "start", block: "nearest" });
    },
    [count, behavior],
  );

  /** Cuộn một "trang" (≈ 90% bề rộng vùng nhìn thấy): dùng khi nhiều thẻ cùng hiện nên "slide hiện tại" không rõ. */
  const scrollByPage = useCallback(
    (direction: 1 | -1) => {
      const list = listRef.current;
      list?.scrollBy?.({ left: direction * list.clientWidth * 0.9, behavior });
    },
    [behavior],
  );

  return { listRef, current, scrollToSlide, scrollByPage };
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
