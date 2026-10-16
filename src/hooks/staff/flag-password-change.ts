import type { CollectionBeforeValidateHook } from "payload";

/**
 * Khoá cờ trong `req.context` theo id doc: một request (bulk update, hoặc code server tái dùng `req`) có thể
 * sửa nhiều doc, nên một cờ dùng chung sẽ làm doc sau mất audit hoặc ghi nhầm.
 */
export const passwordChangedFlagKey = (docId: string | number): string => `staffPasswordChanged:${docId}`;

/**
 * Sau khi vào `afterChange`, mật khẩu đã bị Payload tách khỏi `data` và băm, nên phải ghi nhận ở `beforeValidate`
 * (lúc `data.password` còn là chữ thường). Luồng đặt lại bằng token không đi qua đây (`data` là doc đã băm).
 * Mỗi lần update đều đặt hoặc xoá cờ của doc đó: cờ sót lại từ một lần update lỗi không lọt sang lần sau.
 */
export const flagPasswordChange: CollectionBeforeValidateHook = ({ data, operation, originalDoc, context }) => {
  if (operation !== "update" || originalDoc?.id === undefined) return data;
  const key = passwordChangedFlagKey(originalDoc.id);
  if (typeof data?.password === "string" && data.password !== "") context[key] = true;
  else delete context[key];
  return data;
};
