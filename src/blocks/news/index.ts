import type { Block } from "payload";

/**
 * Khối chèn trong trình soạn `news.content` (BL-054 Quyết định 3). Dữ liệu nằm trong JSON Lexical của bài (đã localized theo bài), không
 * có bảng DB riêng. `slug` là `blockType` lưu trong JSON: KHÔNG đổi (bài cũ sẽ mất khối); `RichText` và bộ dịch (`translation/lexical.ts`)
 * nhận khối theo đúng các slug này. Thêm trường chữ mới vào khối thì phải thêm vào `BLOCK_TEXT_FIELDS` của bộ dịch (test buộc khớp).
 */
export const NEWS_BLOCK_SLUGS = {
  statHighlights: "statHighlights",
  projectMention: "projectMention",
  imageText: "imageText",
} as const;

export const STAT_HIGHLIGHTS_MAX = 4;
export const STAT_VALUE_MAX_LENGTH = 16;
export const STAT_LABEL_MAX_LENGTH = 80;
export const IMAGE_TEXT_POSITIONS = ["left", "right"] as const;
export type ImageTextPosition = (typeof IMAGE_TEXT_POSITIONS)[number];

export const statHighlightsBlock: Block = {
  slug: NEWS_BLOCK_SLUGS.statHighlights,
  interfaceName: "StatHighlightsBlock",
  labels: { singular: "Số liệu nổi bật", plural: "Số liệu nổi bật" },
  fields: [
    {
      name: "items",
      type: "array",
      label: "Các số liệu",
      labels: { singular: "Số liệu", plural: "Số liệu" },
      required: true,
      minRows: 1,
      maxRows: STAT_HIGHLIGHTS_MAX,
      admin: { description: `Từ 1 đến ${STAT_HIGHLIGHTS_MAX} số liệu, hiện thành các ô số lớn.` },
      fields: [
        { name: "value", type: "text", label: "Con số", required: true, maxLength: STAT_VALUE_MAX_LENGTH, admin: { placeholder: "VD: +18%" } },
        { name: "label", type: "text", label: "Mô tả", required: true, maxLength: STAT_LABEL_MAX_LENGTH, admin: { placeholder: "VD: Nguồn cung mới so với cùng kỳ" } },
      ],
    },
  ],
};

export const projectMentionBlock: Block = {
  slug: NEWS_BLOCK_SLUGS.projectMention,
  interfaceName: "ProjectMentionBlock",
  labels: { singular: "Dự án nhắc đến", plural: "Dự án nhắc đến" },
  fields: [
    {
      name: "project",
      type: "relationship",
      label: "Dự án",
      relationTo: "projects",
      required: true,
      // Chỉ lưu id: web tự tải dự án qua truy vấn công khai theo ngôn ngữ (đã xuất bản, `/en` có bản EN), không populate cả dự án vào bài.
      maxDepth: 0,
      admin: { description: "Web hiện thẻ dự án; dự án chưa xuất bản (hoặc chưa có bản tiếng Anh ở trang EN) thì khối tự ẩn." },
    },
  ],
};

export const imageTextBlock: Block = {
  slug: NEWS_BLOCK_SLUGS.imageText,
  interfaceName: "ImageTextBlock",
  labels: { singular: "Ảnh cạnh chữ", plural: "Ảnh cạnh chữ" },
  fields: [
    { name: "image", type: "upload", label: "Ảnh", relationTo: "media", required: true, filterOptions: { mimeType: { contains: "image/" } } },
    { name: "text", type: "textarea", label: "Chữ", required: true, admin: { rows: 5 } },
    {
      name: "imagePosition",
      type: "select",
      label: "Vị trí ảnh",
      required: true,
      defaultValue: "left",
      options: [
        { label: "Ảnh bên trái", value: "left" },
        { label: "Ảnh bên phải", value: "right" },
      ],
      admin: { description: "Trên điện thoại ảnh luôn nằm trên chữ." },
    },
  ],
};

export const NEWS_CONTENT_BLOCKS: Block[] = [statHighlightsBlock, projectMentionBlock, imageTextBlock];
