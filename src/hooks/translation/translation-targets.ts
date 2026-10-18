import type { Field, Payload } from "payload";

import { PUBLIC_STATUSES } from "../../access/publishedOnly";
import { TRANSLATABLE_COLLECTIONS, TRANSLATABLE_GLOBALS } from "../../lib/translation/allowlist";
import { collectLeaves, type TranslatableSlug } from "../../lib/translation/leaves";

/**
 * Cờ trong `context` của Local API: lần ghi do job dịch tạo ra. Hook đã gắn trên collection/global (enqueue, nhận diện sửa tay EN) bỏ qua khi có
 * cờ này, nên việc job ghi bản `en` không xếp job dịch mới (không vòng lặp) và không bị coi là người sửa tay.
 */
export const TRANSLATION_JOB_CONTEXT_KEY = "translationJob";

export type TranslationTargetRef = { kind: "collection"; slug: string } | { kind: "global"; slug: string };

export function isTranslatableCollection(slug: string): boolean {
  return (TRANSLATABLE_COLLECTIONS as readonly string[]).includes(slug);
}

export function isTranslatableGlobal(slug: string): boolean {
  return (TRANSLATABLE_GLOBALS as readonly string[]).includes(slug);
}

/**
 * Bản vi "đã xuất bản" (khách thấy được) mới được dịch: không dịch nháp/ẩn/đã xoá mềm. Global luôn công khai. Collection không có trường `status`
 * (danh mục nền `categories`, `developers`: chỉ là danh mục tra cứu, luôn công khai) coi là đã xuất bản khi chưa xoá mềm.
 */
export function isPublishedForTranslation(target: TranslationTargetRef, doc: { status?: unknown; deletedAt?: unknown } | null | undefined): boolean {
  if (target.kind === "global") return true;
  if (!doc || doc.deletedAt) return false;
  if (doc.status === undefined) return true;
  const statuses: readonly string[] = target.slug === "rentals" ? PUBLIC_STATUSES.rentals : PUBLIC_STATUSES.default;
  return statuses.includes(String(doc.status));
}

/** Cấu hình field đã sanitize của collection/global (dùng để duyệt cấu trúc, không dùng để đọc giá trị). */
export function fieldsOfTarget(payload: Payload, target: TranslationTargetRef): Field[] {
  const config = target.kind === "collection" ? payload.collections[target.slug as keyof typeof payload.collections]?.config : payload.globals.config.find((global) => global.slug === target.slug);
  return (config?.fields ?? []) as Field[];
}

export function leavesOfDoc(payload: Payload, target: TranslationTargetRef, doc: Record<string, unknown> | null | undefined) {
  return collectLeaves(target.slug as TranslatableSlug, fieldsOfTarget(payload, target), doc);
}
