import { ValidationError } from "payload";
import type { PayloadRequest } from "payload";

export interface ViFieldError {
  path: string;
  message: string;
}

interface ViValidationErrorInput {
  collection: string;
  errors: ViFieldError[];
  req?: Pick<PayloadRequest, "t">;
}

/**
 * Toast = lý do tiếng Việt. Lỗi cùng lý do gộp một câu kèm danh sách trường (nếu > 1 trường); không đứng một mình tên path kỹ thuật.
 */
function buildToastMessage(errors: ViFieldError[]): string {
  if (errors.length === 0) return "Dữ liệu không hợp lệ.";
  const pathsByMessage = new Map<string, string[]>();
  for (const { path, message } of errors) {
    pathsByMessage.set(message, [...(pathsByMessage.get(message) ?? []), path]);
  }
  return [...pathsByMessage]
    .map(([message, paths]) => (paths.length > 1 ? `${message} (${paths.join(", ")})` : message))
    .join(" ");
}

/**
 * `ValidationError` của Payload tự ghép tiền tố tiếng Anh "The following field is invalid: <path>" khi không có `t`, và toast
 * chỉ hiện đúng `message` đó (không có lý do). Vẫn trả instance `ValidationError` với `data.errors` nguyên shape (code khác
 * bắt `instanceof` / đọc `data.errors[].path`), chỉ thay `message` bằng lý do tiếng Việt; không phụ thuộc `req.t`.
 */
export function createViValidationError({ collection, errors, req }: ViValidationErrorInput): ValidationError {
  const error = new ValidationError({ collection, errors }, req?.t);
  error.message = buildToastMessage(errors);
  return error;
}
