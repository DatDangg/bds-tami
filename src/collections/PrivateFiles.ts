import type { CollectionConfig } from "payload";

import { isAdmin, ROLES } from "../access";
import { createUploadGuard, PRIVATE_FILE_POLICY } from "../lib/upload/validate-file";

/**
 * CV ứng viên và file nội bộ (bucket `private`, ERD §4.12). Chỉ admin; khách/sale không đọc được.
 * Không có URL công khai: plugin S3 được cấu hình `disablePayloadAccessControl` + `generateFileURL` rỗng
 * nên Payload không đăng ký route phục vụ file; tải về chỉ qua endpoint có kiểm quyền + audit (task CV).
 * Ứng viên nộp CV qua endpoint công khai dùng Local API (`overrideAccess`), vẫn qua `createUploadGuard`.
 */
export const PrivateFiles: CollectionConfig = {
  slug: "private-files",
  admin: { hidden: ({ user }) => user?.role !== ROLES.admin, defaultColumns: ["filename", "mimeType", "createdAt"] },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  disableDuplicate: true,
  hooks: { beforeOperation: [createUploadGuard(PRIVATE_FILE_POLICY)] },
  upload: {
    mimeTypes: Object.keys(PRIVATE_FILE_POLICY),
    // Không phục vụ file qua route /api/private-files/file/*: nếu không, Payload rơi về đọc đĩa local.
    handlers: [() => new Response("Not found", { status: 404 })],
  },
  fields: [],
};
