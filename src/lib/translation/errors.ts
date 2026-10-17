/**
 * Mã lỗi dịch. `translation.lastError` (đọc công khai theo PERMISSION §4) chỉ được lưu đúng `code` hoặc `message` dưới đây:
 * không bao giờ lưu thông điệp/stack/header/endpoint/body của provider (có thể chứa API key hoặc nội dung bài).
 */
export const TRANSLATION_ERROR_MESSAGES = {
  not_allowed: "Collection hoặc trường này không được phép gửi đi dịch",
  not_configured: "Chưa cấu hình dịch AI (thiếu khoá API)",
  budget_exceeded: "Đã vượt hạn mức chi phí dịch của tháng",
  rate_limited: "Dịch vụ dịch đang giới hạn tần suất, thử lại sau",
  auth_failed: "Khoá API dịch không hợp lệ",
  bad_request: "Dịch vụ dịch từ chối yêu cầu",
  provider_unavailable: "Dịch vụ dịch tạm thời không khả dụng",
  invalid_input: "Nội dung nguồn không hợp lệ để dịch",
  invalid_output: "Kết quả dịch không hợp lệ",
  refused: "Dịch vụ dịch từ chối xử lý nội dung này",
  truncated: "Kết quả dịch bị cắt cụt do quá dài",
} as const;

export type TranslationErrorCode = keyof typeof TRANSLATION_ERROR_MESSAGES;

/** Lỗi dịch đã lọc: `message` luôn là chuỗi cố định theo `code`, không bao giờ nhúng dữ liệu bên ngoài. */
export class TranslationError extends Error {
  constructor(readonly code: TranslationErrorCode) {
    super(TRANSLATION_ERROR_MESSAGES[code]);
    this.name = "TranslationError";
  }
}

/** Giá trị an toàn để ghi vào `translation.lastError` cho MỌI loại lỗi (lỗi lạ -> `provider_unavailable`, không lộ chi tiết). */
export function toLastError(error: unknown): TranslationErrorCode {
  return error instanceof TranslationError ? error.code : "provider_unavailable";
}
