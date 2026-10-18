// Dịch vụ mẫu cho dev/staging: `pnpm seed:sample-services` (idempotent). Từ chối chạy ở production.
import { getPayload } from "payload";

import config from "../src/payload.config";
import { seedSampleServices } from "../seed/sample/services";

if (process.env.APP_ENV === "production") {
  console.error("Không seed dịch vụ mẫu ở production (APP_ENV=production).");
  process.exit(1);
}

const payload = await getPayload({ config });
const { created, skipped } = await seedSampleServices(payload);
payload.logger.info(`Seed dịch vụ mẫu: tạo ${created}, bỏ qua ${skipped} dịch vụ đã có.`);
await payload.destroy();
