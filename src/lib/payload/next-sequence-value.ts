import type { PostgresAdapter } from "@payloadcms/db-postgres";
import type { PayloadRequest } from "payload";

/** Chỉ nhận tên sequence cố định trong code (hằng số `*_CODE_SEQUENCE`), vì tên được nối vào câu SQL. */
const SEQUENCE_NAME = /^[a-z_]+$/;

/**
 * `nextval` chạy trên chính kết nối của transaction đang lưu (không mở kết nối thứ hai: nhiều lần tạo song song mà mỗi lần xin
 * thêm một kết nối có thể làm cạn pool). `nextval` không thuộc transaction nên số không bao giờ bị cấp lại, kể cả khi lần lưu
 * rollback (mã có thể nhảy cóc nhưng không trùng).
 */
export async function nextSequenceValue(req: PayloadRequest, sequenceName: string): Promise<string> {
  if (!SEQUENCE_NAME.test(sequenceName)) throw new Error(`Tên sequence không hợp lệ: ${sequenceName}`);
  const adapter = req.payload.db as unknown as PostgresAdapter;
  const transactionId = await req.transactionID;
  const session = transactionId ? adapter.sessions[String(transactionId)] : undefined;
  const result = await adapter.execute({
    db: session?.db ?? adapter.drizzle,
    raw: `SELECT nextval('${sequenceName}') AS value`,
  });
  const value = result.rows[0]?.value;
  if (typeof value !== "string" && typeof value !== "number") throw new Error(`Sequence ${sequenceName} không trả giá trị.`);
  return String(value);
}
