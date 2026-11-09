import { APIError, type CollectionAfterDeleteHook } from "payload";

import { writeAuditLog } from "../../lib/audit/write-audit-log";

/**
 * Xoá hồ sơ ứng tuyển thì xoá luôn CV (`private-files`): nếu không, dòng metadata (tên file thường chứa tên ứng viên) và
 * object S3 mồ côi vĩnh viễn, job `data-retention` duyệt theo `job-applications` sẽ không bao giờ tìm thấy (ERD §7, BR-31).
 * Xoá qua Local API cùng `req` (cùng transaction): hook `beforeDelete` của `private-files` xoá object S3 và ném nếu S3 lỗi (plugin S3 nuốt lỗi), nên lỗi thì dòng CV còn và `result.errors` ≠ rỗng → ném lại để rollback xoá hồ sơ.
 * Dùng `where` thay vì `id` để CV đã mất trước đó (hồ sơ đã ẩn danh, `cv` = null) không làm hỏng việc xoá hồ sơ.
 */
export const deleteApplicationCv: CollectionAfterDeleteHook = async ({ doc, req }) => {
  const cvId = typeof doc.cv === "object" && doc.cv !== null ? doc.cv.id : doc.cv;
  if (!cvId) return doc;
  const result = await req.payload.delete({
    collection: "private-files",
    where: { id: { equals: cvId } },
    overrideAccess: true,
    req,
  });
  if (result.errors.length > 0) {
    // Public: thông báo tiếng Việt hiện cho admin (không chứa PII); id hồ sơ chỉ ghi log nội bộ.
    req.payload.logger.error(`Không xoá được CV của hồ sơ ứng tuyển ${doc.id}`);
    throw new APIError("Không xoá được CV trên kho lưu trữ, vui lòng thử lại sau.", 502, undefined, true);
  }
  return doc;
};

/** Xoá hồ sơ chứa dữ liệu cá nhân thì phải có dấu vết; summary chỉ có id, không có tên/email/SĐT của ứng viên. */
export const auditApplicationPurge: CollectionAfterDeleteHook = async ({ doc, req }) => {
  await writeAuditLog({
    actor: req.user,
    action: "content.purge",
    collection: "job-applications",
    docId: doc.id,
    summary: `Xoá vĩnh viễn job-applications ${doc.id}`,
    req,
  });
  return doc;
};
