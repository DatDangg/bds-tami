/** Khoá localStorage lưu hash thông báo khách đã đóng, RIÊNG theo ngôn ngữ: đóng ở `/` không làm `/en` mất thông báo (chữ khác nhau) và ngược lại. */
export const announcementDismissedKey = (locale: string): string => `tami:announcement-dismissed:${locale}`;

/**
 * Hash ngắn (djb2) của nội dung thông báo (chữ + liên kết): đổi chữ hoặc link thì hash đổi → thông báo hiện lại với người đã đóng bản cũ.
 * Thuần, không phụ thuộc môi trường: server (gắn vào HTML cho script chống nháy) và client (so khớp khi đóng) tính ra cùng một giá trị.
 */
export function announcementHash(text: string, href: string | null): string {
  let hash = 5381;
  for (const char of `${text}\n${href ?? ""}`) hash = ((hash << 5) + hash + (char.codePointAt(0) ?? 0)) | 0;
  return (hash >>> 0).toString(36);
}
