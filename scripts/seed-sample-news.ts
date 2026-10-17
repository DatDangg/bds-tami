// Tin tức mẫu cho dev/staging: `pnpm seed:sample-news` (idempotent). Từ chối chạy ở production.
import { getPayload } from "payload";

import config from "../src/payload.config";
import { seedSampleNews } from "../seed/sample/news";

if (process.env.APP_ENV === "production") {
  console.error("Không seed tin tức mẫu ở production (APP_ENV=production).");
  process.exit(1);
}

const payload = await getPayload({ config });
const { created, skipped } = await seedSampleNews(payload);
payload.logger.info(`Seed tin tức mẫu: tạo ${created}, bỏ qua ${skipped} tin đã có.`);
await payload.destroy();
