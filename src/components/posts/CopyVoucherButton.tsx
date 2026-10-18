"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

type CopyState = "idle" | "copied" | "failed";

/** Nút "Sao chép" mã voucher; kết quả báo qua vùng `aria-live` (không dùng toast để màn hình đọc và bàn phím đều nhận được). */
export function CopyVoucherButton({ code }: { code: string }) {
  const t = useTranslations("page.posts.offer");
  const [state, setState] = useState<CopyState>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(resetTimer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setState("copied");
    } catch {
      setState("failed");
    }
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setState("idle"), 3000);
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm border border-primary bg-surface px-4 text-small font-semibold text-text hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        {t("copy")}
      </button>
      <span role="status" aria-live="polite" className="text-small text-text-secondary">
        {state === "copied" ? t("copied") : state === "failed" ? t("copyFailed") : ""}
      </span>
    </>
  );
}
