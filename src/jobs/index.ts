import type { JobsConfig } from "payload";

import { isAdmin } from "../access/isAdmin";
import { sendNotificationEmailTask } from "./send-notification-email";

/**
 * Cấu hình Payload Jobs (ARCHITECTURE §5.4, D3). Hàng đợi lưu trong Postgres (`payload-jobs`).
 *
 * Cố ý KHÔNG có `autoRun`: web app chỉ xếp job vào hàng đợi; việc chạy job do process `jobs`
 * riêng (`pnpm jobs`, xem scripts/jobs-runner.ts) đảm nhiệm. Job nghiệp vụ khác (nhắc lead, hết hạn ưu đãi,
 * dọn dữ liệu, dịch) và lịch cron của chúng được thêm vào `tasks` ở task của từng nghiệp vụ.
 */
export const jobsConfig: JobsConfig = {
  tasks: [sendNotificationEmailTask],
  // Input chứa dữ liệu khách; job xong thì xoá để không giữ dữ liệu cá nhân trong bảng hàng đợi.
  deleteJobOnComplete: true,
  // Mặc định mọi user đăng nhập được chạy/xếp/huỷ job qua REST; chỉ admin mới được.
  access: { run: isAdmin, queue: isAdmin, cancel: isAdmin },
};
