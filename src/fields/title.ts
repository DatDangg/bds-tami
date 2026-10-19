import type { TextField } from "payload";

import { requiredByLocale } from "./required-by-locale";

/** Trường `title` (localized) của nội dung: nguồn sinh `slug`; bắt buộc ở `vi`, ở `en` khi `hasEnglish` (ERD §1.1). */
export function titleField(): TextField {
  return {
    name: "title",
    type: "text",
    label: "Tiêu đề",
    localized: true,
    validate: requiredByLocale("Tiêu đề không được để trống."),
    // Giữ link sửa bản ghi ở cột tiêu đề khi cột đầu là ảnh đại diện (BL-015 T05).
    admin: { components: { Cell: "/components/admin/TitleLinkCell#TitleLinkCell" } },
  };
}
