import type { CollectionBeforeValidateHook } from "payload";

/**
 * `scope` không đổi sau khi tạo: đổi sẽ làm lệch cha–con, nội dung đang dùng và khoá `scopeSlug` của các locale
 * khác. `access.update: denyAll` của trường chỉ chặn request có kiểm quyền; Local API mặc định `overrideAccess: true`
 * (seed, job, script) bỏ qua nó, nên ép lại giá trị đã lưu ở đây.
 */
export const lockCategoryScope: CollectionBeforeValidateHook = ({ data, originalDoc, operation }) => {
  if (operation !== "update" || !data || !originalDoc?.scope) return data;
  return { ...data, scope: originalDoc.scope };
};
