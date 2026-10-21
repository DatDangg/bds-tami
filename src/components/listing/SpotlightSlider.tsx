"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { CaretLeft, CaretRight } from "@/components/icons";
import { useSnapSlider } from "@/components/layout/use-snap-slider";
import { type MediaImage, ResponsiveImage } from "@/components/media/ResponsiveImage";
import { cn } from "@/lib/utils";

export interface SpotlightItem {
  /** Khoá ổn định (id tin). */
  id: string;
  /** Ảnh trái; `alt` của media được dùng (ảnh mang nội dung). Thiếu → nền token. */
  image?: MediaImage | null;
  /** Nội dung cột phải do trang dựng (badge, tiêu đề, giá, nút…). */
  content: ReactNode;
}

interface SpotlightSliderProps {
  /** Tên vùng carousel (vd "Dự án nổi bật"). */
  label: string;
  /** Nhãn góc trên-trái ảnh (vd "Dự án nổi bật"). */
  badge: string;
  items: readonly SpotlightItem[];
  className?: string;
}

/** Chiều cao ô ảnh (< lg ảnh nằm trên nội dung; ≥ lg cột trái cao theo thẻ): dùng chung cho ô ảnh và khung phủ điều khiển. */
const IMAGE_BOX = "h-60 md:h-72 lg:h-auto lg:min-h-[340px]";

/** Nút tròn trên ảnh (nằm trong viên kính tối cùng bộ đếm để chữ đọc được trên ảnh sáng), chạm 44px. */
const ARROW_CLASS =
  "inline-flex size-11 cursor-pointer items-center justify-center rounded-full border border-on-dark/40 text-on-dark transition-colors duration-(--duration-fast) hover:bg-dark-deep/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

/**
 * Thẻ nổi bật lớn đầu cột kết quả (BL-052, design `list-du-an`): ảnh trái (badge "… nổi bật") + nội dung phải (slot). Nhiều mục → vùng cuộn ngang scroll-snap
 * (vuốt / cuộn gốc, KHÔNG autoplay) + mũi tên tròn có `aria-label` + bộ đếm `1 / N` trên ảnh. 1 mục → không mũi tên, không bộ đếm. Không có mục → không render.
 */
export function SpotlightSlider({ label, badge, items, className }: SpotlightSliderProps) {
  const t = useTranslations("page.listing.spotlight");
  const multiple = items.length > 1;
  const { listRef, current, pageCount, scrollToSlide } = useSnapSlider(items.length, multiple);
  if (items.length === 0) return null;
  const total = multiple ? pageCount : 1;

  return (
    <section aria-roledescription={t("roleCarousel")} aria-label={label} className={cn("relative overflow-hidden rounded-[20px] border border-border bg-surface shadow-sm", className)}>
      <ul ref={listRef} className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none]">
        {items.map((item, index) => (
          <li
            key={item.id}
            aria-roledescription={t("roleSlide")}
            aria-label={t("slide", { index: index + 1, total: items.length })}
            className="grid w-full shrink-0 snap-start lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
          >
            <div className={cn("relative bg-surface-muted", IMAGE_BOX)}>
              {item.image && <ResponsiveImage media={item.image} sizes="(min-width: 1024px) 40vw, 100vw" className="absolute inset-0" />}
              <span className="absolute top-4 left-4 rounded-sm bg-dark-deep/70 px-3 py-1.5 text-xsmall font-semibold tracking-[0.08em] text-on-dark uppercase">{badge}</span>
            </div>
            <div className="flex min-w-0 flex-col gap-3 p-5 md:p-7">{item.content}</div>
          </li>
        ))}
      </ul>
      {multiple && (
        // Khung phủ cùng chiều cao với ô ảnh (`IMAGE_BOX`; ≥ lg kéo hết chiều cao thẻ) nên điều khiển luôn neo đáy-trái ảnh, không cần số lệch cứng.
        <div className={cn("pointer-events-none absolute top-0 left-0 lg:bottom-0", IMAGE_BOX)}>
          <div className="pointer-events-auto absolute bottom-4 left-4 flex items-center gap-1 rounded-pill bg-dark-deep/60 p-0.5 backdrop-blur-sm">
            <button type="button" aria-label={t("previous")} onClick={() => scrollToSlide(current - 1)} className={ARROW_CLASS}>
              <CaretLeft size={18} aria-hidden="true" />
            </button>
            <span aria-hidden="true" className="min-w-10 text-center text-small font-semibold text-on-dark tabular-nums">
              {current + 1} / {total}
            </span>
            <button type="button" aria-label={t("next")} onClick={() => scrollToSlide(current + 1)} className={ARROW_CLASS}>
              <CaretRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
