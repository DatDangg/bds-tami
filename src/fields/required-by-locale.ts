import type { PayloadRequest } from "payload";

import { defaultLocale } from "../i18n/routing";
import { isFilled } from "../hooks/require-english-fields";

interface ValidateOptions {
  req: PayloadRequest;
  data?: unknown;
}

/**
 * Trường "R" của ERD §1.1: bắt buộc ở bản `vi`; bản `en` chỉ bắt buộc khi `hasEnglish = true`. Dùng thay cho `required: true`
 * của Payload (bắt buộc ở MỌI locale đang lưu nên chặn sửa bản `en` dở dang). Giá trị coi là "đã nhập" như hook `hasEnglish`.
 */
export function requiredByLocale(message: string) {
  return (value: unknown, { req, data }: ValidateOptions): true | string => {
    if (isFilled(value)) return true;
    const hasEnglish = (data as { hasEnglish?: boolean } | undefined)?.hasEnglish === true;
    return req.locale === defaultLocale || hasEnglish ? message : true;
  };
}
