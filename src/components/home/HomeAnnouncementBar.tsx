"use client";

import { usePathname } from "@/i18n/navigation";
import type { AnnouncementView } from "@/lib/home/home-view";
import { AnnouncementBar } from "./AnnouncementBar";

/**
 * Chỉ dựng thanh thông báo ở trang chủ (`/` · `/en`). `usePathname` của next-intl trả đường dẫn đã bỏ tiền tố ngôn ngữ nên cả hai đều là `"/"`.
 * Thanh nằm ở khung trang dùng chung (trên header) mà KHÔNG dùng slot song song: slot catch-all làm mọi route danh sách mất ISR (build route table: ● → ƒ).
 * Client component dùng `usePathname` vẫn render đúng lúc SSR/tĩnh nên route giữ nguyên ISR; HTML cache của trang khác không chứa thanh.
 */
export function HomeAnnouncementBar({ announcement }: { announcement: AnnouncementView }) {
  return usePathname() === "/" ? <AnnouncementBar announcement={announcement} /> : null;
}
