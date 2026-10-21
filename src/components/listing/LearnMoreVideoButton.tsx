"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Play } from "@/components/icons";
import { VideoFacade } from "@/components/media/VideoFacade";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

/**
 * Nút phát tròn giữa ảnh "Tìm hiểu thêm" (BL-052): mở hộp thoại chứa `VideoFacade` (iframe chỉ tạo sau khi bấm phát; đóng hộp thì gỡ iframe nên video dừng).
 * Radix lo bẫy focus, Esc, trả focus. Trang chỉ dựng nút khi `videoUrl` hợp lệ (`parseVideoUrl`).
 */
export function LearnMoreVideoButton({ url, title }: { url: string; title: string }) {
  const t = useTranslations("page.listing.learnMore");
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label={t("play", { title })}
        onClick={() => setOpen(true)}
        className="absolute top-1/2 left-1/2 inline-flex size-16 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-surface text-accent-text shadow-lg transition-transform duration-(--duration-fast) hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none"
      >
        <Play size={26} weight="fill" aria-hidden="true" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent closeLabel={t("close")} className="max-w-3xl">
          <DialogTitle>{t("videoTitle")}</DialogTitle>
          <DialogDescription className="sr-only">{title}</DialogDescription>
          <VideoFacade url={url} title={title} />
        </DialogContent>
      </Dialog>
    </>
  );
}
