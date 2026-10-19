import type { CollectionConfig, Field } from "payload";

/** Kiểu trường không dùng làm điều kiện lọc trong "Thêm bộ lọc" (nội dung dài, tệp, toạ độ, JSON, mảng, trường ảo). */
const NON_FILTERABLE_TYPES = new Set<string>(["richText", "textarea", "upload", "point", "json", "array", "blocks", "ui", "join"]);

const withoutListFilter = (field: Field): Field =>
  ({ ...field, admin: { ...("admin" in field ? field.admin : undefined), disableListFilter: true } }) as Field;

/** Trường dùng chung của `withContentDefaults` không có giá trị lọc nghiệp vụ: SEO, nhóm bản dịch (đã có ô "Trạng thái dịch" riêng), slug. */
const SHARED_HIDDEN_PATHS = ["seo", "translation", "slug", "scopeSlug"] as const;

/**
 * Ẩn trường kỹ thuật khỏi "Thêm bộ lọc" của danh sách admin (BL-021 #06). `disableListFilter` của Payload chỉ ẩn khỏi menu chọn trường:
 * cột danh sách, form sửa và truy vấn `where` (ô "Trạng thái dịch", xuất Excel) KHÔNG đổi. Payload kiểm cờ ở từng trường lá
 * (không kế thừa từ group), nên hàm duyệt xuống tận lá.
 * Ẩn: trường thuộc kiểu `NON_FILTERABLE_TYPES`; nhóm có tên trong `hiddenPaths` (ẩn cả cây); trường có đường dẫn dữ liệu (`group.field`) trong `hiddenPaths`.
 */
export function hideTechnicalListFilters(collection: CollectionConfig, hiddenPaths: readonly string[] = []): CollectionConfig {
  const hidden = new Set<string>([...SHARED_HIDDEN_PATHS, ...hiddenPaths]);
  const visit = (fields: Field[], prefix: string, hideAll: boolean): Field[] =>
    fields.map((field): Field => {
      if (field.type === "row" || field.type === "collapsible") return { ...field, fields: visit(field.fields, prefix, hideAll) } as Field;
      if (field.type === "tabs") {
        return { ...field, tabs: field.tabs.map((tab) => ({ ...tab, fields: visit(tab.fields, "name" in tab && tab.name ? `${prefix}${tab.name}.` : prefix, hideAll) })) } as Field;
      }
      const path = "name" in field && field.name ? `${prefix}${field.name}` : undefined;
      const hideThis = hideAll || NON_FILTERABLE_TYPES.has(field.type) || (path !== undefined && hidden.has(path));
      if (field.type === "group") {
        const nested = visit(field.fields, path ? `${path}.` : prefix, hideThis);
        return { ...field, fields: nested } as Field;
      }
      return hideThis ? withoutListFilter(field) : field;
    });
  return { ...collection, fields: visit(collection.fields, "", false) };
}
