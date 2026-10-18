export const TRANSLATE_CONTENT_SLUG = "translate-content";

/** Gộp các lần lưu liên tiếp của cùng một bản ghi: job chạy sau lần lưu CUỐI ~1 phút (ARCHITECTURE §5.4). */
export const TRANSLATION_DEBOUNCE_MS = 60_000;

/** Input job: chỉ định danh bản ghi (không có nội dung, không PII): nội dung luôn đọc lại từ DB lúc chạy. */
export interface TranslateContentInput {
  kind: "collection" | "global";
  slug: string;
  /** Có với `kind = collection`. */
  docId?: string | null;
  /** "Dịch lại bằng AI" (API_SPEC §5): dịch mọi trường, kể cả bản `manual`, rồi đặt lại `enSource = ai`. */
  force?: boolean | null;
}
