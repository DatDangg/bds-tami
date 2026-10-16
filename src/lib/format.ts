import type { Locale } from "@/i18n/routing";

const TIME_ZONE = "Asia/Ho_Chi_Minh";
// Mã vùng cố định để kết quả giống nhau giữa Node/trình duyệt, không phụ thuộc locale máy.
const INTL_TAG: Record<Locale, string> = { vi: "vi-VN", en: "en-US" };

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(INTL_TAG[locale], { maximumFractionDigits: 2 }).format(value);
}

/** Tiền luôn là VNĐ: `5.500.000 ₫` (vi) · `5,500,000 VND` (en). */
export function formatVnd(amount: number, locale: Locale): string {
  const digits = new Intl.NumberFormat(INTL_TAG[locale], { maximumFractionDigits: 0 }).format(amount);
  return locale === "vi" ? `${digits} ₫` : `${digits} VND`;
}

export function formatArea(squareMeters: number, locale: Locale): string {
  return `${formatNumber(squareMeters, locale)} m²`;
}

/** Ngày theo locale, luôn tính theo múi giờ Việt Nam (không theo múi giờ máy chủ/trình duyệt). */
export function formatDate(
  value: Date | string | number,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" },
): string {
  return new Intl.DateTimeFormat(INTL_TAG[locale], { ...options, timeZone: TIME_ZONE }).format(new Date(value));
}
