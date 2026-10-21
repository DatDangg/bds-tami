import { randomUUID } from "node:crypto";
import { fileTypeFromBuffer } from "file-type";
import { APIError } from "payload";
import type { CollectionBeforeOperationHook } from "payload";

import { ORIGINAL_UPLOAD_NAME_KEY } from "./alt-from-filename";

const MB = 1024 * 1024;

interface AllowedType {
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

/**
 * CV ứng viên: PDF/DOC/DOCX ≤ 5MB (ERD §4.11). `.doc` cũ nhận diện là `application/x-cfb` (OLE2);
 * định dạng này cũng gồm .xls/.ppt, không thể tách bằng magic bytes. Chấp nhận có chủ đích vì file nằm
 * ở bucket private và chỉ tải về dạng attachment.
 */
export const PRIVATE_FILE_POLICY: UploadPolicy = {
  "application/pdf": { extension: "pdf", maxBytes: 5 * MB },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { extension: "docx", maxBytes: 5 * MB },
  "application/x-cfb": { extension: "doc", maxBytes: 5 * MB, storedMime: "application/msword" },
};

/** Trần dung lượng một request upload cho Payload (busboy cắt và trả 413 khi vượt). */
export const MAX_UPLOAD_BYTES = 20 * MB;

export interface InspectedUpload {
  mime: string;
  extension: string;
}

const HTTP_BAD_REQUEST = 400;
const HTTP_PAYLOAD_TOO_LARGE = 413;
const HTTP_UNSUPPORTED_MEDIA_TYPE = 415;

/** `isPublic: true` để thông báo hiện cho người dùng; mã 413/415 theo AC task media. */
function reject(message: string, status: number): never {
  throw new APIError(message, status, undefined, true);
}

/** Nhận diện kiểu file bằng nội dung, rồi kiểm tra danh sách cho phép + dung lượng của kiểu đó. */
export async function inspectUpload(data: Uint8Array, policy: UploadPolicy): Promise<InspectedUpload> {
  if (data.byteLength === 0) reject("File rỗng.", HTTP_BAD_REQUEST);
  const detected = await fileTypeFromBuffer(data);
  const rule = detected ? policy[detected.mime] : undefined;
  if (!detected || !rule) reject("Định dạng file không được hỗ trợ.", HTTP_UNSUPPORTED_MEDIA_TYPE);
  if (data.byteLength > rule.maxBytes) {
    reject(`File vượt quá ${Math.floor(rule.maxBytes / MB)}MB.`, HTTP_PAYLOAD_TOO_LARGE);
  }
  return { mime: rule.storedMime ?? detected.mime, extension: rule.extension };
}

/**
 * Chặn upload sai ngay trước khi Payload xử lý file: kiểm bằng nội dung, rồi GHI ĐÈ tên (UUID ngẫu nhiên,
 * đuôi theo nội dung) và MIME trên `req.file`, nên Content-Type/đuôi do client gửi không bao giờ được lưu.
 * Tạo mới bắt buộc có file thật: chặn đường tạo bằng `data.url` (Payload tải URL ngoài sau bước này).
 */
export function createUploadGuard(policy: UploadPolicy): CollectionBeforeOperationHook {
  return async ({ args, operation }) => {
    if (operation !== "create" && operation !== "update") return args;
    const file = args.req.file;
    if (!file) {
      if (operation === "create" && !("duplicateFromID" in args && args.duplicateFromID)) {
        reject("Thiếu file upload.", HTTP_BAD_REQUEST);
      }
      return args;
    }
    const { mime, extension } = await inspectUpload(file.data, policy);
    // Tên người dùng đặt chỉ để hook `fillImageAlt` (chạy sau bước đổi tên này) dựng alt; không bao giờ được lưu làm tên file.
    args.req.context[ORIGINAL_UPLOAD_NAME_KEY] = file.name;
    file.name = `${randomUUID()}.${extension}`;
    file.mimetype = mime;
    return args;
  };
}
