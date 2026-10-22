import { isDeepStrictEqual } from "node:util";

const TIME_ZONE = "Asia/Ho_Chi_Minh";

/**
 * Trường hệ thống không mang ý nghĩa với người dùng nên KHÔNG tính vào "số trường đã đổi" ở màn Lịch sử chỉnh sửa.
 * Phải khớp danh sách ẩn trong `styles/_version-history.scss` (màn so sánh ẩn bằng CSS): `translation` là trạng thái dịch kỹ thuật
 * (băm nguồn, trạng thái job), `searchReindexPending` là cờ job nền, còn lại là mốc thời gian tự sinh.
 */
export const VERSION_HIDDEN_FIELDS: ReadonlySet<string> = new Set(["id", "createdAt", "updatedAt", "deletedAt", "translation", "searchReindexPending", "_status"]);

/** Bỏ khoá null/undefined và đối tượng rỗng ở mọi cấp: bản chụp `{ vi }` và `{ vi, en: null }` là cùng một nội dung (EN chưa có), không tính là thay đổi. */
function dropEmpty(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(dropEmpty);
  if (value === null || typeof value !== "object") return value;
  const kept = Object.entries(value).flatMap(([key, child]) => {
    const cleaned = dropEmpty(child);
    const isEmpty = cleaned === null || cleaned === undefined || (typeof cleaned === "object" && !Array.isArray(cleaned) && Object.keys(cleaned).length === 0);
    return isEmpty ? [] : [[key, cleaned] as const];
  });
  return kept.length === 0 ? null : Object.fromEntries(kept);
}

/**
 * Số trường (cấp ngoài cùng của tài liệu) khác nhau giữa 2 bản chụp. Nhóm/danh sách/nội dung soạn thảo tính là 1 trường dù đổi bên trong
 * bao nhiêu chỗ. Dữ liệu lấy với `locale: "all"` nên trường localized là `{ vi, en }` và đổi riêng EN cũng được đếm — đủ để người dùng thấy "bản này sửa nhiều hay ít" mà không phải duyệt cây trường như Payload.
 */
export function countChangedFields(current: Record<string, unknown>, previous: Record<string, unknown>): number {
  const keys = new Set([...Object.keys(current), ...Object.keys(previous)]);
  let changed = 0;
  for (const key of keys) {
    if (VERSION_HIDDEN_FIELDS.has(key)) continue;
    if (!isDeepStrictEqual(dropEmpty(current[key]) ?? null, dropEmpty(previous[key]) ?? null)) changed += 1;
  }
  return changed;
}

/** "22/10/2026 13:38" theo giờ Việt Nam (không phụ thuộc múi giờ máy chủ). */
export function formatVersionTime(value: string | Date): string {
  const time = new Date(value);
  if (Number.isNaN(time.getTime())) return "—";
  const parts = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: TIME_ZONE }).formatToParts(time);
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("day")}/${pick("month")}/${pick("year")} ${pick("hour")}:${pick("minute")}`;
}

type SelectOption = string | { label?: unknown; value: string };

/** Nhãn tiếng Việt của một giá trị trạng thái, lấy từ option của chính field `status` của collection (nhãn không phải chuỗi thì dùng giá trị thô). */
export function statusLabelFromOptions(options: readonly SelectOption[] | undefined, value: string): string {
  const match = options?.find((option) => (typeof option === "string" ? option : option.value) === value);
  return typeof match === "object" && typeof match.label === "string" ? match.label : value;
}
