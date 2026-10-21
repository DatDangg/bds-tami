import type { Field, GroupField, TextFieldSingleValidation } from "payload";

import { validateVideoUrl } from "../../hooks/rentals/field-validators";
import { trimText } from "../../hooks/trim-text";
import { textRowLabel } from "../../lib/admin/row-label";
import { isInternalPathOrHttps } from "../../lib/content/internal-path";

/** Trang danh sách có nội dung riêng (BL-052); đọc ra cho trang công khai bằng `lib/content/load-listing-page.ts`. */
export const LISTING_PAGE_KEYS = ["projects", "rentals", "propertyPosts"] as const;
export type ListingPageKey = (typeof LISTING_PAGE_KEYS)[number];

const LISTING_PAGE_LABELS: Record<ListingPageKey, string> = {
  projects: "Trang Dự án",
  rentals: "Trang Cho thuê",
  propertyPosts: "Trang Đăng tin BĐS",
};

export const MAX_QUICK_SEARCH = 8;
export const MAX_LISTING_FAQS = 10;

const validateCtaHref: TextFieldSingleValidation = (value) => {
  if (typeof value !== "string" || value.trim() === "") return true;
  return isInternalPathOrHttps(value.trim()) ? true : "Đường dẫn phải bắt đầu bằng / (trang trong website, VD: /lien-he) hoặc https://";
};

/** Tên bảng DB rút gọn: tên mặc định `site_settings_listing_pages_property_posts_quick_search_*` vượt giới hạn 63 ký tự của Postgres. */
const QUICK_SEARCH_DB_NAMES: Record<ListingPageKey, string> = {
  projects: "site_settings_lp_projects_quick_search",
  rentals: "site_settings_lp_rentals_quick_search",
  propertyPosts: "site_settings_lp_property_posts_quick_search",
};

const quickSearchField = (key: ListingPageKey): Field => ({
  name: "quickSearch",
  dbName: QUICK_SEARCH_DB_NAMES[key],
  type: "array",
  label: "Tìm kiếm nhanh",
  labels: { singular: "Từ khoá", plural: "Từ khoá" },
  maxRows: MAX_QUICK_SEARCH,
  admin: {
    description: `Các từ khoá gợi ý dưới ô tìm kiếm (tối đa ${MAX_QUICK_SEARCH}). Bấm vào từ khoá là tìm theo từ đó.`,
    components: { RowLabel: textRowLabel({ field: "label", fallback: "Từ khoá" }) },
  },
  fields: [{ name: "label", type: "text", label: "Từ khoá", localized: true, required: true, admin: { placeholder: "VD: Căn hộ Quận 7" } }],
});

const learnMoreField: GroupField = {
  name: "learnMore",
  type: "group",
  label: "Khối \"Tìm hiểu thêm\"",
  admin: { description: "Khối ảnh/video kèm giới thiệu ở cuối trang. Để trống tiêu đề thì không hiện khối." },
  fields: [
    { name: "eyebrow", type: "text", label: "Dòng chữ nhỏ trên tiêu đề", localized: true },
    { name: "title", type: "text", label: "Tiêu đề (dòng 1)", localized: true },
    { name: "titleAccent", type: "text", label: "Dòng 2 tiêu đề, màu vàng", localized: true },
    { name: "description", type: "textarea", label: "Mô tả", localized: true },
    { name: "image", type: "upload", label: "Ảnh", relationTo: "media", filterOptions: { mimeType: { contains: "image/" } } },
    {
      name: "videoUrl",
      type: "text",
      label: "Link video (tuỳ chọn)",
      validate: validateVideoUrl,
      hooks: { beforeValidate: [trimText] },
      admin: { description: "Link YouTube hoặc TikTok (https://). Có link thì ảnh có nút phát video." },
    },
    { name: "ctaLabel", type: "text", label: "Chữ trên nút", localized: true, admin: { placeholder: "VD: Liên hệ tư vấn" } },
    {
      name: "ctaHref",
      type: "text",
      label: "Nút dẫn tới",
      validate: validateCtaHref,
      hooks: { beforeValidate: [trimText] },
      admin: { placeholder: "/lien-he", description: "Trang trong website bắt đầu bằng / (VD: /lien-he) hoặc địa chỉ https://. Thiếu chữ hoặc đường dẫn thì ẩn nút." },
    },
  ],
};

const faqsField: Field = {
  name: "faqs",
  type: "array",
  label: "Câu hỏi thường gặp",
  labels: { singular: "Câu hỏi", plural: "Câu hỏi thường gặp" },
  maxRows: MAX_LISTING_FAQS,
  admin: { description: `Tối đa ${MAX_LISTING_FAQS} câu hỏi, hiện ở cuối trang.`, components: { RowLabel: textRowLabel({ field: "question", fallback: "Câu hỏi" }) } },
  fields: [
    { name: "question", type: "text", label: "Câu hỏi", localized: true, required: true },
    { name: "answer", type: "textarea", label: "Trả lời", localized: true, required: true },
  ],
};

/** `/du-an` dùng cờ `showProjectStrengths` sẵn có (tab "Ảnh banner"); hai trang còn lại có cờ riêng ở đây. */
const showStrengthsField: Field = { name: "showStrengths", type: "checkbox", label: "Hiện dải Điểm mạnh ở trang này (danh sách và chi tiết)", defaultValue: true };

function listingPageGroup(key: ListingPageKey): GroupField {
  return {
    name: key,
    type: "group",
    label: LISTING_PAGE_LABELS[key],
    fields: [quickSearchField(key), learnMoreField, faqsField, ...(key === "projects" ? [] : [showStrengthsField])],
  };
}

/** Nội dung riêng của 3 trang danh sách (vi + en), `site-settings` tab "Trang danh sách". */
export const listingPagesField: GroupField = {
  name: "listingPages",
  type: "group",
  label: "Nội dung trang danh sách",
  admin: { description: "Từ khoá tìm nhanh, khối \"Tìm hiểu thêm\" và câu hỏi thường gặp của từng trang. Chữ nhập riêng cho tiếng Việt và tiếng Anh; dòng chưa có chữ tiếng Anh thì không hiện ở bản tiếng Anh." },
  fields: LISTING_PAGE_KEYS.map(listingPageGroup),
};
