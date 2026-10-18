"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CaretLeft, CaretRight, MapPin } from "@/components/icons";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { Button } from "@/components/ui/button";
import type { ProjectSlideView } from "@/lib/home/home-view";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "./use-environment";

const ARROW_BUTTON =
  "hidden size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-text text-text transition-colors duration-(--duration-fast) hover:bg-text hover:text-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring md:inline-flex";

/**
 * Slider dự án nổi bật (design-spec S01.3): cuộn ngang bằng CSS scroll-snap (vuốt/phím mũi tên/cuộn gốc của trình duyệt, KHÔNG autoplay),
 * slide rộng 88% ở mobile để lộ slide kế. Mũi tên từ md và chấm phân trang chỉ khi có ≥ 2 dự án. Slide hiện tại lấy bằng IntersectionObserver
 * (không dùng scroll listener). Khung chữ đè ảnh ở ≥ lg, nằm dưới ảnh ở nhỏ hơn.
 */
export function ProjectsSlider({ slides, labelledBy }: { slides: ProjectSlideView[]; labelledBy: string }) {
  const t = useTranslations("page.home.projects");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const listRef = useRef<HTMLUListElement>(null);
  const [current, setCurrent] = useState(0);
  const count = slides.length;
  const multiple = count > 1;

  useEffect(() => {
    const list = listRef.current;
    if (!multiple || !list || typeof IntersectionObserver === "undefined") return;
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
  }, [multiple, count]);

  const scrollToSlide = useCallback(
    (target: number) => {
      const slide = listRef.current?.children[(target + count) % count];
      slide?.scrollIntoView?.({ behavior: reducedMotion ? "auto" : "smooth", inline: "start", block: "nearest" });
    },
    [count, reducedMotion],
  );

  return (
    <div role="region" aria-roledescription="carousel" aria-labelledby={labelledBy}>
      <ul
        ref={listRef}
        // `tabIndex=0`: vùng cuộn ngang dùng được bằng bàn phím (mũi tên) khi chưa có điều khiển nào nhận focus.
        tabIndex={0}
        aria-labelledby={labelledBy}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-gutter pb-2 [scroll-padding-inline:var(--spacing-gutter)] [scrollbar-width:none] motion-reduce:scroll-auto md:gap-6 [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, position) => (
          <li
            key={slide.id}
            data-index={position}
            role="group"
            aria-roledescription="slide"
            aria-label={t("slide", { index: position + 1, total: count })}
            className="w-[88%] shrink-0 snap-start md:w-[80%] lg:w-[min(80%,1100px)]"
          >
            <article className="relative flex flex-col lg:block">
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-muted md:aspect-[16/9]">
                {slide.image ? (
                  <ResponsiveImage media={slide.image} sizes="(min-width: 1024px) 1100px, (min-width: 768px) 80vw, 88vw" decorative />
                ) : (
                  <MapPin size={40} weight="light" aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-text-muted" />
                )}
              </div>
              <div className="flex flex-col gap-3 bg-surface py-6 lg:absolute lg:bottom-8 lg:left-8 lg:w-[440px] lg:p-10">
                {slide.eyebrow && <p className="text-xsmall font-semibold tracking-wide text-accent-text uppercase">{slide.eyebrow}</p>}
                <h3 className="font-display text-h2">{slide.title}</h3>
                {slide.provinceName && <p className="text-small text-text-muted">{slide.provinceName}</p>}
                {slide.summary && <p className="line-clamp-2 text-body text-text-secondary lg:line-clamp-3">{slide.summary}</p>}
                <Button asChild variant="outline" className="mt-2 w-fit">
                  <Link href={slide.href}>{t("explore")}</Link>
                </Button>
              </div>
            </article>
          </li>
        ))}
      </ul>

      {multiple && (
        <div className="mx-auto mt-6 flex w-full max-w-container items-center justify-center gap-4 px-gutter">
          <button type="button" aria-label={t("previous")} onClick={() => scrollToSlide(current - 1)} className={ARROW_BUTTON}>
            <CaretLeft size={20} aria-hidden="true" />
          </button>
          <div role="group" aria-label={t("dots")} className="flex items-center">
            {slides.map((slide, position) => (
              <button
                key={slide.id}
                type="button"
                aria-label={t("goTo", { index: position + 1 })}
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
          <button type="button" aria-label={t("next")} onClick={() => scrollToSlide(current + 1)} className={ARROW_BUTTON}>
            <CaretRight size={20} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
