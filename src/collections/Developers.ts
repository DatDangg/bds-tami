import type { CollectionConfig, TextFieldSingleValidation } from "payload";

import { isAdmin, readUnlessTrashed } from "../access";
import { nameField } from "../fields/name";
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

/**
 * Chủ đầu tư (ERD §4.4, FR-ADM-07). Khách và sale đọc, chỉ admin ghi (PERMISSION §3.2; mở quyền tạo cho sale
 * qua `/change` nếu vướng). `showAsPartner` đưa logo vào khối đối tác trang chủ (FR-PUB-17). Không có status/
 * author/nổi bật/seo/versions: chỉ là danh mục tra cứu.
 */
export const Developers: CollectionConfig = withContentDefaults(
  {
    slug: "developers",
    admin: { useAsTitle: "name", defaultColumns: ["name", "showAsPartner", "sortOrder"] },
    defaultSort: "sortOrder",
    access: { read: readUnlessTrashed, create: isAdmin, update: isAdmin, delete: isAdmin },
    versions: false,
    fields: [
      nameField(),
      {
        name: "logo",
        type: "upload",
        relationTo: "media",
        filterOptions: { mimeType: { contains: "image/" } },
      },
      { name: "description", type: "richText", localized: true },
      { name: "website", type: "text", validate: validateWebsite, admin: { description: "Địa chỉ trang web, bắt đầu bằng https://" } },
      { name: "showAsPartner", type: "checkbox", defaultValue: false, index: true },
      { name: "sortOrder", type: "number", defaultValue: 0, index: true },
    ],
  },
  {
    slugSource: "name",
    englishRequiredFields: ["name", "slug"],
    route: null,
    omit: ["status", "publishedAt", "author", "isFeatured", "seo"],
  },
);
