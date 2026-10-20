import type { CollectionConfig } from "payload";

import { validateCoverWhenPublished } from "../fields/cover-image";
import { requiredByLocale } from "../fields/required-by-locale";
import { scopedCategoryField } from "../fields/scoped-category";
import { titleField } from "../fields/title";
import { createRevalidateHomepageOnListing } from "../hooks/homepage/revalidate-homepage-on-service";
import type { RevalidatePaths } from "../hooks/revalidate-content";
import { collectionLabels } from "../lib/admin/collection-labels";
import { formTabs } from "../lib/admin/form-layout";
import { hideTechnicalListFields } from "../lib/admin/list-filter";
import { withContentDefaults } from "./_shared/content-defaults";

/**
 * Tin tức (ERD §4.8, FR-ADM-04): sale tạo và sửa/xoá mềm bài của mình, admin sửa mọi bài và là người duy nhất xoá hẳn/khôi phục
 * (PERMISSION §3.1; access mặc định của `withContentDefaults`). `category` thuộc scope `news`. Không có quan hệ tới `leads`
 * (BR-04: tin tức không thu lead). `revalidate` chỉ để test ghi đè.
 */
export function createNews(revalidate?: RevalidatePaths): CollectionConfig {
  const revalidateHomepage = createRevalidateHomepageOnListing({ paths: revalidate });
  const collection = withContentDefaults(
    {
      slug: "news",
      labels: collectionLabels("news"),
      admin: {
        useAsTitle: "title",
        defaultColumns: ["cover", "title", "category", "status", "publishedAt", "author"],
        description: "Bài viết tin tức, kiến thức thị trường; không thu lead.",
      },
      defaultSort: "-publishedAt",
      hooks: { afterChange: [revalidateHomepage.afterChange], afterDelete: [revalidateHomepage.afterDelete] },
      fields: [
        formTabs([
          {
            label: "Nội dung",
            fields: [
              titleField(),
              scopedCategoryField("news"),
              { name: "excerpt", type: "textarea", label: "Tóm tắt", localized: true, validate: requiredByLocale("Tóm tắt không được để trống.") },
              { name: "content", type: "richText", label: "Nội dung", localized: true, validate: requiredByLocale("Nội dung không được để trống.") },
              { name: "tags", type: "text", label: "Thẻ (tag)", hasMany: true },
            ],
          },
          {
            label: "Hình ảnh",
            fields: [
              {
                name: "cover",
                type: "upload",
                label: "Ảnh bìa",
                relationTo: "media",
                filterOptions: { mimeType: { contains: "image/" } },
                // Ảnh bìa là ảnh thẻ trong danh sách và hero bài viết (ERD §4.8): bắt buộc khi xuất bản.
                validate: validateCoverWhenPublished("Cần ảnh bìa trước khi xuất bản tin tức."),
                admin: { components: { Cell: "/components/admin/ThumbnailCell#ThumbnailCell" } },
              },
            ],
          },
        ]),
      ],
    },
    { englishRequiredFields: ["title", "slug", "excerpt", "content"], revalidate },
  );
  // Chỉ để lại trường nghiệp vụ trong "Thêm bộ lọc" (BL-021 #06): tags ẩn thêm ngoài quy tắc theo kiểu trường + SEO/bản dịch/slug.
  return hideTechnicalListFields(collection, ["tags"]);
}

export const News = createNews();
