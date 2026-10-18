import type { CollectionSlug, Where } from "payload";

import { runInLockedTransaction } from "../db/advisory-lock";
import { drainInBatches, type RetentionStepArgs, type RetentionTally } from "./drain-batches";
import {
  AUDIT_LOG_RETENTION_MONTHS,
  DATA_RETENTION_LOCK_KEY,
  daysBefore,
  FAILED_JOB_RETENTION_DAYS,
  monthsBefore,
  RETENTION_BATCH_SIZE,
} from "./retention-config";

/**
 * Xoá theo lô các bản ghi khớp `where` ở collection không có hook xoá (`audit-logs`, `payload-jobs`): chọn id rồi xoá theo `id in`,
 * trong một transaction giữ khoá. Cộng vào `tally[tallyKey]` sau mỗi lô đã commit; chỉ đếm khi `dryRun`.
 */
async function deleteInBatches(args: RetentionStepArgs & { collection: CollectionSlug; where: Where; step: string; tallyKey: keyof RetentionTally }): Promise<void> {
  const { payload, collection, where, step, dryRun, tally, tallyKey } = args;
  if (dryRun) {
    tally[tallyKey] = (await payload.count({ collection, where, overrideAccess: true })).totalDocs;
    return;
  }
  await drainInBatches(
    payload,
    step,
    () =>
      runInLockedTransaction(payload, DATA_RETENTION_LOCK_KEY, async (req) => {
        const due = await payload.find({ collection, where, sort: "createdAt", limit: RETENTION_BATCH_SIZE, pagination: false, depth: 0, select: { createdAt: true }, overrideAccess: true, req });
        if (due.docs.length === 0) return 0;
        const deletion = await payload.delete({ collection, where: { id: { in: due.docs.map((doc) => doc.id) } }, overrideAccess: true, req });
        if (deletion.errors.length > 0) throw new Error(`Không xoá được ${deletion.errors.length} bản ghi ${collection} quá hạn`);
        return deletion.docs.length;
      }),
    (processed) => {
      tally[tallyKey] += processed;
    },
  );
}

/** Xoá `audit-logs` quá 24 tháng (ERD §7). Không ai xoá được qua API; chỉ job hệ thống này (Local API, `overrideAccess`). */
export const purgeExpiredAuditLogs = (args: RetentionStepArgs): Promise<void> =>
  deleteInBatches({
    ...args,
    collection: "audit-logs",
    step: "purge-audit-logs",
    tallyKey: "auditLogsDeleted",
    where: { createdAt: { less_than: monthsBefore(args.now, AUDIT_LOG_RETENTION_MONTHS).toISOString() } },
  });

/**
 * Xoá job Payload đã hết lượt thử (`hasError`, không còn chạy) quá 7 ngày: `input` chứa dữ liệu khách (email lead, hồ sơ) mà `deleteJobOnComplete`
 * chỉ dọn job thành công. Log của job (bảng `payload_jobs_log`, FK `ON DELETE CASCADE`) đi cùng.
 */
export const purgeFailedJobs = (args: RetentionStepArgs): Promise<void> =>
  deleteInBatches({
    ...args,
    collection: "payload-jobs",
    step: "purge-failed-jobs",
    tallyKey: "failedJobsDeleted",
    where: { and: [{ hasError: { equals: true } }, { processing: { equals: false } }, { updatedAt: { less_than: daysBefore(args.now, FAILED_JOB_RETENTION_DAYS).toISOString() } }] },
  });
