"use client";

import { useTranslations } from "next-intl";
import { useRef, useState, useSyncExternalStore, type UIEvent } from "react";
import { cn } from "@/lib/utils";
import { Lightbox } from "./Lightbox";
import { ResponsiveImage, type MediaImage } from "./ResponsiveImage";

const BENTO_MIN_IMAGES = 3;
const BENTO_VISIBLE_IMAGES = 5;

type GalleryProps = {
  images: MediaImage[];
  /** Đặt `true` khi ảnh đầu là ảnh LCP của trang (chỉ ảnh đầu được ưu tiên tải). */
  priorityFirst?: boolean;
  className?: string;
};

const slotClass = "relative aspect-4/3 w-full shrink-0 snap-center overflow-hidden rounded-sm bg-surface-muted";
const BELOW_MD_QUERY = "(max-width: 767.98px)";

function subscribeBelowMd(onChange: () => void) {
  if (typeof window.matchMedia !== "function") return () => {};
  const query = window.matchMedia(BELOW_MD_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * Dưới breakpoint md ảnh là carousel (design-spec §1.4) nên mới gắn ngữ nghĩa carousel/slide;
 * từ md là lưới bento, gắn "slide" cho ô lưới sẽ sai ngữ nghĩa. Mặc định (SSR, không có matchMedia) là mobile-first.
 * Chỉ đổi thuộc tính ARIA, không đổi DOM/kích thước nên không ảnh hưởng CLS.
 */
function useIsCarousel() {
  return useSyncExternalStore(
    subscribeBelowMd,
    () => (typeof window.matchMedia === "function" ? window.matchMedia(BELOW_MD_QUERY).matches : true),
    () => true,
  );
}

// Bento 4x2: ảnh đầu 2x2. 3 ảnh: hai ô còn lại mỗi ô 2 cột; 4 ảnh: ô thứ hai 2 cột. Không để ô trống.
function bentoSpanClass(position: number, total: number) {
  if (position === 0) return "md:col-span-2 md:row-span-2";
  if (total === 3 || (total === 4 && position === 1)) return "md:col-span-2";
  return undefined;
}

/**
 * Chi tiết dự án / tin cho thuê (design-spec §3.7): mobile là carousel vuốt (scroll-snap) có đếm "1/12";
 * >= md là bento 1 ảnh lớn + 4 ảnh nhỏ, ảnh thứ 5 phủ "+n ảnh". Một bộ DOM duy nhất cho cả hai bố cục
 * để ảnh LCP không bị tải hai lần. Dưới 3 ảnh (dữ liệu lỗi): chỉ hiện ảnh đầu, ẩn lưới.
 */
export function Gallery({ images, priorityFirst = false, className }: GalleryProps) {
  const t = useTranslations("media.gallery");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const openerRef = useRef<HTMLElement | null>(null);
  const isCarousel = useIsCarousel();
  const total = images.length;
  if (total === 0) return null;

  const isBento = total >= BENTO_MIN_IMAGES;
  const shown = isBento ? images : images.slice(0, 1);
  const hiddenCount = total - BENTO_VISIBLE_IMAGES;

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const track = event.currentTarget;
    setSlideIndex(Math.round(track.scrollLeft / track.clientWidth));
  }

  return (
    <section aria-label={t("region")} aria-roledescription={isCarousel ? "carousel" : undefined} className={cn("relative", className)}>
      <div
        onScroll={handleScroll}
        className={cn(
          "flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain md:gap-3 md:overflow-visible",
          isBento && "md:grid md:aspect-2/1 md:grid-cols-4 md:grid-rows-2",
        )}
      >
        {shown.map((image, position) => {
          const isOverflowSlot = isBento && position === BENTO_VISIBLE_IMAGES - 1 && hiddenCount > 0;
          return (
            <div
              key={position}
              role={isCarousel ? "group" : undefined}
              aria-roledescription={isCarousel ? "slide" : undefined}
              aria-label={isCarousel ? t("slide", { index: position + 1, total }) : undefined}
              className={cn(slotClass, isBento && "md:aspect-auto md:h-full", isBento && bentoSpanClass(position, total), position >= BENTO_VISIBLE_IMAGES && "md:hidden")}
            >
              <button
                type="button"
                aria-label={t("open", { index: position + 1, total })}
                onClick={(event) => {
                  openerRef.current = event.currentTarget;
                  setLightboxIndex(position);
                }}
                className="group block size-full cursor-pointer overflow-hidden"
              >
                <ResponsiveImage
                  media={image}
                  priority={priorityFirst && position === 0}
                  sizes={isBento && position === 0 ? "(min-width: 1280px) 640px, (min-width: 768px) 50vw, 100vw" : "(min-width: 1280px) 320px, (min-width: 768px) 25vw, 100vw"}
                  className="transition-transform duration-(--duration-slow) ease-(--ease-out) group-hover:transform-(--hover-zoom)"
                />
                {isOverflowSlot && (
                  <span className="absolute inset-0 hidden items-center justify-center bg-dark-deep/60 font-display text-h3 text-on-dark md:flex">
                    {t("more", { count: hiddenCount })}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>
      {isBento && (
        <p className="absolute right-3 bottom-3 rounded-sm bg-dark-deep/70 px-2 py-1 text-small text-on-dark md:hidden">
          {t("counter", { current: slideIndex + 1, total })}
        </p>
      )}
      <Lightbox
        images={images}
        open={lightboxIndex !== null}
        index={lightboxIndex ?? 0}
        onOpenChange={(open) => !open && setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
        returnFocusRef={openerRef}
      />
    </section>
  );
}
