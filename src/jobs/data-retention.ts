import type { TaskConfig } from "payload";

import { runDataRetention } from "../lib/retention/run-data-retention";

export const DATA_RETENTION_SLUG = "data-retention";

/**
 * Hằng tuần, Chủ nhật 03:00 giờ VN = thứ 7 20:00 UTC (`schedule` không có múi giờ riêng, container `jobs` chạy UTC; giờ vắng, không đụng giờ làm).
 * Input `dryRun` (xếp tay qua admin/`payload.jobs.queue`): chỉ đếm bản ghi đến hạn, không đổi gì.
 * Log chỉ số lượng: không log tên/SĐT/email/id hồ sơ.
 */
export const dataRetentionTask: TaskConfig<"data-retention"> = {
  slug: DATA_RETENTION_SLUG,
  label: "Thực thi thời hạn lưu dữ liệu (ẩn danh lead, xoá CV, dọn log)",
  retries: { attempts: 3, backoff: { type: "exponential", delay: 300_000 } },
  schedule: [{ cron: "0 0 20 * * 6", queue: "default" }],
  inputSchema: [{ name: "dryRun", type: "checkbox" }],
  outputSchema: [
    { name: "dryRun", type: "checkbox", required: true },
    { name: "leadsAnonymized", type: "number", required: true },
    { name: "applicationsAnonymized", type: "number", required: true },
    { name: "cvFilesDeleted", type: "number", required: true },
    { name: "orphanCvsDeleted", type: "number", required: true },
    { name: "auditLogsDeleted", type: "number", required: true },
    { name: "failedJobsDeleted", type: "number", required: true },
  ],
  handler: async ({ input, req }) => {
    const output = await runDataRetention({ payload: req.payload, dryRun: input?.dryRun === true });
    req.payload.logger.info({ ...output }, output.dryRun ? "Data retention (dry-run): số bản ghi đến hạn" : "Data retention: đã dọn dữ liệu hết hạn");
    return { output };
  },
};
