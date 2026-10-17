import type { TextField, TextFieldSingleValidation } from "payload";

import { defaultLocale } from "../i18n/routing";

/** Bản `vi` luôn bắt buộc; bản `en` chỉ bắt buộc khi đã bật `hasEnglish` (ERD §1.1), giống `slug`. */
const validateName: TextFieldSingleValidation = (value, { req, data }) => {
  if (typeof value === "string" && value.trim() !== "") return true;
  const hasEnglish = (data as { hasEnglish?: boolean } | undefined)?.hasEnglish === true;
  return req.locale === defaultLocale || hasEnglish ? "Tên không được để trống." : true;
};

/** Trường `name` (localized) của danh mục nền / chủ đầu tư: nguồn sinh `slug`. */
export function nameField(): TextField {
  return { name: "name", type: "text", localized: true, validate: validateName };
}
