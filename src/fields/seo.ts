import type { CollapsibleField, GroupField } from "payload";

const SEO_PREVIEW = "/components/admin/SeoPreview#SeoPreview";
const SEO_TITLE_COUNTER = "/components/admin/SeoLengthCounter#SeoTitleCounter";
const SEO_DESCRIPTION_COUNTER = "/components/admin/SeoLengthCounter#SeoDescriptionCounter";

/**
 * Nhóm `seo` dùng chung (ERD §4.14), localized: mỗi ngôn ngữ có meta riêng. Trống thì phía hiển thị
 * lấy `title`/`summary`/ảnh đại diện (xử lý ở layer trang công khai).
 * Tự khai báo thay vì `@payloadcms/plugin-seo`: plugin đặt nhóm tên `meta` (title/description/image),
 * không có `noindex`/`canonical` và lệch tên so với ERD.
 *
 * BL-058 T05: nhãn nhóm để `false` (tab/khối đã mang tên "SEO" nên tiêu đề không lặp), thêm khung xem trước
 * kết quả Google + bộ đếm ký tự, gom "Ẩn trang khỏi Google" và "Đường dẫn gốc" vào khối thu gọn "Nâng cao".
 * Vỏ `collapsible` KHÔNG tên nên đường dẫn dữ liệu vẫn là `seo.metaTitle`, `seo.noindex`… (không đổi schema).
 */
export function seoField(): GroupField {
  const advanced: CollapsibleField = {
    type: "collapsible",
    label: "Nâng cao",
    admin: { initCollapsed: true },
    fields: [
      { name: "noindex", type: "checkbox", label: "Ẩn trang khỏi Google", defaultValue: false },
      {
        name: "canonical",
        type: "text",
        label: "Đường dẫn gốc (khi trang trùng nội dung)",
        admin: { description: "Thường để trống.", placeholder: "https://…" },
      },
    ],
  };

  return {
    name: "seo",
    type: "group",
    label: false,
    localized: true,
    fields: [
      {
        name: "metaTitle",
        type: "text",
        label: "Tiêu đề hiện trên Google",
        admin: {
          description: "Để trống thì tự lấy Tiêu đề của trang.",
          placeholder: "Để trống thì dùng Tiêu đề của trang",
          components: { beforeInput: [SEO_PREVIEW], afterInput: [SEO_TITLE_COUNTER] },
        },
      },
      {
        name: "metaDescription",
        type: "textarea",
        label: "Mô tả hiện trên Google",
        admin: {
          description: "Để trống thì tự lấy Tóm tắt hoặc Mô tả ngắn của trang.",
          placeholder: "Để trống thì dùng Tóm tắt / Mô tả ngắn của trang",
          components: { afterInput: [SEO_DESCRIPTION_COUNTER] },
        },
      },
      { name: "ogImage", type: "upload", label: "Ảnh khi chia sẻ lên mạng xã hội", relationTo: "media", filterOptions: { mimeType: { contains: "image/" } } },
      advanced,
    ],
  };
}
