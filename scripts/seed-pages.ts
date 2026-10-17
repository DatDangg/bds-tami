// Seed 2 trang pháp lý (privacy, terms) dạng nháp: `pnpm seed:pages` = `payload run scripts/seed-pages.ts` (idempotent).
import { getPayload } from "payload";

import config from "../src/payload.config";
import { seedLegalPages } from "../seed/pages";

const payload = await getPayload({ config });
const { created, skipped } = await seedLegalPages(payload);
payload.logger.info(`Seed trang pháp lý: tạo ${created}, bỏ qua ${skipped} trang đã có.`);
await payload.destroy();
