import type { CollectionConfig } from "payload";

import { denyAll, isAdmin, ROLES } from "../access";
import { deleteObjectBeforeDelete } from "../hooks/private-files/delete-object-before-delete";
import { createUploadGuard, PRIVATE_FILE_POLICY } from "../lib/upload/validate-file";

/** Cả MIME nhận diện (vd `application/x-cfb`) lẫn MIME lưu (`application/msword`): guard ghi đè `mimetype` sang MIME lưu trước khi Payload kiểm `mimeType`. */
const ALLOWED_MIME_TYPES = Object.entries(PRIVATE_FILE_POLICY).flatMap(([detected, rule]) =>
  rule.storedMime ? [detected, rule.storedMime] : [detected],
);

/**
 * CHỈ chứa CV ứng viên (bucket `private`, ERD §4.12; quyết định 2026-10-18: không lưu file nội bộ ở đây). Chỉ admin đọc/xoá; khách/sale không đọc được.
 * Không ai tạo/sửa được qua REST/admin (kể cả admin): chỉ Local API `overrideAccess` của endpoint nộp CV. Nhờ vậy job `data-retention`
 * dọn "CV mồ côi" (không hồ sơ nào trỏ tới) không bao giờ xoá nhầm file admin tự upload.
 * Không có URL công khai: plugin S3 được cấu hình `disablePayloadAccessControl` + `generateFileURL` rỗng
 * nên Payload không đăng ký route phục vụ file; tải về chỉ qua endpoint có kiểm quyền + audit (task CV).
 * Ứng viên nộp CV qua endpoint công khai dùng Local API (`overrideAccess`), vẫn qua `createUploadGuard`.
 */
export const PrivateFiles: CollectionConfig = {
  slug: "private-files",
  admin: { hidden: ({ user }) => user?.role !== ROLES.admin, defaultColumns: ["filename", "mimeType", "createdAt"] },
  access: {
    read: isAdmin,
    create: denyAll,
    update: denyAll,
    delete: isAdmin,
  },
  disableDuplicate: true,
  hooks: { beforeOperation: [createUploadGuard(PRIVATE_FILE_POLICY)], beforeDelete: [deleteObjectBeforeDelete] },
  upload: {
    mimeTypes: ALLOWED_MIME_TYPES,
    // Không phục vụ file qua route /api/private-files/file/*: nếu không, Payload rơi về đọc đĩa local.
    handlers: [() => new Response("Not found", { status: 404 })],
  },
  fields: [],
};
