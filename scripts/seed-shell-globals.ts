// Menu + chân trang mặc định cho dev/staging: `pnpm seed:shell` (idempotent). Từ chối chạy ở production.
import { getPayload } from "payload";

import config from "../src/payload.config";
import { seedShellGlobals } from "../seed/shell-globals";

if (process.env.APP_ENV === "production") {
  console.error("Không seed menu/chân trang mẫu ở production (APP_ENV=production): nhập qua /admin.");
  process.exit(1);
}

const payload = await getPayload({ config });
const { header, footer } = await seedShellGlobals(payload);
payload.logger.info(`Seed khung trang: header ${header ? "đã tạo" : "đã có, bỏ qua"}, footer ${footer ? "đã tạo" : "đã có, bỏ qua"}.`);
await payload.destroy();
