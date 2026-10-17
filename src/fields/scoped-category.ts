import type { RelationshipField, RelationshipFieldSingleValidation } from "payload";

import type { CategoryScope } from "../hooks/categories/scope-collections";
import { preserveRequestLocale } from "../lib/payload/preserve-request-locale";

/** `category` có thể là id hoặc bản ghi đã populate (depth > 0). */
function toId(value: unknown): string | number | null {
  if (value == null) return null;
  if (typeof value === "object") return toId((value as { id?: unknown }).id);
  return typeof value === "string" || typeof value === "number" ? value : null;
}

/**
 * Trường `category` của collection nội dung (ERD §2): bắt buộc, trỏ tới danh mục ĐÚNG `scope` và chưa xoá mềm. Quan hệ thô của
 * Payload không giới hạn theo scope nên `validate` đọc lại danh mục (API/seed cũng bị chặn, không chỉ `filterOptions` của admin).
 * `data` của lần sửa một phần có thể thiếu `category` dù bản đã lưu có, nên giá trị đã lưu (`previousValue`) cũng được tính.
 */
export function scopedCategoryField(scope: CategoryScope): RelationshipField {
  const validate: RelationshipFieldSingleValidation = async (value, { req, previousValue }) => {
    const id = toId(value === undefined ? previousValue : value);
    if (id === null) return "Danh mục không được để trống.";
    const category = await preserveRequestLocale(req, () =>
      req.payload.findByID({
        collection: "categories",
        id,
        trash: true,
        depth: 0,
        select: { scope: true, deletedAt: true },
        overrideAccess: true,
        req,
        disableErrors: true,
      }),
    );
    if (!category) return "Danh mục không tồn tại.";
    if (category.scope !== scope) return `Danh mục phải thuộc loại "${scope}".`;
    if (category.deletedAt) return "Danh mục đang ở thùng rác.";
    return true;
  };
  return {
    name: "category",
    type: "relationship",
    relationTo: "categories",
    index: true,
    validate,
    filterOptions: { scope: { equals: scope } },
    admin: { position: "sidebar" },
  };
}
