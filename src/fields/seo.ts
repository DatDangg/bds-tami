import type { GroupField } from "payload";

/**
 * Nhóm `seo` dùng chung (ERD §4.14), localized: mỗi ngôn ngữ có meta riêng. Trống thì phía hiển thị
 * lấy `title`/`summary`/ảnh đại diện (xử lý ở layer trang công khai).
 * Tự khai báo thay vì `@payloadcms/plugin-seo`: plugin đặt nhóm tên `meta` (title/description/image),
 * không có `noindex`/`canonical` và lệch tên so với ERD.
 */
export function seoField(): GroupField {
  return {
    name: "seo",
    type: "group",
    localized: true,
    fields: [
      { name: "metaTitle", type: "text" },
      { name: "metaDescription", type: "textarea" },
      { name: "ogImage", type: "upload", relationTo: "media", filterOptions: { mimeType: { contains: "image/" } } },
      { name: "noindex", type: "checkbox", defaultValue: false },
      { name: "canonical", type: "text" },
    ],
  };
}
