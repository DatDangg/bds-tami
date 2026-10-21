import type { Where } from "payload";

import { ADMIN_COLLECTION_LABELS, ADMIN_GLOBAL_LABELS } from "../admin/collection-labels";
import { TRANSLATION_ERROR_MESSAGES, type TranslationErrorCode } from "./errors";

/** Bộ lọc trạng thái dịch trên danh sách nội dung (FR-ADM-18): mỗi mục là một điều kiện trên trường có sẵn của nhóm `translation`, không cần cột mới. */
export const TRANSLATION_FILTERS = {
  none: { label: "Chưa dịch", condition: { "translation.status": { equals: "none" } } },
  ai: { label: "Dịch tự động (AI)", condition: { "translation.enSource": { equals: "ai" } } },
  manual: { label: "Sửa tay", condition: { "translation.enSource": { equals: "manual" } } },
  failed: { label: "Dịch lỗi", condition: { "translation.status": { equals: "failed" } } },
  viChanged: { label: "Bản tiếng Việt đã sửa sau khi sửa tay bản tiếng Anh", condition: { "translation.viChangedAfterManual": { equals: true } } },
} as const satisfies Record<string, { label: string; condition: Where }>;

export type TranslationFilterKey = keyof typeof TRANSLATION_FILTERS;
export const TRANSLATION_FILTER_KEYS = Object.keys(TRANSLATION_FILTERS) as TranslationFilterKey[];

/** Điều kiện lá trên trường `translation.*` (cụm lồng `and`/`or` không bị coi là điều kiện dịch). */
const isTranslationCondition = (entry: Where): boolean => {
  const keys = Object.keys(entry);
  return keys.length > 0 && keys.every((key) => key.startsWith("translation."));
};

function onlyArrayKey(where: Where, name: "and" | "or"): Where[] | undefined {
  const clauses = (where as Record<string, unknown>)[name];
  return Array.isArray(clauses) && Object.keys(where).length === 1 ? (clauses as Where[]) : undefined;
}

/** Điều kiện AND của một nhánh: `{ and: [...] }` → các phần tử, còn lại → chính nó. */
const andEntries = (branch: Where): Where[] => onlyArrayKey(branch, "and") ?? [branch];

/**
 * Chuẩn hoá `where` thành các nhánh OR, mỗi nhánh là danh sách điều kiện AND.
 * WhereBuilder của Payload ghi `{ or: [{ and: [...] }, ...] }`; dạng `{ and }` / phẳng là 1 nhánh.
 */
export function toBranches(where: Where | undefined): Where[][] {
  if (!where || Object.keys(where).length === 0) return [];
  const orBranches = onlyArrayKey(where, "or");
  return orBranches ? orBranches.map(andEntries) : [andEntries(where)];
}

const isOrForm = (where: Where | undefined): boolean => !!where && onlyArrayKey(where, "or") !== undefined;

/** Dựng lại `where` từ các nhánh AND: đầu vào dạng `or` → `{ or: [{ and }] }` (WhereBuilder đọc lại được); các dạng khác → `{ and }` (nhánh đầu). */
export function rebuildWhere(original: Where | undefined, branches: Where[][]): Where {
  return isOrForm(original) ? { or: branches.map((and) => ({ and })) } : { and: branches[0] ?? [] };
}

/** Bộ lọc đang áp (mọi nhánh đều chứa đúng điều kiện của một mục), `""` khi không có. */
export function currentTranslationFilter(where: Where | undefined): TranslationFilterKey | "" {
  const branches = toBranches(where).map((entries) => entries.map((entry) => JSON.stringify(entry)));
  if (branches.length === 0) return "";
  return TRANSLATION_FILTER_KEYS.find((key) => branches.every((present) => present.includes(JSON.stringify(TRANSLATION_FILTERS[key].condition)))) ?? "";
}

/**
 * `where` mới: trong từng nhánh giữ nguyên các điều kiện khác, thay điều kiện dịch cũ bằng điều kiện của `key` (hoặc bỏ nếu rỗng).
 * Đầu vào dạng `or` → đầu ra `{ or: [{ and }] }` (WhereBuilder đọc lại được); các dạng khác → `{ and }`.
 */
export function withTranslationFilter(where: Where | undefined, key: TranslationFilterKey | ""): Where {
  const branches = toBranches(where);
  const rebuilt = (branches.length ? branches : [[]]).map((entries) => {
    const others = entries.filter((entry) => !isTranslationCondition(entry));
    return key ? [...others, TRANSLATION_FILTERS[key].condition] : others;
  });
  return rebuildWhere(where, rebuilt);
}

/** Collection CÓ bản dịch (banner dịch lỗi truy vấn theo tập khoá này — không thêm collection không có nhóm `translation`). Chuỗi lấy từ nguồn nhãn admin chung. */
const TRANSLATED_COLLECTIONS = ["projects", "rentals", "property-posts", "news", "services", "job-postings", "pages", "categories", "developers"] as const;

export const COLLECTION_LABELS: Record<string, string> = Object.fromEntries(
  TRANSLATED_COLLECTIONS.map((slug) => [slug, ADMIN_COLLECTION_LABELS[slug].plural]),
);

export const GLOBAL_LABELS: Record<string, string> = { ...ADMIN_GLOBAL_LABELS };

/** Sale chỉ được dịch lại bài của mình, và không với `services`/`pages`/globals (chỉ admin sửa): khớp quyền của endpoint, dùng để ẩn nút (endpoint vẫn kiểm lại). */
export function canRetranslate(user: { id?: string | number; role?: string } | null | undefined, slug: string | undefined, authorId: unknown): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.role !== "sale" || !slug || slug === "services" || slug === "pages") return false;
  return authorId !== undefined && authorId !== null && String(authorId) === String(user.id);
}

/** Thông báo cho người dùng theo mã lỗi của `POST /api/admin/translations/:collection/:id`. */
export function retranslateMessage(status: number, retryAfter: string | null): string {
  if (status === 202) return "Đã gửi yêu cầu dịch lại. Bản tiếng Anh sẽ được cập nhật sau ít phút.";
  if (status === 429) {
    const minutes = Math.max(1, Math.ceil(Number(retryAfter) / 60) || 1);
    return `Bạn đã yêu cầu dịch lại quá nhiều lần (tối đa 30 lần mỗi giờ). Thử lại sau khoảng ${minutes} phút.`;
  }
  if (status === 409) return "Dịch tự động đang tắt (Cấu hình chung hoặc hạn mức dịch tháng bằng 0). Bật lại rồi thử lại.";
  if (status === 503) return "Dịch tự động chưa được cấu hình hoặc hệ thống đang tạm thời lỗi. Thử lại sau.";
  if (status === 401 || status === 403 || status === 404) return "Bạn không có quyền dịch lại nội dung này.";
  return "Không thể dịch lại lúc này. Thử lại sau.";
}

export interface TranslationSummaryInput {
  status?: unknown;
  enSource?: unknown;
  translatedAt?: unknown;
  viChangedAfterManual?: unknown;
  lastError?: unknown;
}

/** `lastError` lưu mã lỗi (xem errors.ts): đổi sang câu tiếng Việt có sẵn; mã lạ → câu chung, không hiện mã thô. */
const GENERIC_ERROR_MESSAGE = "không dịch được, thử dịch lại sau";
function describeTranslationError(code: string): string {
  if (code === "") return "";
  return Object.prototype.hasOwnProperty.call(TRANSLATION_ERROR_MESSAGES, code) ? TRANSLATION_ERROR_MESSAGES[code as TranslationErrorCode] : GENERIC_ERROR_MESSAGE;
}

/** `dd/MM/yyyy HH:mm` theo giờ Việt Nam; giá trị không hợp lệ → `null`. */
function formatVietnamDateTime(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`;
}

/**
 * Một dòng tóm tắt trạng thái bản tiếng Anh cho form (BL-042) thay cho 7 trường hệ thống đã ẩn.
 * `warning` có khi bản tiếng Việt đã sửa sau khi người dùng sửa tay bản tiếng Anh.
 */
export function translationSummary(input: TranslationSummaryInput): { text: string; warning: string | null } {
  const warning = input.viChangedAfterManual === true ? "Bản tiếng Việt đã sửa sau khi bạn sửa tay bản tiếng Anh, nên kiểm tra lại bản tiếng Anh." : null;
  const lastError = typeof input.lastError === "string" ? input.lastError.trim() : "";
  const shortError = describeTranslationError(lastError);
  let state: string;
  if (input.status === "failed") state = shortError ? `dịch lỗi — ${shortError}` : "dịch lỗi";
  else if (input.status === "queued") state = "đang chờ dịch";
  else if (input.status === "pending_review") state = "chờ duyệt";
  else if (input.enSource === "manual") state = "đã sửa tay";
  else if (input.status === "done") {
    const at = formatVietnamDateTime(input.translatedAt);
    state = at ? `đã dịch tự động lúc ${at}` : "đã dịch tự động";
  } else state = "chưa dịch";
  return { text: `Bản tiếng Anh: ${state}`, warning };
}
