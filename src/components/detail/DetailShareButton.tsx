"use client";

import { useTranslations } from "next-intl";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { ShareNetwork } from "@/components/icons";
import { ShareButtons } from "@/components/news/ShareButtons";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DetailShareButtonProps {
  /** URL tuyệt đối canonical của trang; thiếu thì menu chỉ còn sao chép liên kết trang hiện tại. */
  url?: string;
  title: string;
  /** Có chữ → nút viên thuốc viền (icon + chữ, hero chi tiết tuyển dụng BL-054); không truyền → nút tròn chỉ icon như cũ. */
  label?: string;
}

/** Người đóng hộp chia sẻ hệ thống không phải lỗi: không mở menu dự phòng. So `name` thay vì `instanceof` vì `DOMException` có thể khác realm. */
function isUserCancel(error: unknown) {
  return typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";
}

/**
 * Nút chia sẻ tròn ở khối tiêu đề trang chi tiết (mockup `.round`): có Web Share API thì mở hộp chia sẻ hệ thống; không có (hoặc lỗi khác huỷ)
 * thì mở menu dự phòng ngay dưới nút (tái dùng `ShareButtons`: Facebook, Zalo, sao chép). Esc / bấm ra ngoài đóng menu, Esc trả focus về nút.
 */
export function DetailShareButton({ url, title, label }: DetailShareButtonProps) {
  const t = useTranslations("page.detail.share");
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  async function share() {
    if (menuOpen) {
      setMenuOpen(false);
      return;
    }
    if (!("share" in navigator)) {
      setMenuOpen(true);
      return;
    }
    try {
      await navigator.share({ title, url: url ?? window.location.href });
    } catch (error) {
      if (!isUserCancel(error)) setMenuOpen(true);
    }
  }

  function closeOnEscape(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Escape" || !menuOpen) return;
    event.stopPropagation();
    setMenuOpen(false);
    buttonRef.current?.focus();
  }

  return (
    <div ref={rootRef} className="relative" onKeyDown={closeOnEscape}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label ? undefined : t("button")}
        aria-expanded={menuOpen}
        aria-controls={menuId}
        onClick={share}
        className={
          label
            ? cn(buttonVariants({ variant: "outline" }), "bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring")
            : "inline-flex size-11 cursor-pointer items-center justify-center rounded-full border border-border text-text transition-colors duration-(--duration-fast) hover:border-input-border hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        }
      >
        <ShareNetwork size={20} aria-hidden="true" />
        {label}
      </button>
      <div
        id={menuId}
        hidden={!menuOpen}
        role="group"
        aria-label={t("menu")}
        className="absolute top-full right-0 z-10 mt-2 w-max max-w-[calc(100vw-2rem)] rounded-[16px] border border-border bg-surface p-3 shadow-lg"
      >
        {menuOpen && <ShareButtons title={title} {...(url ? { url } : {})} />}
      </div>
    </div>
  );
}
