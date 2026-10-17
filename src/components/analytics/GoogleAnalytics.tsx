"use client";

import { useEffect } from "react";
import { clearGoogleAnalyticsCookies, isValidGaMeasurementId } from "@/lib/consent/consent-cookie";

const SCRIPT_ID = "tami-gtag";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    [key: `ga-disable-${string}`]: boolean | undefined;
  }
}

function loadGtag(measurementId: string): void {
  window[`ga-disable-${measurementId}`] = false;
  if (document.getElementById(SCRIPT_ID)) return;
  window.dataLayer = window.dataLayer ?? [];
  // gtag.js đọc đối tượng `arguments` nguyên bản, đẩy mảng thường vào dataLayer thì lệnh bị bỏ qua.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId);
  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
}

/**
 * Chèn GA4 CHỈ khi `enabled` (khách đã đồng ý) và có mã đo lường hợp lệ. Không render DOM nên HTML trang không đổi.
 * Rút lại đồng ý khi gtag đã tải: bật cờ `ga-disable-<ID>` (dừng gửi ngay) + xoá `_ga*`; lần tải trang sau không còn script.
 */
export function GoogleAnalytics({ measurementId, enabled }: { measurementId: string | null; enabled: boolean }) {
  useEffect(() => {
    if (!isValidGaMeasurementId(measurementId)) return;
    if (enabled) {
      loadGtag(measurementId);
      return;
    }
    window[`ga-disable-${measurementId}`] = true;
    clearGoogleAnalyticsCookies();
  }, [measurementId, enabled]);
  return null;
}
