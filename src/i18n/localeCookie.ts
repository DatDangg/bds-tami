import type { Locale } from "./routing";

export const LOCALE_COOKIE = "NEXT_LOCALE";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Giá trị `document.cookie` ghi nhớ lựa chọn ngôn ngữ. Chỉ nút chuyển ngôn ngữ (client) gọi:
 * proxy không tự đặt cookie nên response trang công khai không có Set-Cookie (CDN cache được).
 */
export function buildLocaleCookie(locale: Locale): string {
  return `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
}
