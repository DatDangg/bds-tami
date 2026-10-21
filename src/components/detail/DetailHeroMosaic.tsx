"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useId, useRef, useState } from "react";
import { MapPin, Play } from "@/components/icons";
import { Lightbox } from "@/components/media/Lightbox";
import { ResponsiveImage, type MediaImage } from "@/components/media/ResponsiveImage";
import { VideoFacade } from "@/components/media/VideoFacade";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Số ảnh nhỏ tối đa ở cột phải (≥ lg): `images[1..3]`. */
const MAX_THUMBS = 3;

const VIEW_ALL_PILL =
  "inline-flex min-h-11 cursor-pointer items-center rounded-pill border border-on-dark/50 bg-dark-deep/40 px-4 text-small font-semibold text-on-dark backdrop-blur-sm transition-colors duration-(--duration-fast) hover:bg-dark-deep/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

interface DetailHeroMosaicProps {
  /** Ảnh dự án / tin; ảnh đầu là nền hero và ảnh LCP. Rỗng → nền tối, không nút ảnh. */
  images: MediaImage[];
  /** `h1` duy nhất của trang. */
  title: string;
  /** Breadcrumb `variant="overlay"` đã dựng (server). */
  breadcrumb?: ReactNode;
  /**
   * Hàng badge trên `h1` (danh mục, tình trạng…). Nằm trong `theme-dark-block` (chữ token = trắng): chọn biến thể đọc được trên nền tối
   * (`primary` / `success` / `dark`, hoặc chip viền sáng) — `neutral` / `muted` (nền `surface-muted` + chữ token) sẽ mất tương phản.
   */
  badges?: ReactNode;
  /** Địa chỉ kèm ghim; trống → ẩn. */
  address?: string | null;
  /** Mô tả ngắn dưới địa chỉ; trống → ẩn. */
  summary?: string | null;
  /** Link YouTube/TikTok đã kiểm hợp lệ ở trang; trống → không có nút video. */
  videoUrl?: string | null;
  /** Nút phụ cạnh nút video (vd chia sẻ, "Video" riêng trang). */
  actions?: ReactNode;
}

/**
 * Hero ảnh full-bleed đầu trang chi tiết (BL-052, design `detail-du-an`): ảnh 1 phủ nền (`priority`, `sizes="100vw"`, khung có chiều cao tối thiểu → không CLS),
 * scrim token tối dần về trái + đáy; trái là breadcrumb, badge, `h1`, ghim địa chỉ, mô tả ngắn, nút "Xem video giới thiệu" (Dialog + `VideoFacade`, iframe chỉ tạo khi bấm phát).
 * ≥ lg cột phải ≤ 3 ảnh nhỏ (`images[1..3]`), ảnh nhỏ đầu phủ nhãn "Xem tất cả N ảnh"; < lg ảnh nhỏ ẩn, nút "Xem tất cả N ảnh" nằm trên ảnh. Mọi nút ảnh mở `Lightbox`
 * (bàn phím, bẫy focus) đúng ảnh đã bấm. 1 ảnh → không ảnh nhỏ, không nút. Chừa đáy để `DetailSpecBar` nổi đè lên.
 */
export function DetailHeroMosaic({ images, title, breadcrumb, badges, address, summary, videoUrl, actions }: DetailHeroMosaicProps) {
  const t = useTranslations("detailKit.hero");
  const headingId = useId();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const openerRef = useRef<HTMLElement | null>(null);
  const total = images.length;
  const cover = images[0];
  const thumbs = images.slice(1, 1 + MAX_THUMBS);
  const multiple = total > 1;

  const openLightbox = (index: number, opener: HTMLElement) => {
    openerRef.current = opener;
    setLightboxIndex(index);
  };

  return (
    <section aria-labelledby={headingId} data-detail-hero="" className="theme-dark-block relative isolate overflow-hidden bg-dark-deep text-on-dark">
      {cover && <ResponsiveImage media={cover} sizes="100vw" priority className="absolute inset-0 -z-10" />}
      {/* Scrim: tối bên trái (khối chữ) + đáy (chỗ thanh thông số đè lên) như design. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-r from-dark-deep/80 via-dark-deep/45 to-dark-deep/10" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-b from-dark-deep/40 via-transparent via-35% to-dark-deep/60" />

      <div className="mx-auto flex min-h-[520px] w-full max-w-container flex-col px-gutter pt-5 pb-20 md:min-h-[min(78vh,600px)] md:pb-24">
        {breadcrumb}
        <div className="grid flex-1 gap-8 pt-8 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-stretch xl:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="flex min-w-0 flex-col justify-end gap-4">
            {badges && <div className="flex flex-wrap items-center gap-2">{badges}</div>}
            <h1 id={headingId} className="max-w-[40rem] font-display text-h1 text-balance">
              {title}
            </h1>
            {address && (
              <p className="flex items-start gap-1.5 text-small text-on-dark/90">
                <MapPin size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-on-dark-accent" />
                {address}
              </p>
            )}
            {summary && <p className="line-clamp-3 max-w-[36rem] text-on-dark/90">{summary}</p>}
            {(videoUrl || actions || multiple) && (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {videoUrl && (
                  <button
                    type="button"
                    onClick={() => setVideoOpen(true)}
                    className="group inline-flex min-h-11 cursor-pointer items-center gap-3 rounded-pill pr-2 text-small font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  >
                    <span aria-hidden="true" className="inline-flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors duration-(--duration-fast) group-hover:bg-primary-hover">
                      <Play size={20} weight="fill" />
                    </span>
                    {t("playVideo")}
                  </button>
                )}
                {actions}
                {multiple && (
                  <button type="button" onClick={(event) => openLightbox(0, event.currentTarget)} className={cn(VIEW_ALL_PILL, "lg:hidden")}>
                    {t("viewAll", { count: total })}
                  </button>
                )}
              </div>
            )}
          </div>

          {thumbs.length > 0 && (
            <ul aria-label={t("thumbs")} className="hidden min-h-0 flex-col gap-3 lg:flex">
              {thumbs.map((image, offset) => {
                const index = offset + 1;
                const first = offset === 0;
                return (
                  <li key={index} className="relative min-h-24 flex-1">
                    <button
                      type="button"
                      aria-label={first ? t("viewAll", { count: total }) : t("viewPhoto", { index: index + 1 })}
                      onClick={(event) => openLightbox(first ? 0 : index, event.currentTarget)}
                      className="group absolute inset-0 cursor-pointer overflow-hidden rounded-[14px] border-2 border-on-dark/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                    >
                      <ResponsiveImage media={image} sizes="(min-width: 1280px) 304px, 272px" decorative className="absolute inset-0 transition-transform duration-(--duration-slow) ease-(--ease-out) group-hover:transform-(--hover-zoom)" />
                      {first && (
                        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 bg-linear-to-t from-dark-deep/75 to-transparent px-3 pt-6 pb-2.5 text-right text-small font-semibold text-on-dark">
                          {t("viewAll", { count: total })}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {total > 0 && (
        <Lightbox
          images={images}
          open={lightboxIndex !== null}
          index={lightboxIndex ?? 0}
          onOpenChange={(open) => !open && setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
          returnFocusRef={openerRef}
        />
      )}
      {videoUrl && (
        <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
          <DialogContent closeLabel={t("videoClose")} className="max-w-3xl">
            <DialogTitle>{t("videoTitle")}</DialogTitle>
            <DialogDescription className="sr-only">{title}</DialogDescription>
            <VideoFacade url={videoUrl} title={title} />
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}
