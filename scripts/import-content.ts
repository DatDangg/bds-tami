// `pnpm content:import [apply]` = `payload run scripts/import-content.ts [apply]` (BL-072): nhập 3 dự án + 8 tin pháp lý (seed/content/2026-10-23/) vào DB hiện tại.
// Mặc định DRY-RUN (chỉ đọc): in kế hoạch `sẽ tạo` / `đã có, bỏ qua`, kiểm đủ ảnh trong IMPORT_IMG_DIR, đủ ảnh bìa, không còn "[CẦN KIỂM TRA]"; exit 1 khi có lỗi.
// `apply` chỉ ghi khi env IMPORT_CONFIRM=2026-10-23 (chạy được cả production, theo docs/runbooks/english-pack.md: backup + dry-run trước). Chỉ tạo mới, chỉ locale vi.
// Env: IMPORT_IMG_DIR (bắt buộc; thư mục ảnh ngoài repo, chứa manifest.json), IMPORT_STATUS (published|draft, mặc định published).
// `payload run` nuốt cờ `--x` nên `apply` là tham số vị trí. Kiểm tham số + confirm + thư mục ảnh TRƯỚC khi mở DB.
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getPayload } from "payload";

import config from "../src/payload.config";
import { describeDatabaseTarget } from "../seed/english/pack-plan";
import { runContentImport } from "../seed/content/import";
import { CONTENT_DATASET, formatImportLine, importConfirmProblem, parseImportArgs } from "../seed/content/import-plan";

const args = parseImportArgs(process.argv.slice(2).filter((arg) => !arg.endsWith(".ts") && !arg.endsWith(".js")));
const imgDir = process.env.IMPORT_IMG_DIR?.trim();
const status = process.env.IMPORT_STATUS ?? "published";
const failure =
  args.unknown.length > 0
    ? `Dùng: pnpm content:import [apply] (tham số lạ: ${args.unknown.join(", ")})`
    : !imgDir
      ? "Thiếu IMPORT_IMG_DIR (thư mục ảnh ngoài repo, chứa manifest.json)"
      : status !== "published" && status !== "draft"
        ? `IMPORT_STATUS phải là published hoặc draft (hiện: ${status})`
        : importConfirmProblem(CONTENT_DATASET, args.apply, process.env);
if (failure) {
  console.error(failure);
  process.exit(1);
}

const dataDir = fileURLToPath(new URL(`../seed/content/${CONTENT_DATASET}/`, import.meta.url));
console.log(`Nhập nội dung ${CONTENT_DATASET} — chế độ ${args.apply ? "APPLY (ghi thật)" : "dry-run (không ghi)"}`);
console.log(`APP_ENV=${process.env.APP_ENV ?? "(chưa đặt)"} · DB ${describeDatabaseTarget(process.env.DATABASE_URL)} · ảnh ${path.resolve(imgDir!)}`);

const payload = await getPayload({ config });
try {
  const report = await runContentImport(payload, {
    dataDir,
    newsDir: path.join(dataDir, "news"),
    coversFile: path.join(dataDir, "news-covers.json"),
    imgDir: path.resolve(imgDir!),
    apply: args.apply,
    status: status as "published" | "draft",
  });
  for (const line of report.lines) console.log(formatImportLine(line, report.applied));
  if (args.apply && !report.applied) console.error("Dry-run còn lỗi → CHƯA ghi gì. Sửa rồi chạy lại.");
  console.log(`Tổng: ${report.lines.filter((line) => line.status === "create").length} ${report.applied ? "đã tạo" : "sẽ tạo"}, ${report.lines.filter((line) => line.status === "exists").length} đã có, ${report.problems} lỗi`);
  if (report.problems > 0) process.exitCode = 1;
} catch (error) {
  console.error((error as Error).message);
  process.exitCode = 1;
} finally {
  await payload.destroy();
}
