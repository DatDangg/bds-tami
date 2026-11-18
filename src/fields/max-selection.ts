import type { RelationshipField, RelationshipFieldManyValidation, Where } from "payload";
import { relationship } from "payload/shared";

type MaxSelectionField = RelationshipField & { name: string; hasMany: true };

/** Id của mục đã chọn (mảng id hoặc object đã populate), bỏ giá trị rỗng. */
function selectedIds(value: unknown): unknown[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => (typeof item === "object" && item !== null ? (item as { id?: unknown }).id : item)).filter((id) => id != null && id !== "");
}

/**
 * Relationship hasMany có giới hạn (BL-119). Payload chỉ truyền `maxRows` mà không chặn chọn, và lỗi onChange chỉ hiện sau lần Lưu đầu:
 * - `filterOptions`: đủ `max` thì dropdown chỉ còn đúng các mục đã chọn → không chọn thêm được (id đã chọn luôn hợp lệ khi `relationship()` kiểm lúc lưu);
 * - `validate`: kiểm số lượng trước, đồng bộ (`Tối đa N <đơn vị>.`), rồi mới validate gốc / mặc định;
 * - `afterInput`: `MaxSelectionHint` nhắc giới hạn dưới ô, đỏ khi vượt (dữ liệu cũ/API).
 */
export function withMaxSelection<T extends MaxSelectionField>(field: T, max: number, unit: string): T {
  const baseFilter = field.filterOptions;
  const baseValidate = field.validate as RelationshipFieldManyValidation | undefined;
  const message = `Tối đa ${max} ${unit}.`;
  const existingAfterInput = field.admin?.components?.afterInput;
  const afterInput = [...(Array.isArray(existingAfterInput) ? existingAfterInput : existingAfterInput ? [existingAfterInput] : []), { path: "/components/admin/MaxSelectionHint#MaxSelectionHint", clientProps: { max, unit } }];

  return {
    ...field,
    maxRows: max,
    filterOptions: async (args) => {
      const base = typeof baseFilter === "function" ? await baseFilter(args) : (baseFilter ?? true);
      const ids = selectedIds((args.siblingData as Record<string, unknown> | undefined)?.[field.name]);
      if (ids.length < max) return base;
      const lock: Where = { id: { in: ids } };
      if (base === true) return lock;
      if (base === false) return false;
      return { and: [base, lock] };
    },
    validate: (async (value, options) => {
      if (Array.isArray(value) && value.length > max) return message;
      return baseValidate ? baseValidate(value, options) : relationship(value, options);
    }) as RelationshipFieldManyValidation,
    admin: { ...field.admin, components: { ...field.admin?.components, afterInput } },
  };
}
