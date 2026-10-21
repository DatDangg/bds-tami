import type { CollectionBeforeValidateHook } from "payload";

import { altFromFilename, ORIGINAL_UPLOAD_NAME_KEY } from "../../lib/upload/alt-from-filename";

/**
 * Ảnh tải lên mà ô mô tả (alt) để trống → điền từ tên file gốc (BL-042 #16) thay vì chặn lưu. Chỉ khi có file vừa tải
 * (create, hoặc update thay file): sửa metadata của ảnh cũ vẫn để validator `alt` báo lỗi. Ảnh đã có alt, PDF, video giữ nguyên.
 */
export const fillImageAlt: CollectionBeforeValidateHook = ({ data, req }) => {
  if (!data) return data;
  const mimeType: unknown = data.mimeType;
  if (typeof mimeType !== "string" || !mimeType.startsWith("image/")) return data;
  const alt: unknown = data.alt;
  if (typeof alt === "string" && alt.trim() !== "") return data;
  const originalName: unknown = req.context?.[ORIGINAL_UPLOAD_NAME_KEY];
  if (originalName === undefined) return data;
  data.alt = altFromFilename(originalName);
  return data;
};
