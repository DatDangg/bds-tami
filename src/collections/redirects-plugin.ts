import { redirectsPlugin } from "@payloadcms/plugin-redirects";
import type { Field } from "payload";

import { isAdmin, ROLES } from "../access";
import { collectionLabels } from "../lib/admin/collection-labels";
import { isSafeInternalPath } from "../lib/content/internal-path";

const validateSitePath = (value: string | null | undefined): true | string =>
  isSafeInternalPath(value) ? true : "Nhập đường dẫn bắt đầu bằng một dấu / (vd /tin-tuc/bai-viet).";

/**
 * `redirects` (ERD §4.13, BR-05): plugin chính thức cung cấp collection; ở đây thu hẹp theo nghiệp vụ.
 * - `from`/`to` là đường dẫn công khai đầy đủ theo ngôn ngữ (`/en/news/old` → `/en/news/new`); `to` là chuỗi, không phải
 *   quan hệ tới bản ghi (slug nội dung là theo từng ngôn ngữ nên reference không dùng được).
 * - Chỉ 301. Chỉ admin xem/sửa: hook đổi slug và `proxy.ts` ghi/đọc bằng Local API (`overrideAccess`).
 */
export function contentRedirectsPlugin() {
  return redirectsPlugin({
    redirectTypes: ["301"],
    redirectTypeFieldOverride: { defaultValue: "301" },
    overrides: {
      labels: collectionLabels("redirects"),
      admin: {
        hideAPIURL: true,
        useAsTitle: "from",
        defaultColumns: ["from", "to", "createdAt"],
        hidden: ({ user }) => user?.role !== ROLES.admin,
        description: "Tự chuyển khách từ đường dẫn cũ sang đường dẫn mới (tạo tự động khi đổi đường dẫn trang; có thể sửa tay).",
      },
      access: { read: isAdmin, create: isAdmin, update: isAdmin, delete: isAdmin },
      fields: ({ defaultFields }) =>
        defaultFields.map((field: Field): Field => {
          if (!("name" in field)) return field;
          if (field.name === "from") return { ...field, label: "Đường dẫn cũ", validate: validateSitePath } as Field;
          if (field.name === "to") return {
              name: "to",
              type: "text",
              label: "Chuyển đến",
              required: true,
              validate: (value: string | null | undefined, { siblingData }: { siblingData: { from?: string } }) =>
                value !== undefined && value === siblingData?.from ? "Đích chuyển hướng không được trùng đường dẫn nguồn." : validateSitePath(value),
            };
          if (field.name === "type") return { ...field, label: "Loại chuyển hướng", options: [{ label: "301 (vĩnh viễn)", value: "301" }] } as Field;
          return field;
        }),
    },
  });
}
