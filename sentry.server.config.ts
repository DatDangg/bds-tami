import * as SentryNamespace from "@sentry/nextjs";

import { initSentryIfConfigured, pickSentryExports } from "./src/lib/monitoring/sentry-options";

// Chọn bản export đủ bộ theo cách process nạp SDK (ESM của jobs vs Next): xem pickSentryExports.
const Sentry = pickSentryExports(SentryNamespace);

// Đọc process.env trực tiếp (không qua getEnv): cấu hình giám sát không được làm app hỏng khi thiếu biến khác,
// và file này cũng chạy trong process `jobs`. Không DSN → không init, không network.
// onUnhandledRejection mode "none": mặc định SDK in lỗi thô ra console (ngoài pino, bỏ qua redact) và trùng với
// log của `process-errors.ts`; vẫn gửi event lên GlitchTip (đã lọc PII ở beforeSend).
initSentryIfConfigured(
  Sentry.init,
  {
    dsn: process.env.GLITCHTIP_DSN || undefined,
    environment: process.env.APP_ENV ?? "development",
  },
  { integrations: [Sentry.onUnhandledRejectionIntegration({ mode: "none" })] },
);
