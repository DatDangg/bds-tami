import { TIME_ZONE } from "@/lib/format";

const STAMP_FORMAT = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** `yyyyMMddHHmm` theo giờ Việt Nam (không theo múi giờ máy chủ, không UTC): dùng đặt tên file xuất Excel. */
export function exportFileStamp(now: Date): string {
  const parts = Object.fromEntries(STAMP_FORMAT.formatToParts(now).map((part) => [part.type, part.value]));
  return `${parts.year}${parts.month}${parts.day}${parts.hour}${parts.minute}`;
}
