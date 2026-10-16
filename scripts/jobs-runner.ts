// Process `jobs` (cùng image với app): `pnpm jobs` = `payload run scripts/jobs-runner.ts`.
// `payload run` nạp env + TypeScript rồi gọi process.exit(0) khi script import xong => top-level `await`
// của worker (treo đến khi có SIGINT/SIGTERM) là thứ giữ process sống. Web app không chạy job (không có autoRun).
import { getPayload } from "payload";

import config from "../src/payload.config";
import { findEmailConfigProblems, parseEmailAllowlist } from "../src/lib/email/allowlist";
import { getEnv } from "../src/lib/env";
import { runJobsWorker } from "../src/jobs/run-loop";

const payload = await getPayload({ config });
const env = getEnv();
for (const problem of findEmailConfigProblems({
  nodeEnv: process.env.NODE_ENV,
  appEnv: env.APP_ENV,
  allowlist: parseEmailAllowlist(env.EMAIL_ALLOWLIST),
})) {
  payload.logger.error(`Jobs: cấu hình email: ${problem}`);
}
payload.logger.info("Jobs: runner đã khởi động");
await runJobsWorker(payload);
payload.logger.info("Jobs: runner đã dừng");
await payload.destroy();
