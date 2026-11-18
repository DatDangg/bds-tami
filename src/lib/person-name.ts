import { z } from "zod";

/**
 * Luật họ tên dùng chung cho client (LeadForm, ApplyForm) và server (leadInputSchema, jobApplicationFieldsSchema) — BL-123.
 * Không import gì server-only để bundle client dùng được.
 *
 * Cho phép: chữ cái mọi ngôn ngữ (+ dấu kết hợp để tiếng Việt dạng NFD vẫn qua), khoảng trắng, `'`, `’` (U+2019, bàn phím iOS tự đổi `'` thành `’`), `-`, `.`.
 * Cấm chữ số và mọi ký tự khác; cần ít nhất 2 chữ cái (không đếm dấu câu).
 */
const ALLOWED_CHARACTERS = /^[\p{L}\p{M} '’.-]+$/u;
const LETTER = /\p{L}/gu;
const MIN_LETTERS = 2;

export const PERSON_NAME_RULE_MESSAGE = {
  vi: "Họ tên chỉ gồm chữ cái, khoảng trắng và các dấu ' - . (ít nhất 2 chữ cái).",
  en: "Name may contain only letters, spaces and ' - . (at least 2 letters).",
} as const;

/** `trim` + gộp mọi chuỗi khoảng trắng liên tiếp thành 1 dấu cách. */
export function normalizePersonName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export function isValidPersonName(raw: string): boolean {
  const name = normalizePersonName(raw);
  return ALLOWED_CHARACTERS.test(name) && (name.match(LETTER)?.length ?? 0) >= MIN_LETTERS;
}

/** Schema zod: output là bản đã chuẩn hoá; `max` tính trên bản đã chuẩn hoá. */
export const personNameSchema = (max: number) =>
  z
    .string()
    .transform(normalizePersonName)
    .pipe(z.string().min(MIN_LETTERS).max(max).refine(isValidPersonName));
