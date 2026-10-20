"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { GALLERY_ACTION_CLASS } from "@/components/detail/DetailGalleryHero";
import { Play } from "@/components/icons";
import { VideoFacade } from "@/components/media/VideoFacade";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

/**
 * Nút "Video" cạnh "Xem tất cả ảnh" trên ảnh lớn (mockup `detail-rent`): mở hộp thoại chứa `VideoFacade` (iframe chỉ tạo SAU khi bấm phát,
 * đóng hộp thì gỡ iframe nên video dừng). Radix lo bẫy focus, Esc đóng, trả focus về nút. Chỉ dựng khi tin có video hợp lệ.
 */
export function RentalVideoButton({ url, title }: { url: string; title: string }) {
  const t = useTranslations("page.rentalDetail.video");
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={GALLERY_ACTION_CLASS}>
        <Play size={18} weight="fill" aria-hidden="true" />
        {t("button")}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent closeLabel={t("close")} className="max-w-3xl">
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription className="sr-only">{title}</DialogDescription>
          <VideoFacade url={url} title={title} />
        </DialogContent>
      </Dialog>
    </>
  );
}
