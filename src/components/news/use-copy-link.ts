import { useEffect, useRef, useState } from "react";

export type CopyState = "idle" | "copied" | "failed";

/**
 * Sao chép liên kết bài vào clipboard (`url`, thiếu thì URL trang hiện tại) và giữ trạng thái 3s để báo qua vùng `aria-live`.
 * Dùng cho `ShareButtons` (tin tức, tuyển dụng, menu dự phòng của `DetailShareButton`).
 */
export function useCopyLink(url?: string) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(resetTimer.current), []);

  async function copyLink() {
    const target = url ?? window.location.href;
    try {
      await navigator.clipboard.writeText(target);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopyState("idle"), 3000);
  }

  return { copyState, copyLink };
}
