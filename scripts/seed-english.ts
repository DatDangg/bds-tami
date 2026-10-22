// `pnpm seed:english [nhóm…]` = `payload run scripts/seed-english.ts [nhóm…]`: áp dữ liệu EN viết sẵn (seed/english/data/*.json) vào DB dev.
// Nhóm = tên collection | globals | media; bỏ trống = tất cả. `payload run` nuốt cờ `--x` nên nhóm là tham số vị trí.
// Idempotent, chỉ ghi locale en, không xếp job dịch AI. Kiểm APP_ENV TRƯỚC khi mở DB.
import { getPayload } from "payload";

import config from "../src/payload.config";
import { assertEnglishSeedAllowed, runSeedEnglish } from "../seed/english";

try {
  assertEnglishSeedAllowed(process.env);
} catch (error) {
  console.error((error as Error).message);
  process.exit(1);
}

const only = process.argv.slice(2).filter((arg) => !arg.endsWith(".ts") && !arg.endsWith(".js"));
const payload = await getPayload({ config });
try {
  const { problems } = await runSeedEnglish(payload, only);
  if (problems > 0) process.exitCode = 1;
} finally {
  await payload.destroy();
}
