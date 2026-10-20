"use client";

import { useTranslations } from "next-intl";
import { type KeyboardEvent, type ReactNode, type TouchEvent, useRef, useState } from "react";
import { CaretLeft, CaretRight, List } from "@/components/icons";
import { Lightbox } from "@/components/media/Lightbox";
import { ResponsiveImage, type MediaImage } from "@/components/media/ResponsiveImage";
import { cn } from "@/lib/utils";
import { GalleryCounter, GalleryThumbs } from "./DetailGalleryParts";

const SWIPE_MIN_PX = 50;
/** Điều khiển carousel: chỉ phím mũi tên từ các phần tử này mới đổi ảnh (không cướp phím của link trong breadcrumb). */
const CONTROL_SELECTOR = "[data-carousel-control]";

const ROUND_BUTTON =
  "inline-flex size-12 cursor-pointer items-center justify-center rounded-full border border-on-dark/40 bg-dark-deep/30 text-on-dark backdrop-blur-sm transition-colors duration-(--duration-fast) hover:bg-dark-deep/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";
/** Nút chữ viền mảnh trên ảnh ("Xem tất cả ảnh", slot Video của T05); `actions` truyền vào dùng đúng class này. */
export const GALLERY_ACTION_CLASS =
  "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-pill border border-on-dark/50 bg-dark-deep/30 px-4 text-xsmall font-semibold text-on-dark backdrop-blur-sm transition-colors duration-(--duration-fast) hover:bg-dark-deep/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring md:px-5 md:text-small";

interface DetailGalleryHeroProps {
  images: MediaImage[];
  /** Breadcrumb `variant="overlay"` đã dựng (server); đặt góc trên-trái. */
  breadcrumb?: ReactNode;
  /** Nút phụ cạnh "Xem tất cả ảnh" (vd "Video" của chi tiết Cho thuê, T05); dùng `GALLERY_ACTION_CLASS`. */
  actions?: ReactNode;
}

/**
 * Ảnh lớn kiểu hero đầu trang chi tiết (BL-045 #6, mockup `.gal`): cao `min(78vh,640px)` (480px < md), ảnh 1 là ảnh LCP (`priority`), scrim token;
 * mũi tên tròn hai mép (≥ md), góc dưới trái bộ đếm `01 / N` + thanh tiến trình (như `HeroSlider`), góc dưới phải ảnh nhỏ (≥ lg) + "Xem tất cả ảnh" (mở `Lightbox`).
 * KHÔNG autoplay (người xem tự chọn ảnh); vuốt ngang + phím ←/→ trên điều khiển. 1 ảnh → không mũi tên/bộ đếm/ảnh nhỏ; 0 ảnh → nền tối cùng chiều cao.
 * Không chứa `h1` (nằm ở `DetailTitleCard`).
 */
export function DetailGalleryHero({ images, breadcrumb, actions }: DetailGalleryHeroProps) {
  const t = useTranslations("page.detail.gallery");
  const total = images.length;
  const multiple = total > 1;
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const viewAllRef = useRef<HTMLButtonElement>(null);
  const current = images[index];

  const goTo = (next: number) => setIndex((next + total) % total);
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!multiple || !(event.target instanceof Element) || !event.target.closest(CONTROL_SELECTOR)) return;
    if (event.key === "ArrowLeft") goTo(index - 1);
    else if (event.key === "ArrowRight") goTo(index + 1);
  };
  const onTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0];
    touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  };
  const onTouchEnd = (event: TouchEvent) => {
    const start = touchStart.current;
    const end = event.changedTouches[0];
    touchStart.current = null;
    if (!multiple || !start || !end) return;
    const dx = end.clientX - start.x;
    // Cuộn dọc/chéo của trang không được đổi ảnh: chuyển động ngang phải trội hơn.
    if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) <= Math.abs(end.clientY - start.y)) return;
    goTo(dx < 0 ? index + 1 : index - 1);
  };

  return (
    <section
      {...(multiple ? { "aria-roledescription": "carousel" } : {})}
      aria-label={t("region")}
      data-detail-gallery=""
      className="theme-dark-block relative isolate h-[480px] overflow-hidden bg-dark-deep text-on-dark md:h-[min(78vh,640px)]"
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {current && (
        <div role="group" aria-roledescription="slide" aria-label={t("slide", { index: index + 1, total })} className="absolute inset-0 -z-10">
          <ResponsiveImage key={index} media={current} sizes="100vw" priority={index === 0} className="absolute inset-0" />
        </div>
      )}
      {/* Scrim: nền tối ở đỉnh (breadcrumb) và đáy (bộ đếm, nút) như mockup. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-b from-dark-deep/40 via-transparent via-30% to-dark-deep/75" />

      {breadcrumb && (
        <div className="absolute inset-x-0 top-5 z-10">
          <div className="mx-auto w-full max-w-container px-gutter">{breadcrumb}</div>
        </div>
      )}

      {multiple && (
        <>
          <button type="button" data-carousel-control="" aria-label={t("previous")} onClick={() => goTo(index - 1)} className={cn(ROUND_BUTTON, "absolute top-1/2 left-6 z-10 hidden -translate-y-1/2 md:inline-flex")}>
            <CaretLeft size={24} aria-hidden="true" />
          </button>
          <button type="button" data-carousel-control="" aria-label={t("next")} onClick={() => goTo(index + 1)} className={cn(ROUND_BUTTON, "absolute top-1/2 right-6 z-10 hidden -translate-y-1/2 md:inline-flex")}>
            <CaretRight size={24} aria-hidden="true" />
          </button>
        </>
      )}

      {/* Chừa đáy cho khối tiêu đề đè lên (48px ≥ md, 32px < md) + khe. */}
      <div className="absolute inset-x-0 bottom-14 z-10 md:bottom-[76px]">
        <div className="mx-auto flex w-full max-w-container flex-wrap items-center justify-between gap-x-6 gap-y-3 px-gutter md:flex-nowrap md:items-end">
          {multiple ? <GalleryCounter index={index} total={total} /> : <span />}
          <div className="flex items-center gap-3">
            {multiple && <GalleryThumbs images={images} index={index} onSelect={setIndex} />}
            {actions}
            {total > 0 && (
              <button ref={viewAllRef} type="button" onClick={() => setLightboxOpen(true)} className={GALLERY_ACTION_CLASS}>
                <List size={18} aria-hidden="true" />
                {t("viewAll")}
              </button>
            )}
          </div>
        </div>
      </div>

      {total > 0 && <Lightbox images={images} open={lightboxOpen} index={index} onOpenChange={setLightboxOpen} onIndexChange={setIndex} returnFocusRef={viewAllRef} />}
    </section>
  );
}
