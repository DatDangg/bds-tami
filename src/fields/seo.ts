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
      { name: "metaTitle", type: "text", label: "Tiêu đề SEO (meta title)", admin: { description: "Để trống thì dùng tiêu đề bài." } },
      { name: "metaDescription", type: "textarea", label: "Mô tả SEO (meta description)" },
      { name: "ogImage", type: "upload", label: "Ảnh chia sẻ mạng xã hội (OG image)", relationTo: "media", filterOptions: { mimeType: { contains: "image/" } } },
      { name: "noindex", type: "checkbox", label: "Không cho máy tìm kiếm lập chỉ mục (noindex)", defaultValue: false },
      { name: "canonical", type: "text", label: "URL chuẩn (canonical)" },
    ],
  };
}
