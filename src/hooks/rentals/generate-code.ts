import type { PostgresAdapter } from "@payloadcms/db-postgres";
import type { CollectionBeforeValidateHook, PayloadRequest } from "payload";

/** Sequence Postgres tạo trong migration `rentals` (ERD §1, §4.6). Mỗi lần gọi `nextval` trả số riêng dù nhiều transaction chạy song song. */
export const RENTAL_CODE_SEQUENCE = "rentals_code_seq";

export function formatRentalCode(sequenceValue: number | string | bigint): string {
  return `CT-${String(sequenceValue).padStart(6, "0")}`;
}

/**
 * `nextval` chạy trên chính kết nối của transaction đang lưu tin (không mở kết nối thứ hai: 20 lần tạo song song mà mỗi lần xin
 * thêm một kết nối có thể làm cạn pool). `nextval` không thuộc transaction nên số không bao giờ bị cấp lại, kể cả khi lần lưu
 * rollback (mã có thể nhảy cóc nhưng không trùng).
 */
async function nextSequenceValue(req: PayloadRequest): Promise<string> {
  const adapter = req.payload.db as unknown as PostgresAdapter;
  const transactionId = await req.transactionID;
  const session = transactionId ? adapter.sessions[String(transactionId)] : undefined;
  const result = await adapter.execute({
    db: session?.db ?? adapter.drizzle,
    raw: `SELECT nextval('${RENTAL_CODE_SEQUENCE}') AS value`,
  });
  const value = result.rows[0]?.value;
  if (typeof value !== "string" && typeof value !== "number") throw new Error(`Sequence ${RENTAL_CODE_SEQUENCE} không trả giá trị.`);
  return String(value);
}

/**
 * Mã `CT-000001` chỉ do hệ thống ghi (PERMISSION §4): lúc tạo luôn lấy từ sequence (bỏ qua giá trị gửi lên, kể cả khi
 * `overrideAccess` hoặc khi nhân bản tin), lúc sửa luôn giữ mã đã lưu. Chạy ở `beforeValidate` cấp collection, SAU bước access
 * trường (đã xoá giá trị client gửi) và TRƯỚC validate `required`/`unique` và hook `searchText` (cần `code`).
 */
export const assignRentalCode: CollectionBeforeValidateHook = async ({ data, operation, originalDoc, req }) => {
  if (!data) return data;
  if (operation === "create") return { ...data, code: formatRentalCode(await nextSequenceValue(req)) };
  const storedCode = (originalDoc as { code?: unknown } | undefined)?.code;
  return typeof storedCode === "string" && storedCode !== "" ? { ...data, code: storedCode } : data;
};
