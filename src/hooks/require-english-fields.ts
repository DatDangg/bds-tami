import { type CollectionBeforeValidateHook, type CollectionSlug, ValidationError } from "payload";

import { preserveRequestLocale } from "../lib/payload/preserve-request-locale";

/** Giá trị coi là "đã nhập": chuỗi không rỗng, mảng không rỗng, richText Lexical có ít nhất một node. */
export function isFilled(value: unknown): boolean {
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object" && value !== null) {
    const children = (value as { root?: { children?: unknown } }).root?.children;
    return Array.isArray(children) ? children.length > 0 : true;
  }
  return false;
}

type Doc = Record<string, unknown>;

/** Các trường bắt buộc còn thiếu trong bản `en`. Dùng chung với job dịch để quyết định có bật `hasEnglish` hay không, không phải thử rồi bắt lỗi. */
export const missingEnglishFields = (requiredFields: readonly string[], english: Doc): string[] => requiredFields.filter((field) => !isFilled(english[field]));

/** Bản `en` đã lưu của bản ghi (kể cả bản đã xoá mềm). */
async function readStoredEnglish(
  { req, collection }: Parameters<CollectionBeforeValidateHook>[0],
  id: string | number,
): Promise<Doc> {
  const stored = await preserveRequestLocale(req, () =>
    req.payload.findByID({
      collection: collection.slug as CollectionSlug,
      id,
      locale: "en",
      fallbackLocale: false,
      trash: true,
      depth: 0,
      overrideAccess: true,
      req,
    }),
  );
  return stored as unknown as Doc;
}

/**
 * Bản `en` hiện hành: phần đang ghi (nếu request ghi locale `en`, hoặc `all` thì lấy nhánh `en`) đè lên bản
 * `en` đã lưu. Request ghi locale `vi` không động tới `en`, nên chỉ cần bản đã lưu.
 */
async function resolveEnglishDoc(args: Parameters<CollectionBeforeValidateHook>[0]): Promise<Doc> {
  const { data, originalDoc, req } = args;
  const locale = req.locale;
  if (locale === "en") return { ...originalDoc, ...data };

  const stored: Doc = originalDoc?.id ? await readStoredEnglish(args, originalDoc.id) : {};
  if (locale !== "all") return stored;

  const incoming: Doc = {};
  for (const [key, value] of Object.entries(data ?? {})) {
    if (typeof value === "object" && value !== null && "en" in value) incoming[key] = (value as { en: unknown }).en;
  }
  return { ...stored, ...incoming };
}

/**
 * Chặn `hasEnglish = true` khi thiếu trường EN bắt buộc (ERD §1.1, BR-07). Chỉ kiểm khi vừa bật, hoặc khi đang
 * sửa bản `en` của bài đã bật: sửa bản `vi` không ảnh hưởng điều kiện của `en`. `hasEnglish` chỉ đọc với mọi
 * người ở Must nên giá trị `true` chỉ tới từ code hệ thống (task dịch, `overrideAccess`).
 */
export function requireEnglishFields(requiredFields: readonly string[]): CollectionBeforeValidateHook {
  return async (args) => {
    const { data, originalDoc, req, collection } = args;
    const enabled = data?.hasEnglish ?? originalDoc?.hasEnglish;
    if (enabled !== true) return data;
    const newlyEnabled = originalDoc?.hasEnglish !== true;
    if (!newlyEnabled && req.locale !== "en") return data;

    const english = await resolveEnglishDoc(args);
    const missing = missingEnglishFields(requiredFields, english);
    if (missing.length > 0) {
      throw new ValidationError({
        collection: collection.slug,
        errors: missing.map((path) => ({ path, message: "Cần nhập bản tiếng Anh trước khi bật hasEnglish." })),
      });
    }
    return data;
  };
}
