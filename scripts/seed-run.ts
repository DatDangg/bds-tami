// Chạy qua `pnpm seed [--sample]` (xem scripts/seed.mjs: `--sample` tới đây là tham số vị trí `sample`).
// Seed dữ liệu nền idempotent ở mọi môi trường; `sample` thêm dữ liệu mẫu dev/staging, bị chặn khi
// APP_ENV=production. Kiểm tham số TRƯỚC khi mở DB để lỗi ra ngay, không đụng dữ liệu.
import { getPayload } from "payload";

import config from "../src/payload.config";
import { assertSampleAllowed, runSeed } from "../seed";

const includeSample = process.argv.slice(2).includes("sample");
try {
  assertSampleAllowed(includeSample, process.env.APP_ENV);
} catch (error) {
  console.error((error as Error).message);
  process.exit(1);
}

const payload = await getPayload({ config });
await runSeed(payload, includeSample);
await payload.destroy();
