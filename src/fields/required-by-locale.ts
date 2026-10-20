import type { Field, PayloadRequest } from "payload";

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

/** Lớp CSS đánh dấu trường bắt buộc theo ngôn ngữ: `_forms.scss` vẽ dấu * sau nhãn (BL-042), vì validate tự viết không bật `required` của Payload. */
export const REQUIRED_MARK_CLASS = "tami-required";

/**
 * Thêm dấu * cạnh nhãn cho trường dùng `requiredByLocale`/validate bắt buộc. Chỉ đổi `admin.className`: KHÔNG chuyển sang `required: true`
 * (sẽ thành NOT NULL ở DB và chặn sửa bản `en` dở dang). Dấu * hiện ở cả bản `en` dù chỉ bắt buộc khi đã bật "Có bản tiếng Anh".
 */
export function markRequired<T extends Field>(field: T): T {
  const admin = (field as { admin?: { className?: string } }).admin;
  const className = [admin?.className, REQUIRED_MARK_CLASS].filter(Boolean).join(" ");
  return { ...field, admin: { ...admin, className } } as T;
}
