import type { ClickType } from "./click-types";

/** Giữ lượt bấm thô 90 ngày (ERD §7); sau đó chỉ còn số liệu đã gộp. */
export const CLICK_RETENTION_DAYS = 90;

/**
 * Giá trị `refCollection`/`refId` của dòng thống kê khi lượt bấm không gắn bản ghi nào.
 * Dùng chuỗi rỗng thay cho NULL vì Postgres coi mọi NULL là khác nhau trong unique index: với NULL,
 * hai dòng `(ngày, loại, NULL, NULL)` cùng tồn tại được và dashboard đếm đôi.
 */
export const NO_REF = "";

const VIETNAM_UTC_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * "Ngày" của thống kê tính theo giờ Việt Nam (UTC+7, không có giờ mùa hè), lưu bằng 00:00 UTC của ngày đó.
 * Vd lượt bấm 23:30 UTC ngày 15 (06:30 ngày 16 ở VN) thuộc ngày 16.
 */
export function clickStatsDay(clickedAt: Date): Date {
  return new Date(Math.floor((clickedAt.getTime() + VIETNAM_UTC_OFFSET_MS) / DAY_MS) * DAY_MS);
}

/** Lượt bấm có `createdAt` trước mốc này (và đã gộp) thì bị xoá. */
export function clickRetentionCutoff(now: Date): Date {
  return new Date(now.getTime() - CLICK_RETENTION_DAYS * DAY_MS);
}

export interface ClickEventRow {
  type: ClickType;
  refCollection?: string | null;
  refId?: string | null;
  createdAt: string | Date;
}

export interface DailyClickBucket {
  date: Date;
  type: ClickType;
  refCollection: string;
  refId: string;
  count: number;
}

/** Gộp lượt bấm thô thành các dòng `(ngày, loại, refCollection, refId) -> số lượt`. Thứ tự dòng theo lần xuất hiện đầu. */
export function bucketClickEvents(events: readonly ClickEventRow[]): DailyClickBucket[] {
  const buckets = new Map<string, DailyClickBucket>();
  for (const event of events) {
    const date = clickStatsDay(new Date(event.createdAt));
    const refCollection = event.refCollection ?? NO_REF;
    const refId = event.refId ?? NO_REF;
    const key = JSON.stringify([date.getTime(), event.type, refCollection, refId]);
    const existing = buckets.get(key);
    if (existing) existing.count += 1;
    else buckets.set(key, { date, type: event.type, refCollection, refId, count: 1 });
  }
  return [...buckets.values()];
}
