// `pnpm english:pack <tên-gói> [apply] [overwrite]` = `payload run scripts/apply-english-pack.ts <tên-gói> [apply] [overwrite]` (BL-072).
// Gói = seed/english/packs/<tên-gói>/*.json (định dạng như seed/english/data). Mặc định DRY-RUN: chỉ đọc, in kế hoạch từng bản ghi, exit 1 khi có bản bị bỏ/thiếu.
// `apply` chỉ chạy khi env ENGLISH_PACK_CONFIRM = tên gói. Chạy được trên dev/staging/production → làm theo docs/runbooks/english-pack.md (backup + dry-run trước).
// `payload run` nuốt cờ `--x` nên `apply`/`overwrite` là tham số vị trí. Kiểm tham số + confirm TRƯỚC khi mở DB.
import { getPayload } from "payload";

import config from "../src/payload.config";
import { runEnglishPack } from "../seed/english/pack";
import { describeDatabaseTarget, formatPackLine, packConfirmProblem, parsePackArgs } from "../seed/english/pack-plan";

const args = parsePackArgs(process.argv.slice(2).filter((arg) => !arg.endsWith(".ts") && !arg.endsWith(".js")));
if (!args.pack || args.unknown.length > 0) {
  console.error(`Dùng: pnpm english:pack <tên-gói> [apply] [overwrite]${args.unknown.length > 0 ? ` (tham số lạ: ${args.unknown.join(", ")})` : ""}`);
  process.exit(1);
}
const refusal = packConfirmProblem(args.pack, args.apply, process.env);
if (refusal) {
  console.error(refusal);
  process.exit(1);
}

console.log(`Gói EN "${args.pack}" — chế độ ${args.apply ? "APPLY (ghi thật)" : "dry-run (không ghi)"}${args.overwrite ? " + overwrite" : ""}`);
console.log(`APP_ENV=${process.env.APP_ENV ?? "(chưa đặt)"} · DB ${describeDatabaseTarget(process.env.DATABASE_URL)}`);

const payload = await getPayload({ config });
let exitCode = 0;
try {
  const result = await runEnglishPack(payload, { pack: args.pack, apply: args.apply, overwrite: args.overwrite });
  for (const line of result.lines) console.log(formatPackLine(line, args.apply));
  const count = (status: string) => result.lines.filter((line) => line.status === status).length;
  console.log(`Tổng: ${args.apply ? `đã ghi ${result.written}` : `sẽ ghi ${count("write")}`}, không đổi ${count("unchanged")}, bỏ qua ${count("skip")}, thiếu bản vi ${count("missing")}`);
  exitCode = result.problems > 0 ? 1 : 0;
} catch (error) {
  console.error((error as Error).message);
  exitCode = 1;
} finally {
  await payload.destroy();
}
// `payload run` tự process.exit(0) sau script → phải thoát tường minh, nếu không exit code bị ghi đè.
process.exit(exitCode);
