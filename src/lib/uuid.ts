const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Id bản ghi Payload ở project này là UUID. Truy vấn `findByID`/`where id` với chuỗi sai dạng làm Postgres ném lỗi cast (thành 500),
 * nên mọi chỗ nhận id từ bên ngoài phải kiểm bằng hàm này trước khi chạm DB.
 */
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}
