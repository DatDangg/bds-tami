import type { TextField } from "payload";

import { requiredByLocale } from "./required-by-locale";

/** Trường `title` (localized) của nội dung: nguồn sinh `slug`; bắt buộc ở `vi`, ở `en` khi `hasEnglish` (ERD §1.1). */
export function titleField(): TextField {
  return { name: "title", type: "text", localized: true, validate: requiredByLocale("Tiêu đề không được để trống.") };
}
