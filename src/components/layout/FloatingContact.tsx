"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChatCircleDots, FacebookLogo, Headset, Phone, X } from "@/components/icons";
import type { ClickType } from "@/lib/click-stats/click-types";
import { cn } from "@/lib/utils";
import type { FloatingContactView } from "./shell-data";

const CLICK_EVENTS_URL = "/api/public/click-events";
const MAX_PAGE_PATH_LENGTH = 500;

/**
 * Ghi lượt bấm bằng `sendBeacon` (không chặn việc mở link, vẫn gửi được khi trang đang chuyển đi). Lỗi gửi không bao giờ
 * ảnh hưởng người dùng: thống kê là phụ, gọi/chat mới là chính. Endpoint đọc body dạng chữ nên Content-Type không quan trọng.
 */
export function sendClickBeacon(type: ClickType, pagePath: string): void {
  try {
    const body = JSON.stringify({ type, pagePath: pagePath.slice(0, MAX_PAGE_PATH_LENGTH) });
    navigator.sendBeacon?.(CLICK_EVENTS_URL, new Blob([body], { type: "application/json" }));
  } catch {
    // bỏ qua: xem ghi chú trên
  }
}

const BUTTON_BASE =
  "inline-flex size-12 items-center justify-center rounded-full shadow-lg transition-colors duration-(--duration-fast) ease-(--ease-standard)";

/**
 * Nút liên hệ nổi (design-spec §2.5). Mobile: thu gọn thành một nút "Liên hệ nhanh" bung ra 3 nút; ≥ md hiện cả 3 xếp dọc.
 * Nút tròn 48px (≥ 44px). Không đè banner cookie: vị trí đáy cộng `--floating-bottom-offset` (mặc định 0); banner cookie
 * (task riêng) đặt biến này trên `<html>` bằng chiều cao của nó khi đang hiện. ≥ md banner nằm góc trái nên không va chạm.
 */
export function FloatingContact({ contact }: { contact: FloatingContactView }) {
  const t = useTranslations("page.floating");
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const { hotline, zaloUrl, fanpageUrl } = contact;
  if (!hotline && !zaloUrl && !fanpageUrl) return null;

  return (
    <div
      role="group"
      aria-label={t("group")}
      className="fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[calc(max(1rem,env(safe-area-inset-bottom))+var(--floating-bottom-offset,0px))] z-(--z-floating) flex flex-col items-end gap-3"
    >
      <ul id="floating-contact-actions" className={cn("flex-col items-end gap-3", open ? "flex" : "hidden md:flex")}>
        {hotline && (
          <li>
            <a
              href={hotline.telHref}
              aria-label={`${t("hotline")}: ${hotline.label}`}
              onClick={() => sendClickBeacon("hotline", pathname)}
              className={cn(BUTTON_BASE, "bg-primary text-primary-foreground hover:bg-primary-hover")}
            >
              <Phone size={24} weight="fill" aria-hidden="true" />
            </a>
          </li>
        )}
        {zaloUrl && (
          <li>
            <a
              href={zaloUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("zalo")}
              onClick={() => sendClickBeacon("zalo", pathname)}
              className={cn(BUTTON_BASE, "bg-dark text-on-dark hover:bg-dark-deep")}
            >
              <ChatCircleDots size={24} aria-hidden="true" />
            </a>
          </li>
        )}
        {fanpageUrl && (
          <li>
            <a
              href={fanpageUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("fanpage")}
              onClick={() => sendClickBeacon("fanpage", pathname)}
              className={cn(BUTTON_BASE, "bg-dark text-on-dark hover:bg-dark-deep")}
            >
              <FacebookLogo size={24} aria-hidden="true" />
            </a>
          </li>
        )}
      </ul>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="floating-contact-actions"
        aria-label={open ? t("close") : t("open")}
        onClick={() => setOpen((value) => !value)}
        className={cn(BUTTON_BASE, "cursor-pointer bg-primary text-primary-foreground hover:bg-primary-hover md:hidden")}
      >
        {open ? <X size={24} aria-hidden="true" /> : <Headset size={24} aria-hidden="true" />}
      </button>
    </div>
  );
}
