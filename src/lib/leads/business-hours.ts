/**
 * Giờ hành chính (BR-14, SPECIFICATIONS § Quy tắc biên): 08:00–17:30, thứ 2 – thứ 7, giờ Việt Nam; chưa trừ ngày lễ.
 * Việt Nam là UTC+7 quanh năm (không giờ mùa hè) nên quy đổi bằng phép cộng cố định, không phụ thuộc múi giờ của máy chạy.
 */
const VIETNAM_OFFSET_MS = 7 * 60 * 60_000;
const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const WORK_START_MS = 8 * 60 * MINUTE_MS;
const WORK_END_MS = (17 * 60 + 30) * MINUTE_MS;
const SUNDAY = 0;

/** Mốc "giờ VN giả UTC": các getter UTC của Date trả đúng thứ/giờ theo giờ VN. */
const toVietnamClock = (instant: Date): number => instant.getTime() + VIETNAM_OFFSET_MS;

const isWorkingWeekday = (vietnamDayStartMs: number): boolean => new Date(vietnamDayStartMs).getUTCDay() !== SUNDAY;

/** Đang trong giờ làm việc: [08:00, 17:30) giờ VN, thứ 2 – thứ 7. */
export function isBusinessHour(instant: Date): boolean {
  const clock = toVietnamClock(instant);
  const dayStart = Math.floor(clock / DAY_MS) * DAY_MS;
  const offsetInDay = clock - dayStart;
  return isWorkingWeekday(dayStart) && offsetInDay >= WORK_START_MS && offsetInDay < WORK_END_MS;
}

/**
 * Số phút giờ hành chính trôi qua giữa `from` và `to`. Lead tới ngoài giờ thì đếm từ đầu giờ làm kế tiếp (đêm, Chủ nhật không tính).
 * `to <= from` trả 0. Có thể lẻ phút (giây không bị làm tròn).
 */
export function businessMinutesBetween(from: Date, to: Date): number {
  const start = toVietnamClock(from);
  const end = toVietnamClock(to);
  if (end <= start) return 0;
  let workedMs = 0;
  for (let dayStart = Math.floor(start / DAY_MS) * DAY_MS; dayStart < end; dayStart += DAY_MS) {
    if (!isWorkingWeekday(dayStart)) continue;
    const windowStart = Math.max(dayStart + WORK_START_MS, start);
    const windowEnd = Math.min(dayStart + WORK_END_MS, end);
    if (windowEnd > windowStart) workedMs += windowEnd - windowStart;
  }
  return workedMs / MINUTE_MS;
}
