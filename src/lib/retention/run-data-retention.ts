import { createLocalReq, type Payload } from "payload";

import { tryWriteAuditLog } from "../audit/write-audit-log";
import { anonymizeExpiredLeads } from "./anonymize-leads";
import { emptyRetentionTally, type RetentionStepArgs, type RetentionTally } from "./drain-batches";
import { purgeExpiredApplications } from "./purge-applications";
import { purgeExpiredAuditLogs, purgeFailedJobs } from "./purge-logs";
import { purgeOrphanCvs } from "./purge-orphan-cvs";

export type DataRetentionOutcome = { dryRun: boolean } & RetentionTally;

/** Chỉ số lượng (không PII) để ghi audit/log. */
const totalChanged = (tally: RetentionTally): number => Object.values(tally).reduce((sum, count) => sum + count, 0);

/**
 * Thực thi thời hạn lưu dữ liệu (BR-31, LGL-03, ERD §7): ẩn danh lead 24 tháng, ẩn danh hồ sơ + xoá CV 12 tháng, xoá CV mồ côi,
 * xoá `audit-logs` 24 tháng, xoá job lỗi cũ (kèm log). KHÔNG đụng nội dung (dự án, tin…) và không xoá cứng lead.
 * `click-events` do job `aggregate-click-stats` xoá sau khi gộp (ERD §7), không lặp lại ở đây.
 *
 * Các bước độc lập: một bước lỗi (vd S3 tạm sập) không chặn bước khác; sau khi chạy hết, có lỗi thì ném lỗi tổng hợp (chỉ tên bước, không dữ liệu)
 * để Payload Jobs thử lại — mọi bước idempotent. Mỗi bước cộng vào `tally` ngay khi commit nên audit/log luôn phản ánh phần đã xử lý thật kể cả
 * khi có bước lỗi giữa chừng. `dryRun` chỉ đếm, không đổi gì, không ghi audit. Có thay đổi thật thì ghi MỘT audit `system.data_retention`
 * (không actor, meta chỉ số lượng), cả khi job sắp ném lỗi.
 */
export async function runDataRetention(args: { payload: Payload; now?: Date; dryRun?: boolean }): Promise<DataRetentionOutcome> {
  const { payload, now = new Date(), dryRun = false } = args;
  const tally = emptyRetentionTally();
  const step: RetentionStepArgs = { payload, now, dryRun, tally };
  const failedSteps: string[] = [];
  const attempt = async (name: string, run: (args: RetentionStepArgs) => Promise<void>) => {
    try {
      await run(step);
    } catch (error) {
      failedSteps.push(name);
      payload.logger.error({ step: name, errorName: error instanceof Error ? error.name : "unknown" }, "Data retention: bước lỗi, các bước còn lại vẫn chạy");
    }
  };

  await attempt("anonymize-leads", anonymizeExpiredLeads);
  await attempt("purge-applications", purgeExpiredApplications);
  await attempt("purge-orphan-cvs", purgeOrphanCvs);
  await attempt("purge-audit-logs", purgeExpiredAuditLogs);
  await attempt("purge-failed-jobs", purgeFailedJobs);

  const outcome: DataRetentionOutcome = { dryRun, ...tally };
  if (!dryRun && totalChanged(tally) > 0) await writeRetentionAudit(payload, outcome);
  if (failedSteps.length > 0) {
    payload.logger.warn({ ...tally }, "Data retention: số đã xử lý trước khi có bước lỗi");
    throw new Error(`Data retention: ${failedSteps.length} bước lỗi (${failedSteps.join(", ")})`);
  }
  return outcome;
}

async function writeRetentionAudit(payload: Payload, outcome: DataRetentionOutcome): Promise<void> {
  const req = await createLocalReq({}, payload);
  await tryWriteAuditLog({
    action: "system.data_retention",
    summary: `Dọn dữ liệu hết hạn: ${outcome.leadsAnonymized} lead và ${outcome.applicationsAnonymized} hồ sơ ứng tuyển ẩn danh, ${outcome.cvFilesDeleted + outcome.orphanCvsDeleted} CV xoá`,
    meta: {
      leadsAnonymized: outcome.leadsAnonymized,
      applicationsAnonymized: outcome.applicationsAnonymized,
      cvFilesDeleted: outcome.cvFilesDeleted,
      orphanCvsDeleted: outcome.orphanCvsDeleted,
      auditLogsDeleted: outcome.auditLogsDeleted,
      failedJobsDeleted: outcome.failedJobsDeleted,
    },
    req,
  });
}
