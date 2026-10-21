import { startOfVietnamDay, vietnamDate } from "../careers/deadline";

/** Độ dài Mô tả ngắn nên có để hiện đẹp ở thẻ và kết quả Google (nhắc nhẹ, không chặn lưu). */
export const SUMMARY_RECOMMENDED_MIN = 150;
export const SUMMARY_RECOMMENDED_MAX = 200;

export interface SummaryLengthHint {
  text: string;
  /** Ngoài khoảng nên có → component tô màu nhắc nhẹ. */
  outOfRange: boolean;
}

/** `123 ký tự · nên 150–200`; ngoài khoảng thêm "hơi ngắn"/"hơi dài". Giá trị không phải chuỗi tính là rỗng. */
export function describeSummaryLength(value: unknown): SummaryLengthHint {
  const length = typeof value === "string" ? value.length : 0;
  const base = `${length} ký tự · nên ${SUMMARY_RECOMMENDED_MIN}–${SUMMARY_RECOMMENDED_MAX}`;
  if (length === 0) return { text: base, outOfRange: false };
  if (length < SUMMARY_RECOMMENDED_MIN) return { text: `${base} (hơi ngắn)`, outOfRange: true };
  if (length > SUMMARY_RECOMMENDED_MAX) return { text: `${base} (hơi dài)`, outOfRange: true };
  return { text: base, outOfRange: false };
}

/**
 * Giá trị nút "Hôm nay" cho ô ngày `dayOnly`: ngày hiện tại theo giờ Việt Nam, ghim 12:00 UTC giống ô chọn ngày của admin
 * (xem `lib/careers/deadline.ts`) để lịch hiện đúng ngày ở mọi múi giờ trình duyệt.
 */
export function todayDateFieldValue(now: Date): string {
  return `${vietnamDate(startOfVietnamDay(now))}T12:00:00.000Z`;
}
