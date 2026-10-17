import { APIError, type CollectionSlug, type FieldHook, type SanitizedCollectionConfig, type TextField, type TextFieldSingleValidation } from "payload";

import { defaultLocale } from "../i18n/routing";
import { preserveRequestLocale } from "../lib/payload/preserve-request-locale";
import { appendUniqueSuffix, slugify, suffixedSlug } from "../lib/slug";

/** Số ứng viên `base`, `base-2`... kiểm trong một truy vấn; thường một lượt là đủ. */
const CANDIDATE_BATCH_SIZE = 20;

export interface SlugFieldOptions {
  /** Trường nguồn để sinh slug khi để trống (cùng locale với slug). */
  sourceField?: string;
  /**
   * Trường phân nhóm (vd `scope` của `categories`): slug chỉ phải duy nhất TRONG cùng giá trị trường này, nên
   * kiểm trùng lọc theo nó và `slug` không còn `unique` toàn collection (ràng buộc DB do `scopeSlugField` giữ).
   */
  scopeField?: string;
}

/** Ứng viên thứ `n` của `base`: n = 1 là chính `base`, từ 2 là `base-n`. */
function candidateAt(base: string, n: number): string {
  return n === 1 ? base : suffixedSlug(base, n);
}

/**
 * Tìm slug nhỏ nhất còn trống. Mỗi lượt chỉ hỏi DB đúng `CANDIDATE_BATCH_SIZE` ứng viên bằng `in` (so sánh bằng,
 * dùng được index), không quét theo tiền tố/`ILIKE %x%`. `appendUniqueSuffix` trả số nhỏ nhất không nằm trong tập
 * đã biết; nếu số đó thuộc lượt vừa hỏi thì mọi ứng viên nhỏ hơn đã được kiểm (đều bị chiếm), còn không thì hỏi lượt kế.
 */
async function findFreeSlug(base: string, findTaken: (candidates: string[]) => Promise<string[]>): Promise<string> {
  const taken = new Set<string>();
  for (let from = 1; ; from += CANDIDATE_BATCH_SIZE) {
    const candidates = Array.from({ length: CANDIDATE_BATCH_SIZE }, (_, offset) => candidateAt(base, from + offset));
    for (const slug of await findTaken(candidates)) taken.add(slug);
    const free = appendUniqueSuffix(base, taken);
    if (candidates.includes(free)) return free;
  }
}

/** `scope` thuộc danh sách chọn của trường nhóm (trường không phải `select` thì không giới hạn). */
function isAllowedScope(collection: SanitizedCollectionConfig, scopeField: string, scope: unknown): boolean {
  const field = collection.flattenedFields.find((candidate) => candidate.name === scopeField);
  if (!field || field.type !== "select") return true;
  return field.options.some((option) => (typeof option === "string" ? option : option.value) === scope);
}

/**
 * Sinh slug khi trống, chuẩn hoá bản gõ tay, rồi thêm hậu tố nếu trùng trong cùng collection + locale (BR-05).
 * Bản gõ tay cũng qua `slugify` nên không thể chứa ký tự ngoài [a-z0-9-]. Slug đã lưu mà request không gửi lại
 * thì giữ nguyên (không đổi theo tiêu đề), để URL ổn định. Chưa tạo redirect khi đổi slug (task redirects-slug).
 * Kiểm tra trùng gồm cả bản đã xoá mềm: khôi phục không được đẻ ra hai bản cùng URL.
 */
function makeSlugHook(sourceField: string, scopeField: string | undefined): FieldHook {
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

    // Thiếu giá trị nhóm thì để bước validate của chính trường nhóm báo lỗi; chưa so trùng được.
    const scope = scopeField ? (siblingData[scopeField] ?? originalDoc?.[scopeField]) : undefined;
    if (scopeField && scope == null) return base;
    // Giá trị ngoài danh sách chọn: không đưa vào truy vấn (cột enum Postgres sẽ ném 500), để validate của chính
    // trường nhóm trả 400.
    if (scopeField && !isAllowedScope(collection, scopeField, scope)) return base;

    const findTaken = async (candidates: string[]) => {
      const result = await preserveRequestLocale(req, () =>
        req.payload.find({
          collection: collection.slug as CollectionSlug,
          where: {
            and: [
              { slug: { in: candidates } },
              ...(scopeField ? [{ [scopeField]: { equals: scope } }] : []),
              ...(originalDoc?.id ? [{ id: { not_equals: originalDoc.id } }] : []),
            ],
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
      return result.docs.map((doc) => (doc as { slug?: string | null }).slug ?? "");
    };
    return findFreeSlug(base, findTaken);
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
export function slugField({ sourceField = "title", scopeField }: SlugFieldOptions = {}): TextField {
  return {
    name: "slug",
    type: "text",
    localized: true,
    unique: !scopeField,
    index: true,
    validate: validateSlug,
    hooks: { beforeValidate: [makeSlugHook(sourceField, scopeField)] },
    admin: { position: "sidebar", description: "Để trống để tự sinh từ tiêu đề. Trùng sẽ tự thêm -2, -3..." },
  };
}
