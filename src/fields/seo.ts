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
    label: "SEO",
    localized: true,
    fields: [
      { name: "metaTitle", type: "text", label: "Tiêu đề hiện trên Google", admin: { description: "Để trống thì dùng tiêu đề bài." } },
      { name: "metaDescription", type: "textarea", label: "Mô tả hiện trên Google" },
      { name: "ogImage", type: "upload", label: "Ảnh khi chia sẻ lên mạng xã hội", relationTo: "media", filterOptions: { mimeType: { contains: "image/" } } },
      { name: "noindex", type: "checkbox", label: "Ẩn trang khỏi Google", defaultValue: false },
      { name: "canonical", type: "text", label: "Đường dẫn gốc (khi trang trùng nội dung)", admin: { description: "Thường để trống." } },
    ],
  };
}
