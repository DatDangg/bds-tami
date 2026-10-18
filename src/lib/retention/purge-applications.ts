import type { Payload, Where } from "payload";

import { ANONYMIZED_PLACEHOLDER } from "../leads/lead-values";
import { runInLockedTransaction } from "../db/advisory-lock";
import { deletePrivateFile } from "./delete-private-file";
import { excludingIds, processDueRecords, type RetentionStepArgs } from "./drain-batches";
import { DATA_RETENTION_LOCK_KEY, JOB_APPLICATION_RETENTION_MONTHS, monthsBefore, RETENTION_BATCH_SIZE } from "./retention-config";

const expiredApplicationsWhere = (cutoff: Date): Where => ({
  and: [{ anonymizedAt: { exists: false } }, { createdAt: { less_than: cutoff.toISOString() } }],
});

/**
 * Ẩn danh MỘT hồ sơ quá 12 tháng rồi xoá CV, trong một transaction giữ khoá advisory. Trả `null` nếu bên khác đã xử lý trước (đọc lại sau khi có khoá).
 * Thứ tự: (1) đặt `cv = null` + `anonymizedAt` + giá trị thay thế để hồ sơ không còn trỏ tới CV (FK `ON DELETE SET NULL`, `cv` chỉ bắt buộc khi chưa
 * ẩn danh); (2) `deletePrivateFile`: xoá object S3 TRƯỚC và ném nếu S3 lỗi (plugin cloud-storage nuốt lỗi xoá nên không thể dựa vào hook `afterDelete`),
 * rồi mới xoá dòng `private-files`. Lỗi S3 → rollback cả bước (1): hồ sơ vẫn trỏ CV còn nguyên file, lần chạy sau thử lại, không bao giờ để object (PII)
 * mồ côi. Hiếm hoi commit lỗi SAU khi object đã xoá: hồ sơ vẫn trỏ tới CV không còn file, lần sau xử lý lại (DeleteObject idempotent), dữ liệu đã quá hạn.
 * Xoá theo id từng hồ sơ, không dùng `where` hàng loạt trên `job-applications` (overrideAccess bỏ qua `disableBulkDelete`, mất rollback CV/audit).
 */
async function anonymizeOneApplication(payload: Payload, id: string, now: Date): Promise<{ hadCv: boolean } | null> {
  return runInLockedTransaction(payload, DATA_RETENTION_LOCK_KEY, async (req) => {
    const application = await payload.findByID({ collection: "job-applications", id, depth: 0, overrideAccess: true, req, disableErrors: true });
    if (!application || application.anonymizedAt) return null;
    const cvId = typeof application.cv === "string" ? application.cv : null;
    await payload.update({
      collection: "job-applications",
      id,
      data: {
        fullName: ANONYMIZED_PLACEHOLDER,
        phone: ANONYMIZED_PLACEHOLDER,
        email: ANONYMIZED_PLACEHOLDER,
        message: null,
        note: null,
        ipHash: null,
        cv: null,
        anonymizedAt: now.toISOString(),
      },
      depth: 0,
      overrideAccess: true,
      req,
    });
    if (cvId) await deletePrivateFile(payload, cvId, req);
    return { hadCv: cvId !== null };
  });
}

/**
 * Ẩn danh hồ sơ ứng tuyển quá 12 tháng và xoá CV của chúng (BR-31, ERD §7); hồ sơ lỗi bị bỏ qua và xử lý tiếp (xem `processDueRecords`).
 * `tally.cvFilesDeleted` = số hồ sơ còn CV và đã xoá được file + bản ghi `private-files`. Không đụng tin tuyển dụng (`job-postings`).
 */
export async function purgeExpiredApplications({ payload, now, dryRun, tally }: RetentionStepArgs): Promise<void> {
  const where = expiredApplicationsWhere(monthsBefore(now, JOB_APPLICATION_RETENTION_MONTHS));
  if (dryRun) {
    const [due, withCv] = await Promise.all([
      payload.count({ collection: "job-applications", where, overrideAccess: true }),
      payload.count({ collection: "job-applications", where: { and: [where, { cv: { exists: true } }] }, overrideAccess: true }),
    ]);
    tally.applicationsAnonymized = due.totalDocs;
    tally.cvFilesDeleted = withCv.totalDocs;
    return;
  }
  await processDueRecords({
    payload,
    step: "purge-applications",
    tally,
    findDueIds: async (excludeIds) => {
      const due = await payload.find({
        collection: "job-applications",
        where: excludingIds(where, excludeIds),
        sort: "createdAt",
        limit: RETENTION_BATCH_SIZE,
        pagination: false,
        depth: 0,
        select: { createdAt: true },
        overrideAccess: true,
      });
      return due.docs.map((application) => application.id);
    },
    processOne: async (id) => {
      const result = await anonymizeOneApplication(payload, id, now);
      if (!result) return false;
      tally.applicationsAnonymized += 1;
      if (result.hadCv) tally.cvFilesDeleted += 1;
      return true;
    },
  });
}
