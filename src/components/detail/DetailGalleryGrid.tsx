"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { ArrowRight } from "@/components/icons";
import { Lightbox } from "@/components/media/Lightbox";
import { ResponsiveImage, type MediaImage } from "@/components/media/ResponsiveImage";
import { cn } from "@/lib/utils";

/** Ô hiện trên lưới: 1 ảnh lớn + 4 ảnh nhỏ; phần còn lại xem qua Lightbox. */
const VISIBLE = 5;

/**
 * Bố cục theo số ảnh hiện (n ≤ 5). cột nội dung ≥ 28rem (`@md/detail`): lưới 4×2, ảnh đầu 2×2; 3 ảnh → hai ô còn lại mỗi ô 2 cột, 4 ảnh → ô thứ hai 2 cột (không ô trống).
 * Hẹp hơn: 2 cột, ảnh đầu rộng hết; ô lẻ cuối rộng hết. 1–2 ảnh: một hàng, không ảnh lớn.
 */
function layout(position: number, shown: number): string {
  if (shown <= 2) return "aspect-16/10";
  const rest = shown - 1;
  const lastOdd = position === shown - 1 && rest % 2 === 1;
  return cn(
    "aspect-4/3 @md/detail:aspect-auto",
    position === 0 && "col-span-2 aspect-16/10 @md/detail:row-span-2",
    lastOdd && position !== 0 && "col-span-2 aspect-16/10 @md/detail:col-span-1",
    position > 0 && (shown === 3 || (shown === 4 && position === 1)) && "@md/detail:col-span-2",
  );
}

/**
 * Lưới ảnh khối "Hình ảnh" chi tiết (BL-052, design `detail-du-an`): 1 ảnh lớn + 4 ảnh nhỏ, mỗi ô là nút mở `Lightbox` đúng ảnh bấm (focus trả về ô đó);
 * "Xem tất cả hình ảnh" (khi > 1 ảnh) mở từ ảnh đầu. < 5 ảnh co lưới không để ô trống; 0 ảnh → không dựng. Ảnh dưới màn đầu: không `priority`.
 */
export function DetailGalleryGrid({ images }: { images: MediaImage[] }) {
  const t = useTranslations("detailKit.gallery");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const total = images.length;
  if (total === 0) return null;
  const shown = images.slice(0, VISIBLE);
  const bento = shown.length >= 3;

  const open = (index: number, opener: HTMLElement) => {
    openerRef.current = opener;
    setLightboxIndex(index);
  };

  return (
    <div>
      <ul className={cn("grid gap-3", shown.length === 1 ? "grid-cols-1" : "grid-cols-2", bento && "@md/detail:aspect-[2.2/1] @md/detail:grid-cols-4 @md/detail:grid-rows-2")}>
        {shown.map((image, position) => (
          <li key={position} className={cn("relative min-w-0 overflow-hidden rounded-[16px] bg-surface-muted", layout(position, shown.length))}>
            <button
              type="button"
              aria-label={t("open", { index: position + 1, total })}
              onClick={(event) => open(position, event.currentTarget)}
              className="group absolute inset-0 cursor-pointer overflow-hidden rounded-[16px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              <ResponsiveImage
                media={image}
                decorative
                sizes={position === 0 && bento ? "(min-width: 1024px) 560px, (min-width: 768px) 50vw, 100vw" : "(min-width: 1024px) 280px, (min-width: 768px) 25vw, 50vw"}
                className="absolute inset-0 transition-transform duration-(--duration-slow) ease-(--ease-out) group-hover:transform-(--hover-zoom)"
              />
            </button>
          </li>
        ))}
      </ul>
      {total > 1 && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={(event) => open(0, event.currentTarget)}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-small font-semibold text-accent-text transition-colors duration-(--duration-fast) hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            {t("viewAll")}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      )}
      <Lightbox
        images={images}
        open={lightboxIndex !== null}
        index={lightboxIndex ?? 0}
        onOpenChange={(isOpen) => !isOpen && setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
        returnFocusRef={openerRef}
      />
    </div>
  );
}
