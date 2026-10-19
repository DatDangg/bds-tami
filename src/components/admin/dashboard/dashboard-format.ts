const TIME_ZONE = "Asia/Ho_Chi_Minh";
const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

function hourInVietnam(now: Date): number {
  const hour = new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: TIME_ZONE }).format(now);
  return Number(hour);
}

/** "Chào buổi sáng/chiều/tối" theo giờ Asia/Ho_Chi_Minh (5h–12h sáng, 12h–18h chiều, còn lại tối kể cả khuya). */
export function greetingFor(now: Date): string {
  const hour = hourInVietnam(now);
  if (hour >= 5 && hour < 12) return "Chào buổi sáng";
  if (hour >= 12 && hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

/** "Thứ Hai, 19/10/2026" theo múi giờ Việt Nam. */
export function formatToday(now: Date): string {
  const parts = new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric", timeZone: TIME_ZONE }).formatToParts(now);
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("weekday")}, ${pick("day")}/${pick("month")}/${pick("year")}`;
}

/** "8 phút trước", "hôm qua"… (quá 30 ngày thì in ngày). Giá trị không hợp lệ -> chuỗi rỗng. */
export function relativeTimeVi(value: string | Date | null | undefined, now: Date): string {
  if (!value) return "";
  const time = new Date(value);
  if (Number.isNaN(time.getTime())) return "";
  const elapsed = now.getTime() - time.getTime();
  if (elapsed < MINUTE_MS) return "vừa xong";
  if (elapsed < HOUR_MS) return `${Math.floor(elapsed / MINUTE_MS)} phút trước`;
  if (elapsed < DAY_MS) return `${Math.floor(elapsed / HOUR_MS)} giờ trước`;
  if (elapsed < 2 * DAY_MS) return "hôm qua";
  if (elapsed < 30 * DAY_MS) return `${Math.floor(elapsed / DAY_MS)} ngày trước`;
  return new Intl.DateTimeFormat("vi-VN", { timeZone: TIME_ZONE }).format(time);
}
