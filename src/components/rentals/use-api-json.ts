"use client";

import { useEffect, useState } from "react";

interface ApiJsonState<T> {
  data: T | null;
  /** Đang chờ phản hồi cho `url` hiện tại. */
  loading: boolean;
  failed: boolean;
}

interface Settled<T> {
  url: string;
  data: T | null;
  failed: boolean;
}

/**
 * GET JSON từ API công khai khi `url` đổi (sau `delayMs` để gộp các lần gõ phím); huỷ yêu cầu cũ khi `url` đổi/đóng. `url = null` là không gọi.
 * Kết quả gắn với `url` đã gọi nên đổi `url` thì `data` cũ không bị dùng nhầm cho `url` mới.
 */
export function useApiJson<T>(url: string | null, delayMs = 0): ApiJsonState<T> {
  const [settled, setSettled] = useState<Settled<T> | null>(null);

  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(url, { headers: { Accept: "application/json" }, signal: controller.signal })
        .then((response) => (response.ok ? (response.json() as Promise<T>) : Promise.reject(new Error(String(response.status)))))
        .then((data) => setSettled({ url, data, failed: false }))
        .catch(() => {
          if (!controller.signal.aborted) setSettled({ url, data: null, failed: true });
        });
    }, delayMs);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [url, delayMs]);

  const current = url !== null && settled?.url === url ? settled : null;
  return { data: current?.data ?? null, loading: url !== null && current === null, failed: current?.failed ?? false };
}
