"use client";

import { useTranslations } from "next-intl";
import { Play } from "@/components/icons";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

/**
 * Nút play của khối Về TAMI (BL-044): nằm trên dải scrim đáy ảnh lớn, bấm mở video YouTube trong Dialog.
 * `iframe` chỉ được dựng khi hộp thoại mở (không nạp bên thứ ba lúc tải trang); `embedUrl` đã dựng từ ID đã kiểm ở view model (youtube-nocookie).
 */
export function AboutVideoButton({ embedUrl, label }: { embedUrl: string; label: string }) {
  const t = useTranslations("page.home.about");
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group inline-flex min-h-11 cursor-pointer items-center gap-3 rounded-pill text-on-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-dark"
        >
          <span aria-hidden="true" className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors duration-(--duration-fast) group-hover:bg-primary-hover">
            <Play size={18} weight="fill" />
          </span>
          <span className="text-button font-semibold uppercase">{label}</span>
        </button>
      </DialogTrigger>
      <DialogContent closeLabel={t("closeVideo")} aria-describedby={undefined} className="max-w-4xl gap-0 p-2 pt-14">
        <DialogTitle className="sr-only">{label}</DialogTitle>
        <div className="aspect-video w-full overflow-hidden rounded-md bg-dark">
          <iframe
            src={embedUrl}
            title={label}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="size-full border-0"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
