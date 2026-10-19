import type { CollectionConfig } from "payload";

import { denyAll, isAdmin, readUnlessTrashed } from "../access";
import { nameField } from "../fields/name";
import { guardCategoryHardDelete, guardCategorySoftDelete } from "../hooks/categories/guard-delete";
import { createRevalidateCategory } from "../hooks/categories/revalidate-category";
import { CATEGORY_SCOPE_LABELS, CATEGORY_SCOPES } from "../hooks/categories/scope-collections";
import { lockCategoryScope } from "../hooks/categories/lock-scope";
import { validateCategoryTree } from "../hooks/categories/validate-tree";
import type { RevalidatePaths } from "../hooks/revalidate-content";
import { collectionLabels } from "../lib/admin/collection-labels";
import { withContentDefaults } from "./_shared/content-defaults";

/**
 * Danh mục riêng từng loại nội dung (ERD §4.3, FR-ADM-06), tối đa 2 cấp. Khách/sale đọc, chỉ admin ghi
 * (PERMISSION §3.2). Slug duy nhất theo (`_locale`, `scope`, `slug`). `scope` không đổi sau khi tạo: đổi scope
 * sẽ làm lệch cha–con và nội dung đang dùng. Không có status/author/nổi bật nên bỏ các trường đó và versions.
 */
export function createCategories(revalidate?: RevalidatePaths): CollectionConfig {
  const revalidation = createRevalidateCategory(revalidate);
  return withContentDefaults(
    {
      slug: "categories",
      labels: collectionLabels("categories"),
      admin: {
        useAsTitle: "name",
        defaultColumns: ["name", "scope", "parent", "sortOrder"],
        description: "Danh mục riêng cho từng loại nội dung (dự án, cho thuê, tin BĐS, tin tức, tuyển dụng), tối đa 2 cấp.",
      },
      defaultSort: "sortOrder",
      access: { read: readUnlessTrashed, create: isAdmin, update: isAdmin, delete: isAdmin },
      versions: false,
      // Nhân bản làm Payload thêm " - Copy" vào mọi locale của trường `unique` (kể cả `scopeSlug`) và copy nguyên
      // slug các locale còn lại → trùng (_locale, scope, slug) mà DB không bắt. Danh mục nền ít khi cần nhân bản.
      disableDuplicate: true,
      hooks: {
        beforeValidate: [lockCategoryScope, validateCategoryTree, guardCategorySoftDelete],
        afterChange: [revalidation.afterChange],
        afterDelete: [revalidation.afterDelete],
        beforeDelete: [guardCategoryHardDelete],
      },
      fields: [
        nameField(),
        {
          name: "scope",
          type: "select",
          label: "Loại nội dung",
          required: true,
          index: true,
          options: CATEGORY_SCOPES.map((value) => ({ label: CATEGORY_SCOPE_LABELS[value], value })),
          // Chỉ chọn lúc tạo; sửa sau đó bị bỏ qua (xem chú thích collection).
          access: { update: denyAll },
          admin: { position: "sidebar" },
        },
        {
          name: "parent",
          type: "relationship",
          label: "Danh mục cha",
          relationTo: "categories",
          index: true,
          // Gợi ý trong admin: cùng scope, chỉ danh mục gốc (cấp 1). Quy tắc thật nằm ở `validateCategoryTree`.
          filterOptions: ({ data }) => ({ scope: { equals: data?.scope }, parent: { exists: false } }),
          admin: { position: "sidebar" },
        },
        { name: "description", type: "textarea", label: "Mô tả", localized: true },
        { name: "sortOrder", type: "number", label: "Thứ tự hiển thị", defaultValue: 0, index: true, admin: { position: "sidebar" } },
      ],
    },
    {
      slugSource: "name",
      scopeField: "scope",
      englishRequiredFields: ["name", "slug"],
      route: null,
      omit: ["status", "publishedAt", "author", "isFeatured"],
    },
  );
}

export const Categories = createCategories();
