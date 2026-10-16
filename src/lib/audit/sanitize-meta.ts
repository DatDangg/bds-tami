/** Khoá chứa bí mật: mật khẩu, salt/hash, token, khoá API, cookie, session. Không phân biệt hoa thường, theo chuỗi con. */
const SENSITIVE_KEY = /password|passwd|salt|hash|token|secret|api[-_]?key|authorization|cookie|session/i;

const MAX_DEPTH = 6;
const TRUNCATED = "[truncated]";
const CIRCULAR = "[circular]";

export type AuditMeta = Record<string, unknown>;

function sanitizeValue(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== "object") return undefined; // undefined, function, symbol: không lưu được vào JSON
  if (seen.has(value)) return CIRCULAR;
  if (depth >= MAX_DEPTH) return TRUNCATED;
  seen.add(value);
  try {
    if (Array.isArray(value)) {
      return value.map((item) => sanitizeValue(item, depth + 1, seen) ?? null);
    }
    return sanitizeObject(value as AuditMeta, depth + 1, seen);
  } finally {
    seen.delete(value);
  }
}

function sanitizeObject(source: AuditMeta, depth: number, seen: WeakSet<object>): AuditMeta {
  const result: AuditMeta = {};
  for (const [key, value] of Object.entries(source)) {
    if (SENSITIVE_KEY.test(key)) continue;
    const clean = sanitizeValue(value, depth, seen);
    if (clean !== undefined) result[key] = clean;
  }
  return result;
}

/**
 * Làm sạch `meta` trước khi ghi nhật ký: bỏ mọi khoá nhạy cảm ở mọi độ sâu (ERD §4.13: không chứa mật khẩu),
 * đổi Date/bigint sang dạng JSON, cắt ở độ sâu 6 và chặn vòng tham chiếu. Chỉ lọc theo TÊN khoá: người gọi
 * vẫn không được nhét bí mật vào giá trị chuỗi.
 */
export function sanitizeAuditMeta(meta: AuditMeta | null | undefined): AuditMeta | undefined {
  if (!meta) return undefined;
  return sanitizeObject(meta, 0, new WeakSet());
}
