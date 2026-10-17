/**
 * Hạn nộp hồ sơ (`job-postings.deadline`) tính theo NGÀY giờ Việt Nam: còn nhận hồ sơ hết ngày hạn chót, quá hạn từ 00:00 ngày kế tiếp.
 * Việt Nam không có giờ mùa hè nên UTC+7 cố định; dùng chung cho endpoint nộp hồ sơ, bộ lọc danh sách và nhãn "Hết hạn".
 *
 * Giá trị `deadline` lưu trong DB: ô chọn ngày `dayOnly` của admin (`@payloadcms/ui` `DatePicker`, kiểm ở 3.91.0) luôn ghim giờ về
 * 12:00 UTC của ngày được chọn (`YYYY-MM-DDT12:00:00.000Z` = 19:00 giờ VN cùng ngày). API/seed có thể gửi giờ khác, nên hạn được đọc
 * là ngày theo giờ VN của MỐC THỜI GIAN đó (12:00Z và nửa đêm giờ VN đều ra đúng ngày dự định), không cắt chuỗi UTC.
 */
const VIETNAM_UTC_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Ngày `YYYY-MM-DD` theo giờ Việt Nam của một mốc thời gian. */
function vietnamDate(instant: Date): string {
  return new Date(instant.getTime() + VIETNAM_UTC_OFFSET_MS).toISOString().slice(0, 10);
}

/** Ngày hạn chót `YYYY-MM-DD` (giờ VN) của giá trị `deadline`; chuỗi không phải ngày hợp lệ → `null`. */
export function deadlineDate(deadlineIso: string): string | null {
  const instant = new Date(deadlineIso);
  return Number.isNaN(instant.getTime()) ? null : vietnamDate(instant);
}

/** Đã quá hạn nộp (từ 00:00 ngày kế tiếp giờ VN)? Hạn không đọc được coi là quá hạn: không nhận hồ sơ cho tin hỏng dữ liệu. */
export function isPastDeadline(deadlineIso: string, now: Date): boolean {
  const date = deadlineDate(deadlineIso);
  return date === null || date < vietnamDate(now);
}

/** 00:00 hôm nay giờ VN (mốc UTC): danh sách công khai lấy `deadline >= mốc này`, đúng bằng phủ định của `isPastDeadline`. */
export function startOfVietnamDay(now: Date): Date {
  return new Date(Date.parse(`${vietnamDate(now)}T00:00:00.000Z`) - VIETNAM_UTC_OFFSET_MS);
}

/** Số ngày còn lại tới hạn chót theo lịch VN (0 = hết hạn hôm nay); đã quá hạn hoặc hạn hỏng → `null`. */
export function daysUntilDeadline(deadlineIso: string, now: Date): number | null {
  const date = deadlineDate(deadlineIso);
  if (date === null || date < vietnamDate(now)) return null;
  return Math.round((Date.parse(`${date}T00:00:00.000Z`) - Date.parse(`${vietnamDate(now)}T00:00:00.000Z`)) / DAY_MS);
}

/** Thời điểm hết hạn cho JSON-LD `validThrough`: cuối ngày hạn chót giờ VN, kèm múi giờ (ISO 8601). */
export function validThroughIso(deadlineIso: string): string | null {
  const date = deadlineDate(deadlineIso);
  return date === null ? null : `${date}T23:59:59+07:00`;
}
