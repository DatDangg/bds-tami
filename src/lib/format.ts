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

/**
 * Tiền VNĐ rút gọn cho thẻ danh sách: `3,5 tỷ` · `450 triệu` (vi) · `3.5 billion VND` · `450 million VND` (en). Dưới 1 triệu
 * hiện số đầy đủ như `formatVnd` (không rút gọn thành "nghìn" vì giá bất động sản không dùng cỡ đó).
 */
export function formatVndCompact(amount: number, locale: Locale): string {
  const units =
    locale === "vi"
      ? ([[1_000_000_000, " tỷ"], [1_000_000, " triệu"]] as const)
      : ([[1_000_000_000, " billion VND"], [1_000_000, " million VND"]] as const);
  const unit = units.find(([size]) => amount >= size);
  return unit ? `${formatNumber(amount / unit[0], locale)}${unit[1]}` : formatVnd(amount, locale);
}
