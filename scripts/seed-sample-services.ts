// Dịch vụ mẫu cho dev/staging: `pnpm seed:sample-services` (idempotent). Không chạy ở production.
import { getPayload } from "payload";

import config from "../src/payload.config";
import { seedSampleServices } from "../seed/sample/services";

const payload = await getPayload({ config });
const { created, skipped } = await seedSampleServices(payload);
payload.logger.info(`Seed dịch vụ mẫu: tạo ${created}, bỏ qua ${skipped} dịch vụ đã có.`);
await payload.destroy();
