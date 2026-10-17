// Cửa vào `pnpm seed [--sample]`. `payload run` chỉ chuyển tiếp tham số vị trí cho script (cờ `--x` bị nuốt
// âm thầm), nên `--sample` phải đổi thành tham số vị trí `sample` rồi mới chạy `scripts/seed-run.ts`;
// nếu không `--sample` bị bỏ qua mà không báo lỗi. Tham số lạ là lỗi để gõ nhầm không chạy "nửa vời".
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const unknown = args.filter((arg) => arg !== "--sample");
if (unknown.length > 0) {
  console.error(`Tham số không hợp lệ: ${unknown.join(" ")}. Dùng: pnpm seed [--sample]`);
  process.exit(1);
}

const payloadBin = fileURLToPath(new URL("../node_modules/payload/bin.js", import.meta.url));
const runner = fileURLToPath(new URL("./seed-run.ts", import.meta.url));
const forwarded = args.includes("--sample") ? ["sample"] : [];
const { status } = spawnSync(process.execPath, [payloadBin, "run", runner, ...forwarded], { stdio: "inherit" });
process.exit(status ?? 1);
