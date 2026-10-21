import type { TextField } from "payload";

import { markRequired, requiredByLocale } from "./required-by-locale";

/** Chữ gợi ý ô "Mô tả ngắn"/"Tóm tắt" dùng chung (BL-042). */
export const SUMMARY_PLACEHOLDER = "1–2 câu giới thiệu, hiện ở thẻ và kết quả Google";

export interface TitleFieldOptions {
  /** Chữ gợi ý khi ô trống, theo collection (vd "VD: Vinhomes Grand Park"). */
  placeholder?: string;
}

/** Trường `title` (localized) của nội dung: nguồn sinh `slug`; bắt buộc ở `vi`, ở `en` khi `hasEnglish` (ERD §1.1). */
export function titleField({ placeholder = "Nhập tiêu đề" }: TitleFieldOptions = {}): TextField {
  return markRequired({
    name: "title",
    type: "text",
    label: "Tiêu đề",
    localized: true,
    validate: requiredByLocale("Tiêu đề không được để trống."),
    // Giữ link sửa bản ghi ở cột tiêu đề khi cột đầu là ảnh đại diện (BL-015 T05).
    admin: { placeholder, components: { Cell: "/components/admin/TitleLinkCell#TitleLinkCell" } },
  } satisfies TextField);
}
