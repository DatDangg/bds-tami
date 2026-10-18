import type { CollectionBeforeValidateHook } from "payload";

import { nextSequenceValue } from "../../lib/payload/next-sequence-value";

/** Sequence Postgres tạo trong migration `leads` (ERD §4.11). */
export const LEAD_CODE_SEQUENCE = "leads_code_seq";

export function formatLeadCode(sequenceValue: number | string | bigint): string {
  return `LD-${String(sequenceValue).padStart(6, "0")}`;
}

/**
 * Mã `LD-000001` chỉ do hệ thống ghi (PERMISSION §4): lúc tạo luôn lấy từ sequence (bỏ qua giá trị gửi lên), lúc sửa luôn giữ
 * mã đã lưu. Cùng cách làm với `assignRentalCode`; chạy ở `beforeValidate` để qua được `required`/`unique`.
 */
export const assignLeadCode: CollectionBeforeValidateHook = async ({ data, operation, originalDoc, req }) => {
  if (!data) return data;
  if (operation === "create") return { ...data, code: formatLeadCode(await nextSequenceValue(req, LEAD_CODE_SEQUENCE)) };
  const storedCode = (originalDoc as { code?: unknown } | undefined)?.code;
  return typeof storedCode === "string" && storedCode !== "" ? { ...data, code: storedCode } : data;
};
