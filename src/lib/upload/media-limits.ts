/**
 * Giới hạn upload dùng chung server (`validate-file.ts`) và client (`UploadSizeGuard`).
 * Cố ý KHÔNG import gì từ Node/payload để bundle trình duyệt nhúng được: một nguồn sự thật cho dung lượng.
 */
export const MB = 1024 * 1024;

export interface AllowedType {
  /** Đuôi file lưu trữ: lấy theo nội dung đã nhận diện, không theo tên khách gửi. */
  extension: string;
  maxBytes: number;
  /** MIME ghi vào DB và gửi kèm S3; khác MIME nhận diện khi định dạng có nhiều MIME. */
  storedMime?: string;
}

/** Chính sách theo MIME THẬT (nhận diện bằng magic bytes). Thiếu trong bảng = từ chối. */
export type UploadPolicy = Readonly<Record<string, AllowedType>>;

/** ERD §4.12. SVG/HTML không có trong bảng nên luôn bị từ chối (chống XSS). */
export const MEDIA_POLICY: UploadPolicy = {
  "image/jpeg": { extension: "jpg", maxBytes: 10 * MB },
  "image/png": { extension: "png", maxBytes: 10 * MB },
  "image/webp": { extension: "webp", maxBytes: 10 * MB },
  "image/avif": { extension: "avif", maxBytes: 10 * MB },
  "application/pdf": { extension: "pdf", maxBytes: 20 * MB },
  "video/mp4": { extension: "mp4", maxBytes: 15 * MB },
  "video/webm": { extension: "webm", maxBytes: 15 * MB },
};

/** Trần dung lượng một request upload cho Payload (busboy cắt và trả 413 khi vượt). */
export const MAX_UPLOAD_BYTES = 20 * MB;
