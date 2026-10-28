/** Hẹn giờ xuất bản Tin tức (FR-ADM-16, BL-091): hàm thuần dùng chung nhãn ở danh sách và ghi chú dưới ô "Ngày xuất bản". */

/** `Date` từ giá trị ngày bất kỳ của form / DB; không đọc được → null. */
function toDate(value: unknown): Date | null {
  if (typeof value !== "string" && typeof value !== "number" && !(value instanceof Date)) return null;
  if (value === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** `dd/MM/yyyy HH:mm` luôn theo giờ Việt Nam (ghép từ parts để thứ tự cố định theo mọi runtime); không đọc được → null. */
export function formatScheduleVn(value: unknown): string | null {
  const date = toDate(value);
  if (date === null) return null;
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`;
}

/** Tin đã xuất bản nhưng `publishedAt` còn ở tương lai: khách chưa thấy (hết giờ sẽ tự hiện). */
export function isScheduledPublish(status: unknown, publishedAt: unknown, now: Date): boolean {
  const date = toDate(publishedAt);
  return status === "published" && date !== null && date.getTime() > now.getTime();
}

/** Nhãn cột "Ngày xuất bản" của danh sách khi đang hẹn giờ; không hẹn giờ → null (nơi gọi hiện ngày như cũ). */
export function scheduledPublishLabel(status: unknown, publishedAt: unknown, now: Date): string | null {
  if (!isScheduledPublish(status, publishedAt, now)) return null;
  const text = formatScheduleVn(publishedAt);
  return text === null ? null : `Đã hẹn giờ · ${text}`;
}

/** Offset múi giờ Việt Nam theo kiểu `Date#getTimezoneOffset()` (phút, dương = sau UTC): GMT+7 → -420. */
export const VIETNAM_TIMEZONE_OFFSET_MINUTES = -420;

export interface ScheduleNoticeInput {
  /** Giá trị đang chọn trong form. */
  value: unknown;
  /** Giá trị đã lưu của `publishedAt` (trước khi sửa). */
  savedPublishedAt: unknown;
  /** `status` đã lưu / đang chọn. */
  savedStatus: unknown;
  status: unknown;
  now: Date;
  /** `new Date(value).getTimezoneOffset()` của máy người dùng TẠI ngày giờ đang chọn (DST có thể khác hôm nay). */
  timezoneOffsetMinutes: number;
}

export interface ScheduleNotice {
  tone: "info" | "warning";
  text: string;
}

/**
 * Các dòng dưới ô "Ngày xuất bản": (1) giờ Việt Nam GMT+7, kèm cảnh báo khi máy không ở GMT+7 (giờ chọn tính theo giờ máy);
 * (2) tin đang hiện trên web mà đổi sang tương lai → sẽ bị ẩn; (3) giá trị tương lai (tin `published`) → sẽ tự hiện lúc đó.
 */
export function buildScheduleNotices(input: ScheduleNoticeInput): ScheduleNotice[] {
  const notices: ScheduleNotice[] = [{ tone: "info", text: "Giờ Việt Nam (GMT+7)." }];
  if (input.timezoneOffsetMinutes !== VIETNAM_TIMEZONE_OFFSET_MINUTES) {
    notices.push({ tone: "warning", text: "Máy của bạn không ở múi giờ GMT+7: ngày giờ chọn ở trên được tính theo giờ máy bạn, có thể lệch so với giờ Việt Nam." });
  }
  const chosen = formatScheduleVn(input.value);
  if (chosen === null || !isScheduledPublish("published", input.value, input.now)) return notices;
  // `publishedAt` đã lưu trống hoặc ≤ now: tin published đang hiện trên web (điều kiện công khai coi trống là hiện).
  const liveNow = input.savedStatus === "published" && input.status === "published" && !isScheduledPublish("published", input.savedPublishedAt, input.now);
  if (liveNow) notices.push({ tone: "warning", text: `Tin đang hiện trên web sẽ bị ẩn tới ${chosen} (giờ Việt Nam).` });
  else if (input.status === "published") notices.push({ tone: "info", text: `Tin sẽ tự hiện trên web lúc ${chosen} (giờ Việt Nam).` });
  else notices.push({ tone: "info", text: `Khi xuất bản, tin sẽ hiện trên web từ ${chosen} (giờ Việt Nam).` });
  return notices;
}
