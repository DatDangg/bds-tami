import type { CollectionConfig, UploadField, UploadFieldSingleValidation } from "payload";

import { isAdmin } from "../access";
import { validateCoverWhenPublished } from "../fields/cover-image";
import { requiredByLocale } from "../fields/required-by-locale";
import { titleField } from "../fields/title";
import type { RevalidatePaths } from "../hooks/revalidate-content";
import { withContentDefaults } from "./_shared/content-defaults";

const imageUpload = (name: string, validate?: UploadFieldSingleValidation): UploadField => ({
  name,
  type: "upload",
  relationTo: "media",
  filterOptions: { mimeType: { contains: "image/" } },
  validate,
});

/**
 * Dịch vụ (ERD §4.9, FR-PUB-10, FR-ADM-07): Phân phối · Môi giới · Khai thác căn hộ dịch vụ. Khách đọc bản đã xuất bản;
 * CHỈ admin tạo/sửa/xoá (PERMISSION §3.1), nên không có `author`. ERD không có `publishedAt`/`isFeatured` cho dịch vụ.
 * `revalidate` chỉ để test ghi đè.
 */
export function createServices(revalidate?: RevalidatePaths): CollectionConfig {
  return withContentDefaults(
    {
      slug: "services",
      admin: { useAsTitle: "title", defaultColumns: ["title", "status", "sortOrder", "updatedAt"] },
      defaultSort: "sortOrder",
      access: { create: isAdmin, update: isAdmin, delete: isAdmin },
      fields: [
        titleField(),
        imageUpload("icon"),
        // Ảnh thẻ Dịch vụ trên trang chủ (3:4) và hero trang dịch vụ (ERD §4.9): bắt buộc khi xuất bản.
        imageUpload("coverImage", validateCoverWhenPublished("Cần ảnh bìa trước khi xuất bản dịch vụ.")),
        { name: "summary", type: "textarea", localized: true, validate: requiredByLocale("Mô tả ngắn không được để trống.") },
        { name: "content", type: "richText", localized: true },
        { name: "sortOrder", type: "number", defaultValue: 0, index: true },
      ],
    },
    {
      englishRequiredFields: ["title", "slug", "summary", "content"],
      omit: ["author", "isFeatured", "publishedAt"],
      revalidate,
    },
  );
}

export const Services = createServices();
