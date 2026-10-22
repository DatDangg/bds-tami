// `pnpm seed:english:export <collection|globals> <out.json> [missing]` = `payload run scripts/seed-english-export.ts …`.
// Xuất bản vi ở đúng định dạng dữ liệu EN (seed/english/README.md) để người dịch thay chuỗi vi bằng chuỗi EN rồi lưu vào seed/english/data/<nhóm>.json.
// `missing`: chỉ lá mà EN còn trống / còn tiếng Việt. Chỉ đọc DB, không ghi DB.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { getPayload } from "payload";

import config from "../src/payload.config";
import { COLLECTION_KEY_FIELD, type EnglishCollection } from "../seed/english/apply";
import { exportGroup } from "../seed/english/export";

const args = process.argv.slice(2).filter((arg) => !arg.endsWith(".ts") && !arg.endsWith(".js"));
const [group, outPath, mode] = args;
const groups = [...Object.keys(COLLECTION_KEY_FIELD), "globals"];
if (!group || !outPath || !groups.includes(group) || (mode !== undefined && mode !== "missing")) {
  console.error(`Dùng: pnpm seed:english:export <${groups.join("|")}> <out.json> [missing]`);
  process.exit(1);
}

const payload = await getPayload({ config });
try {
  const data = await exportGroup(payload, group as EnglishCollection | "globals", mode === "missing");
  await mkdir(path.dirname(path.resolve(outPath)), { recursive: true });
  await writeFile(outPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  payload.logger.info(`Xuất ${Object.keys(data).length} bản ghi "${group}" → ${outPath}`);
} finally {
  await payload.destroy();
}
