"use client";

import { useTranslations } from "next-intl";
import { type FocusEvent, type ReactNode, useState } from "react";
import { Pause, Play } from "@/components/icons";

/**
 * Phần tương tác duy nhất của khối Đối tác: nút Dừng / Phát (WCAG 2.2.2, cho cả màn cảm ứng không hover) + khung chạy.
 * Danh sách đối tác là `children` do Server Component dựng. Nút nằm NGOÀI vùng `group/partners` để focus ở nút không tự dừng dải
 * (nếu không, bấm "Phát" bằng bàn phím vẫn bị dừng do focus-within).
 * Focus BÀN PHÍM trong dải (:focus-visible): bỏ animation để dải về vị trí 0 (link gốc luôn nằm trong khung) và tắt mask mép;
 * focus CHUỘT chỉ tạm dừng (không nhảy vị trí nên click không trượt link); hover chỉ tạm dừng. reduced-motion: dải không chạy nên ẩn nút.
 */
/** Focus rời dải: trả scrollLeft (do focus cuộn tới link xa) về 0 để animation chạy lại từ đầu, không bị lệch. */
function resetScrollWhenFocusLeaves(event: FocusEvent<HTMLDivElement>) {
  if (event.currentTarget.contains(event.relatedTarget)) return;
  event.currentTarget.scrollLeft = 0;
}

export function PartnersMarqueeShell({ loopSeconds, children }: { loopSeconds: number; children: ReactNode }) {
  const t = useTranslations("page.home.partners");
  const [paused, setPaused] = useState(false);
  return (
    <>
      <div className="mx-auto flex w-full max-w-container justify-end px-gutter motion-reduce:hidden">
        <button
          type="button"
          aria-label={paused ? t("play") : t("pause")}
          onClick={() => setPaused((current) => !current)}
          className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full border border-border text-text transition-colors duration-(--duration-fast) hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          {paused ? <Play size={20} weight="fill" aria-hidden="true" /> : <Pause size={20} weight="fill" aria-hidden="true" />}
        </button>
      </div>
      <div
        onBlur={resetScrollWhenFocusLeaves}
        className="group/partners overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)] has-[:focus-visible]:[mask-image:none] motion-reduce:[mask-image:none]"
      >
        <div
          data-paused={paused}
          // Đặt thẳng trên phần tử: biến CSS khai trong `@theme` (:root) đã được thay var() tại gốc nên không đổi được theo phần tử.
          style={{ animationDuration: `${loopSeconds}s` }}
          className="flex w-max animate-partners-marquee data-[paused=true]:[animation-play-state:paused] group-focus-within/partners:[animation-play-state:paused] group-has-[:focus-visible]/partners:animate-none group-hover/partners:[animation-play-state:paused] motion-reduce:w-full motion-reduce:animate-none"
        >
          {children}
        </div>
      </div>
    </>
  );
}
