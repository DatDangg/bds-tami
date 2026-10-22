"use client";

import { useEffect } from "react";

export const NEWS_VIEWS_URL = "/api/public/news-views";
/** Trễ sau khi trang hiện ra: người mở rồi đóng ngay / trang tải trước không tính là đã đọc. */
export const NEWS_VIEW_DELAY_MS = 1500;

/** Gửi một lượt xem. `sendBeacon` (Blob `text/plain`, không preflight); không có thì `fetch keepalive`. Lỗi gửi bị bỏ qua. */
function sendNewsView(newsId: string): void {
  const body = JSON.stringify({ newsId });
  try {
    if (navigator.sendBeacon?.(NEWS_VIEWS_URL, new Blob([body], { type: "text/plain;charset=UTF-8" }))) return;
    void fetch(NEWS_VIEWS_URL, {
      method: "POST",
      body,
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      keepalive: true,
      credentials: "omit",
    }).catch(() => undefined);
  } catch {
    // Thống kê là phụ: không bao giờ làm hỏng trang đọc bài.
  }
}

/**
 * Đếm lượt xem bài (khối "Đọc nhiều", BL-054). Chạy phía client nên trang chi tiết vẫn ISR, không phụ thuộc endpoint.
 * Gửi ĐÚNG một lần mỗi lần mount, sau `NEWS_VIEW_DELAY_MS` kể từ lúc tab hiện (`visibilityState === "visible"`); tab ẩn thì
 * chờ tới khi hiện. Trình duyệt tự động hoá (`navigator.webdriver`) không gửi. Không render gì.
 */
export function NewsViewBeacon({ newsId }: { newsId: string }) {
  useEffect(() => {
    if (navigator.webdriver) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let sent = false;

    const schedule = () => {
      if (sent || timer !== undefined || document.visibilityState !== "visible") return;
      timer = setTimeout(() => {
        // Tab bị ẩn trong lúc chờ: đợi lần hiện tiếp theo.
        timer = undefined;
        if (document.visibilityState !== "visible") return;
        sent = true;
        document.removeEventListener("visibilitychange", schedule);
        sendNewsView(newsId);
      }, NEWS_VIEW_DELAY_MS);
    };

    document.addEventListener("visibilitychange", schedule);
    schedule();
    return () => {
      document.removeEventListener("visibilitychange", schedule);
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [newsId]);

  return null;
}
