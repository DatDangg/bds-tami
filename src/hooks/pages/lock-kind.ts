import type { CollectionBeforeValidateHook } from "payload";

/**
 * `kind` không đổi sau khi tạo: route công khai và `site-settings.privacyPolicyVersion` gắn với nó. `access.update: denyAll`
 * của trường chỉ chặn request có kiểm quyền; Local API mặc định `overrideAccess: true` (seed, job, script) bỏ qua nó,
 * nên ép lại giá trị đã lưu ở đây (cùng mẫu `lockCategoryScope`).
 */
export const lockPageKind: CollectionBeforeValidateHook = ({ data, originalDoc, operation }) => {
  if (operation !== "update" || !data || !originalDoc?.kind) return data;
  return { ...data, kind: originalDoc.kind };
};
