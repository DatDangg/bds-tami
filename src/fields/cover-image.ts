import type { UploadFieldSingleValidation } from "payload";
import { upload } from "payload/shared";

/**
 * Ảnh bìa/đại diện bắt buộc khi xuất bản, bản nháp được thiếu để sale lưu dở (ERD §4.7-§4.9). `data` của lần sửa một phần có thể
 * thiếu trường dù bản đã lưu có, nên giá trị đã lưu (`previousValue`) cũng được tính. Chạy validator `upload` mặc định của Payload
 * trước: validator tuỳ biến thay hẳn bản mặc định, nếu không gọi thì `filterOptions` (chỉ nhận ảnh) và kiểm id hợp lệ (id sai → 400,
 * không phải 500) không còn áp ở server.
 */
export function validateCoverWhenPublished(missingMessage: string): UploadFieldSingleValidation {
  return async (value, options) => {
    const base = await upload(value, options);
    if (base !== true) return base;
    const { data, previousValue } = options;
    const publishing = (data as { status?: string } | undefined)?.status === "published";
    const hasImage = value != null || (value === undefined && previousValue != null);
    return publishing && !hasImage ? missingMessage : true;
  };
}
