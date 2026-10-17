import type { FieldHook, RelationshipField } from "payload";

import { isAdmin } from "../access";

/** Tự gán người tạo khi chưa có `author` (Local API không user, như seed, thì giữ nguyên và để `required` báo). */
const defaultToCreator: FieldHook = ({ value, operation, req }) => {
  if (operation === "create" && !value && req.user) return req.user.id;
  return value;
};

/** `author` (PERMISSION §4): tự gán người tạo; chỉ admin đổi. Sale gửi giá trị khác bị bỏ qua. */
export function authorField(): RelationshipField {
  return {
    name: "author",
    type: "relationship",
    relationTo: "staff",
    required: true,
    index: true,
    access: { create: isAdmin, update: isAdmin },
    hooks: { beforeChange: [defaultToCreator] },
    admin: { position: "sidebar" },
  };
}
