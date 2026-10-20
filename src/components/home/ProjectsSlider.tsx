"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowRight, Heart, MapPin } from "@/components/icons";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { Badge } from "@/components/ui/badge";
import type { ProjectSlideView } from "@/lib/home/home-view";
import { SALES_STATUS_BADGE_VARIANT } from "@/lib/projects/project-view";
import { cn } from "@/lib/utils";
import { SliderArrow, useSnapSlider } from "./use-snap-slider";

const IMAGE_ZOOM =
  "[&_img]:transition-transform [&_img]:duration-(--duration-slow) group-hover:[&_img]:scale-105 motion-reduce:[&_img]:transition-none motion-reduce:group-hover:[&_img]:scale-100";

/**
 * Slider dự án nổi bật (design-spec S01 khối 3, mockup BL-044): cuộn ngang CSS scroll-snap (vuốt/phím mũi tên, KHÔNG autoplay); ~5 thẻ trắng bo 20px/khung desktop:
 * ảnh + badge trạng thái + tim trang trí (`aria-hidden`, không tương tác), thân thẻ gồm tên, ghim tỉnh và nút mũi tên tròn. Mỗi thẻ là MỘT link.
 * Mũi tên từ md và chấm phân trang chỉ khi có ≥ 2 dự án.
 */
export function ProjectsSlider({ slides, labelledBy }: { slides: ProjectSlideView[]; labelledBy: string }) {
  const t = useTranslations("page.home.projects");
  const tStatus = useTranslations("page.projects.salesStatus");
  const count = slides.length;
  const { listRef, current, pageCount, scrollToSlide } = useSnapSlider(count, true);
  const multiple = pageCount > 1;

  return (
    <div role="region" aria-roledescription="carousel" aria-labelledby={labelledBy}>
      <ul
        ref={listRef}
        // `tabIndex=0`: vùng cuộn ngang dùng được bằng bàn phím (mũi tên) khi chưa có điều khiển nào nhận focus.
        tabIndex={0}
        aria-labelledby={labelledBy}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-gutter pb-2 [scroll-padding-inline:var(--spacing-gutter)] [scrollbar-width:none] motion-reduce:scroll-auto [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, position) => (
          <li
            key={slide.id}
            data-index={position}
            role="group"
            aria-roledescription="slide"
            aria-label={t("slide", { index: position + 1, total: count })}
            className="w-[82%] shrink-0 snap-start sm:w-[320px] lg:w-[272px]"
          >
            <article className="h-full">
              <Link
                href={slide.href}
                // Tên truy cập = tên dự án; tim và nút mũi tên chỉ trang trí nên không vào tên.
                aria-labelledby={`${labelledBy}-${slide.id}`}
                className={cn(
                  "group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
                  IMAGE_ZOOM,
                )}
              >
                <div className="relative aspect-[11/10] w-full overflow-hidden bg-surface-muted">
                  {slide.image ? (
                    <ResponsiveImage media={slide.image} sizes="(min-width: 1024px) 272px, (min-width: 640px) 320px, 82vw" decorative />
                  ) : (
                    <MapPin size={40} weight="light" aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-text-muted" />
                  )}
                  {slide.salesStatus && (
                    <Badge variant={SALES_STATUS_BADGE_VARIANT[slide.salesStatus]} className="absolute top-3 left-3">
                      {tStatus(slide.salesStatus)}
                    </Badge>
                  )}
                  {/* Tim chỉ trang trí (quyết định BL-044 Q1): không button, không state, ẩn khỏi trình đọc màn hình. */}
                  <span aria-hidden="true" data-testid="project-heart" className="absolute top-3 right-3 inline-flex size-10 items-center justify-center rounded-full bg-surface text-text">
                    <Heart size={20} />
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <h3 id={`${labelledBy}-${slide.id}`} className="line-clamp-2 min-h-[2lh] text-h4 font-semibold transition-colors group-hover:text-accent-text group-focus-visible:text-accent-text">{slide.title}</h3>
                  <div className="mt-auto flex items-center justify-between gap-3">
                    {slide.provinceName ? (
                      <p className="flex min-w-0 items-center gap-1 text-small text-text-muted">
                        <MapPin size={16} aria-hidden="true" className="shrink-0" />
                        <span className="truncate">{slide.provinceName}</span>
                      </p>
                    ) : (
                      <span />
                    )}
                    <span aria-hidden="true" className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-accent-text">
                      <ArrowRight size={18} />
                    </span>
                  </div>
                </div>
              </Link>
            </article>
          </li>
        ))}
      </ul>

      {multiple && (
        <div className="mx-auto mt-6 flex w-full max-w-container items-center justify-center gap-4 px-gutter">
          <SliderArrow direction="previous" label={t("previous")} onClick={() => scrollToSlide(current - 1)} />
          <div role="group" aria-label={t("dots")} className="flex items-center">
            {Array.from({ length: pageCount }, (_, position) => (
              <button
                key={position}
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
          <SliderArrow direction="next" label={t("next")} onClick={() => scrollToSlide(current + 1)} />
        </div>
      )}
    </div>
  );
}
