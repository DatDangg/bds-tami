import type { FieldHook } from "payload";

/**
 * `rentedAt` do hệ thống gán (ERD §4.6): lúc `status` chuyển sang `rented` thì ghi thời điểm đó; đang `rented` mà lưu lại
 * (đổi trường khác) thì giữ nguyên; rời `rented` (mở cho thuê lại) thì xoá, để lần cho thuê sau ghi mốc mới. Dùng `beforeChange`
 * vì access chặn sửa tay đã xoá giá trị client gửi ở bước `beforeValidate`.
 */
export const stampRentedAt: FieldHook = ({ value, data, originalDoc, previousValue }) => {
  const status = data?.status ?? originalDoc?.status;
  if (status !== "rented") return null;
  const wasRented = originalDoc?.status === "rented";
  return wasRented && (previousValue ?? value) ? (previousValue ?? value) : new Date().toISOString();
};
