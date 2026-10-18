import { TranslationError } from "./errors";

/**
 * Chỉ nội dung CÔNG KHAI được gửi sang Claude API (ARCHITECTURE §7). Mọi thứ khác (leads, lead-activities,
 * job-applications, staff, private-files, audit-logs, click-*, translation-usage...) bị chặn ở đây TRƯỚC khi
 * tạo client/gọi SDK. Danh sách cho phép (không phải danh sách chặn): collection mới mặc định bị từ chối.
 */
export const TRANSLATABLE_COLLECTIONS = [
  "projects",
  "rentals",
  "property-posts",
  "news",
  "services",
  "job-postings",
  "pages",
  "categories",
  "developers",
] as const;

/** `media` chỉ cho dịch đúng trường `alt` (tên tệp, URL, dữ liệu upload không đi ra ngoài). */
export const TRANSLATABLE_MEDIA_FIELDS = ["alt"] as const;

/** Globals công khai (trang chủ, header, footer, cấu hình chung). Trường nội bộ (`notificationEmails`, `translationGlossary`...) không nằm trong nội dung gửi đi, do bên gọi chọn trường. */
export const TRANSLATABLE_GLOBALS = ["site-settings", "homepage", "header", "footer"] as const;

export type TranslationTarget =
  | { kind: "collection"; slug: string }
  | { kind: "media"; field: string }
  | { kind: "global"; slug: string };

const isOneOf = (list: readonly string[], value: string) => list.includes(value);

/** Throw `not_allowed` nếu đích không nằm trong danh sách; gọi đầu tiên trong `translate`, trước mọi việc khác. */
export function assertTranslatable(target: TranslationTarget): void {
  const allowed =
    target.kind === "collection"
      ? isOneOf(TRANSLATABLE_COLLECTIONS, target.slug)
      : target.kind === "global"
        ? isOneOf(TRANSLATABLE_GLOBALS, target.slug)
        : isOneOf(TRANSLATABLE_MEDIA_FIELDS, target.field);
  if (!allowed) throw new TranslationError("not_allowed");
}
