import type { CollectionConfig, UploadField, UploadFieldSingleValidation } from "payload";

import { isAdmin } from "../access";
import { validateCoverWhenPublished } from "../fields/cover-image";
import { requiredByLocale } from "../fields/required-by-locale";
import { titleField } from "../fields/title";
import { createRevalidateHomepageOnService } from "../hooks/homepage/revalidate-homepage-on-service";
import type { RevalidatePaths } from "../hooks/revalidate-content";
import type { RevalidateTags } from "../hooks/revalidate-global";
import { collectionLabels } from "../lib/admin/collection-labels";
import { formTabs } from "../lib/admin/form-layout";
import { withContentDefaults } from "./_shared/content-defaults";

const imageUpload = (name: string, label: string, validate?: UploadFieldSingleValidation): UploadField => ({
  name,
  type: "upload",
  label,
  relationTo: "media",
  filterOptions: { mimeType: { contains: "image/" } },
  validate,
});

/**
 * Dịch vụ (ERD §4.9, FR-PUB-10, FR-ADM-07): Phân phối · Môi giới · Khai thác căn hộ dịch vụ. Khách đọc bản đã xuất bản;
 * CHỈ admin tạo/sửa/xoá (PERMISSION §3.1), nên không có `author`. ERD không có `publishedAt`/`isFeatured` cho dịch vụ.
 * `revalidate` chỉ để test ghi đè.
 */
export function createServices(revalidate?: RevalidatePaths, revalidateTags?: RevalidateTags): CollectionConfig {
  const revalidateHomepage = createRevalidateHomepageOnService({ paths: revalidate, tags: revalidateTags });
  return withContentDefaults(
    {
      slug: "services",
      labels: collectionLabels("services"),
      admin: {
        useAsTitle: "title",
        defaultColumns: ["title", "status", "sortOrder", "updatedAt"],
        description: "Các dịch vụ công ty cung cấp (phân phối, môi giới, khai thác căn hộ dịch vụ); chỉ admin sửa.",
      },
      defaultSort: "sortOrder",
      access: { create: isAdmin, update: isAdmin, delete: isAdmin },
      hooks: { afterChange: [revalidateHomepage.afterChange], afterDelete: [revalidateHomepage.afterDelete] },
      fields: [
        formTabs([
          {
            label: "Nội dung",
            fields: [
              titleField(),
              { name: "summary", type: "textarea", label: "Mô tả ngắn", localized: true, validate: requiredByLocale("Mô tả ngắn không được để trống.") },
              { name: "content", type: "richText", label: "Nội dung", localized: true },
              { name: "sortOrder", type: "number", label: "Thứ tự hiển thị", defaultValue: 0, index: true },
            ],
          },
          {
            label: "Hình ảnh",
            fields: [
              imageUpload("icon", "Icon"),
              // Ảnh thẻ Dịch vụ trên trang chủ (3:4) và hero trang dịch vụ (ERD §4.9): bắt buộc khi xuất bản.
              imageUpload("coverImage", "Ảnh bìa", validateCoverWhenPublished("Cần ảnh bìa trước khi xuất bản dịch vụ.")),
            ],
          },
        ]),
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
