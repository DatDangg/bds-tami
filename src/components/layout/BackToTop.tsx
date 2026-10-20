"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ArrowUp } from "@/components/icons";
import { cn } from "@/lib/utils";

/**
 * Nút nổi "Lên đầu trang" (BL-035): chỉ hiện khi đã cuộn quá một màn hình. Ẩn bằng `invisible` (khỏi cây a11y + thứ tự Tab, vẫn chạy được transition).
 * Sau khi cuộn, focus chuyển vào `#main` (đích của SkipLink, `tabIndex=-1`) để người dùng bàn phím không bị kẹt ở nút vừa ẩn.
 */
export function BackToTop() {
  const t = useTranslations("page.floating");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setVisible(window.scrollY > window.innerHeight);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  function scrollToTop() {
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "instant" : "smooth" });
    document.getElementById("main")?.focus({ preventScroll: true });
  }

  return (
    <button
      type="button"
      aria-label={t("backToTop")}
      onClick={scrollToTop}
      className={cn(
        "pointer-events-auto inline-flex size-12 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-text shadow-lg transition-[opacity,visibility,background-color] duration-(--duration-fast) ease-(--ease-standard) hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none",
        visible ? "visible opacity-100" : "invisible opacity-0",
      )}
    >
      <ArrowUp size={24} aria-hidden="true" />
    </button>
  );
}
