import type { CollectionBeforeValidateHook } from "payload";

import { nextSequenceValue } from "../../lib/payload/next-sequence-value";

/** Sequence Postgres tạo trong migration `rentals` (ERD §1, §4.6). Mỗi lần gọi `nextval` trả số riêng dù nhiều transaction chạy song song. */
export const RENTAL_CODE_SEQUENCE = "rentals_code_seq";

export function formatRentalCode(sequenceValue: number | string | bigint): string {
  return `CT-${String(sequenceValue).padStart(6, "0")}`;
}

/**
 * Mã `CT-000001` chỉ do hệ thống ghi (PERMISSION §4): lúc tạo luôn lấy từ sequence (bỏ qua giá trị gửi lên, kể cả khi
 * `overrideAccess` hoặc khi nhân bản tin), lúc sửa luôn giữ mã đã lưu. Chạy ở `beforeValidate` cấp collection, SAU bước access
 * trường (đã xoá giá trị client gửi) và TRƯỚC validate `required`/`unique` và hook `searchText` (cần `code`).
 */
export const assignRentalCode: CollectionBeforeValidateHook = async ({ data, operation, originalDoc, req }) => {
  if (!data) return data;
  if (operation === "create") return { ...data, code: formatRentalCode(await nextSequenceValue(req, RENTAL_CODE_SEQUENCE)) };
  const storedCode = (originalDoc as { code?: unknown } | undefined)?.code;
  return typeof storedCode === "string" && storedCode !== "" ? { ...data, code: storedCode } : data;
};
