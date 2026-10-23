import type { Where } from "payload";

import { createHash } from "node:crypto";

import { hasSourceRecord, type LeadSource, type LeadStatus } from "./lead-values";

/** BR-15: cùng SĐT + cùng nội dung nguồn trong 7 ngày thì gộp, tính từ lúc lead cũ được tạo. */
export const DEDUPE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/** Lead đã chốt/không thành/spam là vụ việc đã đóng: khách gửi lại thì là lead mới. */
export const DEDUPE_CLOSED_STATUSES: readonly LeadStatus[] = ["won", "lost", "spam"];

/** Trường quan hệ của `leads` trỏ tới bản ghi nguồn; `contact` / `popup` không có bản ghi nguồn. */
export const SOURCE_REF_FIELD = { rental: "rental", property_post: "propertyPost", project: "project" } as const;

export interface DedupeKey {
  phoneNormalized: string;
  source: LeadSource;
  /** Id bản ghi nguồn; `null` khi `source` là `contact` / `popup`. */
  sourceId: string | null;
}

export function dedupeCutoff(now: Date): Date {
  return new Date(now.getTime() - DEDUPE_WINDOW_MS);
}

/** Điều kiện tìm lead trùng; `leads` mặc định đã loại bản trong thùng rác, lead ẩn danh mang `phoneNormalized` thay thế nên không khớp. */
export function duplicateLeadWhere(key: DedupeKey, now: Date): Where {
  const conditions: Where[] = [
    { phoneNormalized: { equals: key.phoneNormalized } },
    { source: { equals: key.source } },
    { status: { not_in: [...DEDUPE_CLOSED_STATUSES] } },
    { createdAt: { greater_than_equal: dedupeCutoff(now).toISOString() } },
  ];
  if (hasSourceRecord(key.source) && key.sourceId) {
    conditions.push({ [SOURCE_REF_FIELD[key.source]]: { equals: key.sourceId } });
  }
  return { and: conditions };
}

/**
 * Khoá advisory 64-bit của một lần gửi: hai request cùng SĐT + nguồn + bản ghi đồng thời phải xếp hàng, nếu không cả hai cùng
 * thấy "chưa có lead" và tạo hai lead. Băm để khoá không chứa SĐT; trả chuỗi số vì được nối vào câu `pg_advisory_xact_lock`.
 */
export function dedupeLockKey(key: DedupeKey): string {
  const digest = createHash("sha256").update(`lead|${key.phoneNormalized}|${key.source}|${key.sourceId ?? ""}`).digest();
  return digest.readBigInt64BE(0).toString();
}
