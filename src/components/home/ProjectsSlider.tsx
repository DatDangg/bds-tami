"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { MapPin } from "@/components/icons";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { Badge } from "@/components/ui/badge";
import { formatArea, formatNumber } from "@/lib/format";
import type { ProjectSlideView } from "@/lib/home/home-view";
import { SALES_STATUS_BADGE_VARIANT } from "@/lib/projects/project-view";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { SliderArrow, useSnapSlider } from "./use-snap-slider";

const IMAGE_ZOOM =
  "[&_img]:transition-transform [&_img]:duration-(--duration-slow) group-hover:[&_img]:scale-105 motion-reduce:[&_img]:transition-none motion-reduce:group-hover:[&_img]:scale-100";

/** Số liệu từ field `scale.*` có sẵn của dự án; ô nào thiếu dữ liệu thì không hiện (chốt câu 3, BL-020). */
function ProjectStats({ stats }: { stats: ProjectSlideView["stats"] }) {
  const t = useTranslations("page.home.projects.stats");
  const locale = useLocale() as Locale;
  const items = [
    stats.landAreaM2 ? { key: "landArea", label: t("landArea"), value: formatArea(stats.landAreaM2, locale) } : null,
    stats.totalUnits ? { key: "units", label: t("units"), value: formatNumber(stats.totalUnits, locale) } : null,
    stats.handoverTime ? { key: "handover", label: t("handover"), value: stats.handoverTime } : null,
  ].filter((item) => item !== null);
  if (items.length === 0) return null;
  return (
    <dl className="mt-1 flex flex-wrap gap-x-5 gap-y-2 border-t border-text/15 pt-3">
      {items.map((item) => (
        <div key={item.key} className="min-w-0">
          <dt className="text-xsmall">{item.label}</dt>
          <dd className="text-small font-semibold">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Slider dự án nổi bật (design-spec S01 khối 3, BL-020): cuộn ngang CSS scroll-snap (vuốt/phím mũi tên, KHÔNG autoplay); thẻ lớn ~464×600 bo 20px,
 * ảnh phủ kín, khung kính mờ đè đáy ảnh (tên, địa điểm, số liệu) — chữ trên kính chỉ dùng --color-text. Mỗi thẻ là MỘT link.
 * Mũi tên từ md và chấm phân trang chỉ khi có ≥ 2 dự án.
 */
export function ProjectsSlider({ slides, labelledBy }: { slides: ProjectSlideView[]; labelledBy: string }) {
  const t = useTranslations("page.home.projects");
  const tStatus = useTranslations("page.projects.salesStatus");
  const count = slides.length;
  const multiple = count > 1;
  const { listRef, current, scrollToSlide } = useSnapSlider(count, true);

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
            className="w-[82%] shrink-0 snap-start sm:w-[464px]"
          >
            <article>
              <Link
                href={slide.href}
                // Tên truy cập = tên dự án (không đọc cả số liệu); số liệu vẫn đọc được khi duyệt vào thẻ.
                aria-labelledby={`${labelledBy}-${slide.id}`}
                className={cn(
                  "group relative block aspect-[464/600] w-full overflow-hidden rounded-xl bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-focus-ring",
                  IMAGE_ZOOM,
                )}
              >
                {slide.image ? (
                  <ResponsiveImage media={slide.image} sizes="(min-width: 640px) 464px, 82vw" decorative />
                ) : (
                  <MapPin size={40} weight="light" aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-text-muted" />
                )}
                {slide.salesStatus && (
                  <Badge variant={SALES_STATUS_BADGE_VARIANT[slide.salesStatus]} className="absolute top-4 left-4">
                    {tStatus(slide.salesStatus)}
                  </Badge>
                )}
                <div className="glass-panel absolute inset-x-3 bottom-3 flex flex-col gap-1 rounded-lg p-4 text-text sm:inset-x-4 sm:bottom-4 sm:p-5">
                  <h3 id={`${labelledBy}-${slide.id}`} className="line-clamp-2 font-display text-h3 transition-colors group-hover:text-accent-text group-focus-visible:text-accent-text">{slide.title}</h3>
                  {slide.provinceName && (
                    <p className="flex items-center gap-1 text-small">
                      <MapPin size={16} aria-hidden="true" className="shrink-0" />
                      {slide.provinceName}
                    </p>
                  )}
                  <ProjectStats stats={slide.stats} />
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
          <SliderArrow direction="next" label={t("next")} onClick={() => scrollToSlide(current + 1)} />
        </div>
      )}
    </div>
  );
}
