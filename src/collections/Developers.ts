import type { CollectionConfig, TextFieldSingleValidation } from "payload";

import { isAdmin, readUnlessTrashed } from "../access";
import { nameField } from "../fields/name";
import { createRevalidateDeveloper } from "../hooks/developers/revalidate-developer";
import { collectionLabels } from "../lib/admin/collection-labels";
import { withContentDefaults } from "./_shared/content-defaults";

/** Chỉ nhận http(s): khối đối tác render giá trị này thành liên kết, nên chặn `javascript:` và tương tự. */
const validateWebsite: TextFieldSingleValidation = (value) => {
  if (typeof value !== "string" || value.trim() === "") return true;
  try {
    const { protocol } = new URL(value.trim());
    return protocol === "http:" || protocol === "https:" ? true : "Địa chỉ web phải bắt đầu bằng http:// hoặc https://";
  } catch {
    return "Địa chỉ web không hợp lệ.";
  }
};

const revalidation = createRevalidateDeveloper();

/**
 * Chủ đầu tư (ERD §4.4, FR-ADM-07). Khách và sale đọc, chỉ admin ghi (PERMISSION §3.2; mở quyền tạo cho sale
 * qua `/change` nếu vướng). `showAsPartner` đưa logo vào khối đối tác trang chủ (FR-PUB-17). Không có status/
 * author/nổi bật/seo/versions: chỉ là danh mục tra cứu.
 */
export const Developers: CollectionConfig = withContentDefaults(
  {
    slug: "developers",
    labels: collectionLabels("developers"),
    admin: {
      useAsTitle: "name",
      defaultColumns: ["name", "showAsPartner", "sortOrder"],
      description: "Chủ đầu tư của dự án; bật \"Hiện ở khối đối tác\" để đưa logo lên trang chủ.",
    },
    defaultSort: "sortOrder",
    access: { read: readUnlessTrashed, create: isAdmin, update: isAdmin, delete: isAdmin },
    versions: false,
    hooks: { afterChange: [revalidation.afterChange], afterDelete: [revalidation.afterDelete] },
    fields: [
      nameField(),
      {
        name: "logo",
        type: "upload",
        label: "Logo",
        relationTo: "media",
        filterOptions: { mimeType: { contains: "image/" } },
      },
      { name: "description", type: "richText", label: "Giới thiệu", localized: true },
      { name: "website", type: "text", label: "Trang web", validate: validateWebsite, admin: { description: "Địa chỉ trang web, bắt đầu bằng https://" } },
      { name: "showAsPartner", type: "checkbox", label: "Hiện ở khối đối tác trang chủ", defaultValue: false, index: true },
      { name: "sortOrder", type: "number", label: "Thứ tự hiển thị", defaultValue: 0, index: true },
    ],
  },
  {
    slugSource: "name",
    englishRequiredFields: ["name", "slug"],
    route: null,
    omit: ["status", "publishedAt", "author", "isFeatured", "seo"],
  },
);
