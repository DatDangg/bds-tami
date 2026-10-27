import { randomUUID } from "node:crypto";
import { fileTypeFromBuffer } from "file-type";
import { APIError } from "payload";
import type { CollectionBeforeOperationHook } from "payload";

import { ORIGINAL_UPLOAD_NAME_KEY } from "./alt-from-filename";
import { MAX_UPLOAD_BYTES, MB, MEDIA_POLICY, type UploadPolicy } from "./media-limits";

export { MAX_UPLOAD_BYTES, MEDIA_POLICY };
export type { UploadPolicy };

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

export interface InspectedUpload {
  mime: string;
  extension: string;
}

const HTTP_BAD_REQUEST = 400;
const HTTP_PAYLOAD_TOO_LARGE = 413;
const HTTP_UNSUPPORTED_MEDIA_TYPE = 415;

/** `isPublic: true` để thông báo hiện cho người dùng; mã 413/415 theo AC task media. */
function reject(message: string, status: number): never {
  const error = new APIError(message, status, undefined, true);
  // Build production minify làm `constructor.name` rỗng → payload `formatErrors` rơi về "An unknown error occurred.".
  error.name = "APIError";
  throw error;
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
