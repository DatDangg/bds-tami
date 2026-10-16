"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { useTranslations } from "next-intl";
import { useRef, type KeyboardEvent, type PointerEvent, type RefObject } from "react";
import { CaretLeft, CaretRight, X } from "@/components/icons";
import { ResponsiveImage, type MediaImage } from "./ResponsiveImage";

const SWIPE_MIN_DISTANCE_PX = 50;

type LightboxProps = {
  images: MediaImage[];
  open: boolean;
  index: number;
  onOpenChange: (open: boolean) => void;
  onIndexChange: (index: number) => void;
  /** Phần tử đã mở lightbox: nhận lại focus khi đóng (Radix chỉ tự trả focus về `Trigger`, ở đây không dùng Trigger). */
  /** Không truyền thì focus trả về phần tử đang focus ngay trước khi lightbox mở. */
  returnFocusRef?: RefObject<HTMLElement | null>;
};

const controlClass =
  "absolute inline-flex size-11 cursor-pointer items-center justify-center rounded-sm bg-dark-deep/60 text-on-dark transition-colors duration-(--duration-fast) hover:bg-dark-deep";

/** Toàn màn hình nền `--color-dark-deep` (design-spec §3.7): ← → Esc, vuốt trên mobile, `alt` làm chú thích. */
export function Lightbox({ images, open, index, onOpenChange, onIndexChange, returnFocusRef }: LightboxProps) {
  const t = useTranslations("media.lightbox");
  const swipeStartX = useRef<number | null>(null);
  const focusBeforeOpen = useRef<HTMLElement | null>(null);
  const total = images.length;
  const current = images[index];
  if (total === 0 || !current) return null;

  const go = (step: number) => onIndexChange((index + step + total) % total);

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowLeft") go(-1);
    else if (event.key === "ArrowRight") go(1);
    else return;
    event.preventDefault();
  }

  function handlePointerUp(event: PointerEvent) {
    if (swipeStartX.current === null) return;
    const distance = event.clientX - swipeStartX.current;
    swipeStartX.current = null;
    if (Math.abs(distance) >= SWIPE_MIN_DISTANCE_PX) go(distance > 0 ? -1 : 1);
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-(--z-modal) bg-dark-deep data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-(--z-modal) flex flex-col text-on-dark"
          onKeyDown={handleKeyDown}
          onOpenAutoFocus={() => {
            // Sự kiện này bắn trước khi Radix chuyển focus vào dialog nên activeElement vẫn là phần tử đã mở lightbox.
            focusBeforeOpen.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            (returnFocusRef?.current ?? focusBeforeOpen.current)?.focus();
          }}
        >
          <DialogPrimitive.Title className="sr-only">{t("title")}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">{t("description")}</DialogPrimitive.Description>
          <div
            className="relative min-h-0 flex-1 touch-pan-y"
            onPointerDown={(event) => (swipeStartX.current = event.clientX)}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => (swipeStartX.current = null)}
          >
            <ResponsiveImage key={index} media={current} sizes="100vw" fit="contain" />
          </div>
          <div className="flex min-h-14 items-center justify-between gap-4 px-4 py-3 text-small">
            <p className="min-w-0 flex-1 wrap-break-word">{current.alt}</p>
            <p aria-live="polite" className="shrink-0 text-on-dark-muted">
              {t("counter", { current: index + 1, total })}
            </p>
          </div>
          <DialogPrimitive.Close aria-label={t("close")} className={`${controlClass} top-2 right-2`}>
            <X size={24} aria-hidden="true" />
          </DialogPrimitive.Close>
          {total > 1 && (
            <>
              <button type="button" aria-label={t("previous")} onClick={() => go(-1)} className={`${controlClass} top-1/2 left-2 -translate-y-1/2`}>
                <CaretLeft size={24} aria-hidden="true" />
              </button>
              <button type="button" aria-label={t("next")} onClick={() => go(1)} className={`${controlClass} top-1/2 right-2 -translate-y-1/2`}>
                <CaretRight size={24} aria-hidden="true" />
              </button>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
