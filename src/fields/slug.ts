import { APIError, type CollectionSlug, type FieldHook, type TextField, type TextFieldSingleValidation } from "payload";

import { defaultLocale } from "../i18n/routing";
import { preserveRequestLocale } from "../lib/payload/preserve-request-locale";
import { appendUniqueSuffix, SLUG_MAX_LENGTH, slugify } from "../lib/slug";

/**
 * Hậu tố `-N` tối đa 3 ký tự số: phần gốc bị cắt còn `SLUG_MAX_LENGTH - 4` ký tự trở lên, nên mọi ứng viên
 * `appendUniqueSuffix` sinh ra đều chứa tiền tố này và nằm trong kết quả tìm kiếm.
 */
const SUFFIX_SEARCH_RESERVE = 4;

export interface SlugFieldOptions {
  /** Trường nguồn để sinh slug khi để trống (cùng locale với slug). */
  sourceField?: string;
}

/**
 * Sinh slug khi trống, chuẩn hoá bản gõ tay, rồi thêm hậu tố nếu trùng trong cùng collection + locale (BR-05).
 * Bản gõ tay cũng qua `slugify` nên không thể chứa ký tự ngoài [a-z0-9-]. Slug đã lưu mà request không gửi lại
 * thì giữ nguyên (không đổi theo tiêu đề), để URL ổn định. Chưa tạo redirect khi đổi slug (task redirects-slug).
 * Kiểm tra trùng gồm cả bản đã xoá mềm: khôi phục không được đẻ ra hai bản cùng URL.
 */
function makeSlugHook(sourceField: string): FieldHook {
  return async ({ value, siblingData, originalDoc, req, collection }) => {
    if (!collection) return value;
    // Với `all`, slug đọc ra là object theo locale nên không so trùng được; ghi nhiều locale một lần không được hỗ trợ.
    if (req.locale === "all") throw new APIError("Slug phải được ghi theo từng ngôn ngữ (locale vi hoặc en), không dùng locale all.", 400);
    const typed = typeof value === "string" ? value.trim() : "";
    // Cập nhật một phần không gửi lại title: lấy title đã lưu của locale này.
    const sourceValue = siblingData[sourceField] ?? originalDoc?.[sourceField];
    const source = typeof sourceValue === "string" ? sourceValue : "";
    const base = slugify(typed || source);
    if (base === "") return null;

    const taken = await preserveRequestLocale(req, () =>
      req.payload.find({
        collection: collection.slug as CollectionSlug,
        where: {
          and: [
            { slug: { like: base.slice(0, SLUG_MAX_LENGTH - SUFFIX_SEARCH_RESERVE) } },
            ...(originalDoc?.id ? [{ id: { not_equals: originalDoc.id } }] : [])],
        },
        locale: req.locale,
        fallbackLocale: false,
        trash: true,
        depth: 0,
        pagination: false,
        // Slug collection là động nên kiểu `select` theo collection không suy ra được.
        select: { slug: true } as never,
        overrideAccess: true,
        req,
      }),
    );
    const takenSlugs = new Set(taken.docs.map((doc) => (doc as { slug?: string | null }).slug ?? ""));
    return appendUniqueSuffix(base, takenSlugs);
  };
}

/** Bản `vi` luôn bắt buộc; bản `en` chỉ bắt buộc khi đã bật `hasEnglish` (ERD §1.1). */
const validateSlug: TextFieldSingleValidation = (value, { req, data }) => {
  if (typeof value === "string" && value !== "") return true;
  const hasEnglish = (data as { hasEnglish?: boolean } | undefined)?.hasEnglish === true;
  const required = req.locale === defaultLocale || hasEnglish;
  return required ? "Slug không được để trống (nhập tiêu đề hoặc nhập slug)." : true;
};

/** Trường `slug` dùng chung cho mọi collection nội dung (ERD §1.1: unique theo cặp `_locale` + `slug`). */
export function slugField({ sourceField = "title" }: SlugFieldOptions = {}): TextField {
  return {
    name: "slug",
    type: "text",
    localized: true,
    unique: true,
    index: true,
    validate: validateSlug,
    hooks: { beforeValidate: [makeSlugHook(sourceField)] },
    admin: { position: "sidebar", description: "Để trống để tự sinh từ tiêu đề. Trùng sẽ tự thêm -2, -3..." },
  };
}
