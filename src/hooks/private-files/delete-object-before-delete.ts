import type { CollectionBeforeDeleteHook } from "payload";

import { buildPrivateObjectKey, deletePrivateObject } from "../../lib/private-objects/private-objects";

/**
 * Xoá object CV khỏi S3 TRƯỚC khi Payload xoá dòng `private-files`, và ném lỗi nếu S3 từ chối (dòng DB còn nguyên, xử lý lại được). Mọi đường xoá
 * (admin xoá hồ sơ/file, endpoint nộp CV dọn CV mồ côi, job data-retention) đều qua hook này vì `afterDelete` của `@payloadcms/plugin-cloud-storage`
 * nuốt lỗi S3. Hook `afterDelete` của plugin vẫn chạy sau đó và xoá thêm lần nữa: vô hại (DeleteObject idempotent).
 */
export const deleteObjectBeforeDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const file = await req.payload.findByID({ collection: "private-files", id, depth: 0, overrideAccess: true, req, disableErrors: true });
  if (!file?.filename) return;
  await deletePrivateObject(buildPrivateObjectKey(file));
};
