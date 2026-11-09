"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CopyState = "idle" | "copied" | "failed";

interface CopyEmailButtonProps {
  email: string;
  /** `onDark`: nút chip + chữ báo kết quả trắng, dùng trong banner tối; mặc định cho nền sáng. */
  tone?: "light" | "onDark";
}

/**
 * Nút "Sao chép email" đặt cạnh liên kết `mailto:` (BL-114): máy không có ứng dụng email mặc định thì `mailto:` bấm không thấy gì,
 * nên người dùng cần cách lấy địa chỉ để dán vào webmail. Kết quả báo bằng chữ nhìn thấy qua vùng `aria-live` (site công khai không có toast).
 * Lỗi clipboard (http, bị chặn quyền) → in luôn email trong câu báo để vẫn chép tay được.
 */
export function CopyEmailButton({ email, tone = "light" }: CopyEmailButtonProps) {
  const t = useTranslations("page.careers.v2");
  const [state, setState] = useState<CopyState>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(resetTimer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setState("copied");
    } catch {
      setState("failed");
    }
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setState("idle"), 3000);
  }

  const message = state === "copied" ? t("cvCopied") : state === "failed" ? t("cvCopyFailed", { email }) : "";
  return (
    <div className="flex flex-wrap items-center gap-y-2">
      <Button
        onClick={copy}
        variant={tone === "onDark" ? "chip" : "secondary"}
        size={tone === "onDark" ? "lg" : "md"}
        className={cn(
          "min-w-11 focus-visible:outline-2 focus-visible:outline-offset-2",
          // Trên banner có ảnh vòng focus mặc định chỉ ~2.9:1 trên scrim đè ảnh trắng (contrast.test.ts) → dùng outline-on-dark.
          tone === "onDark" ? "focus-visible:outline-on-dark" : "focus-visible:outline-focus-ring",
        )}
      >
        {t("cvCopy")}
      </Button>
      {/* aria-live thay vì role="status": ở trạng thái trống nút nằm trong panel đã là role="status", lồng thêm sẽ thành hai vùng trùng vai trò. */}
      <span aria-live="polite" aria-atomic="true" className={cn("text-small", message && "ms-3", tone === "onDark" ? "text-on-dark" : "text-text-secondary")}>
        {message}
      </span>
    </div>
  );
}
