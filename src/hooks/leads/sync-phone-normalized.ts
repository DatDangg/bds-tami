import { type CollectionBeforeValidateHook, type Validate } from "payload";

import { createViValidationError } from "../../lib/errors/vi-validation-error";
import { ANONYMIZED_PLACEHOLDER } from "../../lib/leads/lead-values";
import { normalizePhone } from "../../lib/phone";

/**
 * `phoneNormalized` (khoá chống trùng BR-15) luôn suy ra từ `phone`, không nhận giá trị từ client:
 * - tạo/sửa `phone` hợp lệ → `+84…`;
 * - đang ẩn danh (`anonymizedAt` đặt) → cùng giá trị thay thế với `phone`, để số thật không còn ở cột nào;
 * - `phone` không hợp lệ → để `validatePhone` báo lỗi (không đoán giá trị).
 */
export const syncPhoneNormalized: CollectionBeforeValidateHook = ({ data, originalDoc }) => {
  if (!data) return data;
  if (data.anonymizedAt ?? originalDoc?.anonymizedAt) return { ...data, phoneNormalized: ANONYMIZED_PLACEHOLDER };
  const phone = data.phone;
  if (typeof phone !== "string") return data;
  const normalized = normalizePhone(phone);
  return normalized ? { ...data, phoneNormalized: normalized } : data;
};

/** SĐT Việt Nam hợp lệ; lead đã ẩn danh mang giá trị thay thế nên bỏ qua. */
export const validatePhone: Validate<string, unknown, { anonymizedAt?: unknown }> = (value, { data }) => {
  if ((data as { anonymizedAt?: unknown } | undefined)?.anonymizedAt) return true;
  if (typeof value !== "string" || value.trim() === "") return "Số điện thoại là bắt buộc";
  return normalizePhone(value) ? true : "Số điện thoại không hợp lệ";
};

const CUSTOMER_FIELDS = ["fullName", "phone", "email", "message"] as const;

/**
 * Lead đã ẩn danh (BR-32) không nhận lại dữ liệu khách: đổi `fullName`/`phone`/`email`/`message` bị từ chối. Giá trị trùng bản
 * hiện có (form admin gửi lại nguyên trạng, hoặc ghi lại placeholder) vẫn được chấp nhận.
 */
export const guardAnonymizedCustomerData: CollectionBeforeValidateHook = ({ data, originalDoc, operation, req }) => {
  if (!data || operation !== "update" || !originalDoc?.anonymizedAt) return data;
  const changed = CUSTOMER_FIELDS.filter((name) => name in data && (data[name] ?? null) !== (originalDoc[name] ?? null));
  if (changed.length === 0) return data;
  throw createViValidationError({
    collection: "leads",
    errors: changed.map((path) => ({ path, message: "Lead đã xoá thông tin cá nhân, không thể sửa thông tin khách" })),
    req,
  });
};
