"use client";

import { useTranslations } from "next-intl";
import { ResponsiveImage, type MediaImage } from "@/components/media/ResponsiveImage";
import { cn } from "@/lib/utils";

/** Số ảnh nhỏ tối đa ở đáy phải (≥ lg). */
const MAX_THUMBS = 4;

const twoDigits = (value: number) => String(value).padStart(2, "0");

/** Cửa sổ ≤ 4 ảnh nhỏ bao quanh ảnh đang xem (ảnh đang xem không bị trượt ra ngoài). */
function thumbWindow(index: number, total: number): number[] {
  const size = Math.min(MAX_THUMBS, total);
  const start = Math.min(Math.max(index - 1, 0), total - size);
  return Array.from({ length: size }, (_, offset) => start + offset);
}

/** Bộ đếm `01 / N` + thanh tiến trình (như `HeroSlider`). Chỉ để nhìn: nhóm slide đã có `aria-label` "Ảnh i / n". */
export function GalleryCounter({ index, total }: { index: number; total: number }) {
  return (
    <div aria-hidden="true" className="flex items-center gap-3.5 text-small font-semibold tabular-nums">
      <span>
        {twoDigits(index + 1)} <span className="font-normal text-on-dark-muted">/ {twoDigits(total)}</span>
      </span>
      <span className="relative h-0.5 w-24 bg-on-dark/35 md:w-[120px]">
        <span className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-(--duration-base) motion-reduce:transition-none" style={{ width: `${((index + 1) / total) * 100}%` }} />
      </span>
    </div>
  );
}

interface GalleryThumbsProps {
  images: MediaImage[];
  index: number;
  onSelect: (position: number) => void;
}

/** Dải ≤ 4 ảnh nhỏ ở đáy phải, chỉ hiện ≥ lg. Mỗi ảnh nhỏ là điều khiển của carousel (`data-carousel-control`: phím ←/→ đổi ảnh). */
export function GalleryThumbs({ images, index, onSelect }: GalleryThumbsProps) {
  const t = useTranslations("page.detail.gallery");
  return (
    <ul aria-label={t("thumbs")} className="hidden gap-2 lg:flex">
      {thumbWindow(index, images.length).map((position) => {
        const image = images[position];
        if (!image) return null;
        return (
          <li key={position}>
            <button
              type="button"
              data-carousel-control=""
              aria-label={t("thumb", { index: position + 1 })}
              aria-current={position === index ? "true" : undefined}
              onClick={() => onSelect(position)}
              className={cn(
                "block h-[52px] w-[72px] cursor-pointer overflow-hidden rounded-[8px] border-2 opacity-70 transition-opacity duration-(--duration-fast) hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
                position === index ? "border-primary opacity-100" : "border-transparent",
              )}
            >
              <span className="relative block size-full">
                <ResponsiveImage media={image} sizes="72px" decorative className="absolute inset-0" />
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
