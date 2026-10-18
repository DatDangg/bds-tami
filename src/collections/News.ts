import type { CollectionConfig } from "payload";

import { validateCoverWhenPublished } from "../fields/cover-image";
import { requiredByLocale } from "../fields/required-by-locale";
import { scopedCategoryField } from "../fields/scoped-category";
import { titleField } from "../fields/title";
import type { RevalidatePaths } from "../hooks/revalidate-content";
import { withContentDefaults } from "./_shared/content-defaults";

/**
 * Tin tức (ERD §4.8, FR-ADM-04): sale tạo và sửa/xoá mềm bài của mình, admin sửa mọi bài và là người duy nhất xoá hẳn/khôi phục
 * (PERMISSION §3.1; access mặc định của `withContentDefaults`). `category` thuộc scope `news`. Không có quan hệ tới `leads`
 * (BR-04: tin tức không thu lead). `revalidate` chỉ để test ghi đè.
 */
export function createNews(revalidate?: RevalidatePaths): CollectionConfig {
  return withContentDefaults(
    {
      slug: "news",
      admin: { useAsTitle: "title", defaultColumns: ["title", "category", "status", "publishedAt", "author"] },
      defaultSort: "-publishedAt",
      fields: [
        titleField(),
        scopedCategoryField("news"),
        {
          name: "cover",
          type: "upload",
          relationTo: "media",
          filterOptions: { mimeType: { contains: "image/" } },
          // Ảnh bìa là ảnh thẻ trong danh sách và hero bài viết (ERD §4.8): bắt buộc khi xuất bản.
          validate: validateCoverWhenPublished("Cần ảnh bìa trước khi xuất bản tin tức."),
        },
        { name: "excerpt", type: "textarea", localized: true, validate: requiredByLocale("Tóm tắt không được để trống.") },
        { name: "content", type: "richText", localized: true, validate: requiredByLocale("Nội dung không được để trống.") },
        { name: "tags", type: "text", hasMany: true },
      ],
    },
    { englishRequiredFields: ["title", "slug", "excerpt", "content"], revalidate },
  );
}

export const News = createNews();
