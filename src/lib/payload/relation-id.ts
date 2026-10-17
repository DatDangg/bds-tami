/** Id của quan hệ: có thể là id thô hoặc bản ghi đã populate (depth > 0); `null` khi trống hoặc không đúng dạng. */
export function relationId(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "object") return relationId((value as { id?: unknown }).id);
  return typeof value === "string" || typeof value === "number" ? String(value) : null;
}
