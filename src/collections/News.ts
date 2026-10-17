import type { CollectionConfig, UploadFieldSingleValidation } from "payload";
import { upload } from "payload/shared";

import { requiredByLocale } from "../fields/required-by-locale";
import { scopedCategoryField } from "../fields/scoped-category";
import { titleField } from "../fields/title";
import type { RevalidatePaths } from "../hooks/revalidate-content";
import { withContentDefaults } from "./_shared/content-defaults";

/**
 * Ảnh bìa là ảnh thẻ trong danh sách và hero bài viết, nên bắt buộc khi xuất bản (ERD §4.8); bản nháp được thiếu ảnh để sale
 * lưu dở. `data` của lần sửa một phần có thể thiếu `cover` dù bản đã lưu có, nên giá trị đã lưu (`previousValue`) cũng được tính.
 * Chạy validator `upload` mặc định của Payload trước (chỉ nhận ảnh qua `filterOptions`, id sai → 400): validator tuỳ biến thay hẳn bản mặc định.
 */
const validateCover: UploadFieldSingleValidation = async (value, options) => {
  const base = await upload(value, options);
  if (base !== true) return base;
  const { data, previousValue } = options;
  const publishing = (data as { status?: string } | undefined)?.status === "published";
  const hasImage = value != null || (value === undefined && previousValue != null);
  return publishing && !hasImage ? "Cần ảnh bìa trước khi xuất bản tin tức." : true;
};

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
          validate: validateCover,
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
