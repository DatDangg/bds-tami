// Seed danh mục mặc định: `pnpm seed:categories` = `payload run scripts/seed-categories.ts` (idempotent).
// `payload run` nạp env + TypeScript rồi tự thoát khi script chạy xong.
import { getPayload } from "payload";

import config from "../src/payload.config";
import { seedDefaultCategories } from "../seed/categories";

const payload = await getPayload({ config });
const { created, skipped } = await seedDefaultCategories(payload);
payload.logger.info(`Seed danh mục mặc định: tạo ${created}, bỏ qua ${skipped} mục đã có.`);
await payload.destroy();
