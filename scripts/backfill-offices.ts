// Tạo văn phòng đầu tiên của `site-settings.offices` từ trường cũ (BL-054 Quyết định 4). CHỈ DB dev.
// Chạy: `pnpm backfill:offices` (chạy thử, không ghi) · `pnpm backfill:offices --apply` (ghi).
// (`payload run` chỉ chuyển tham số đứng sau `--` cho script, nên lệnh trong package.json kết thúc bằng `--`.)
// Chỉ khi `offices` đang trống, idempotent; mỗi lần chạy ghi 1 báo cáo MỚI `docs/reports/backfill-offices-<YYYY-MM-DD>-<HHmm>-<apply|dry-run>.md` (bản dry-run bị gitignore).
// Từ chối khi không phải DB dev cục bộ (`checkBackfillEnvironment`, chặn cả staging/prod — không có cờ mở).
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getPayload } from "payload";

import config from "../src/payload.config";
import { checkBackfillEnvironment } from "../src/lib/backfill/guard";
import { renderOfficesReport, runOfficesBackfill, type OfficeNameTemplates } from "../src/lib/backfill/offices";
import { writeBackfillReport } from "../src/lib/backfill/report";

const guard = checkBackfillEnvironment(process.env);
if (!guard.allowed) {
  console.error(`backfill:offices từ chối chạy: ${guard.reason}. Script này chỉ dành cho DB dev cục bộ.`);
  process.exit(1);
}

const args = process.argv.slice(2);
const unknown = args.filter((arg) => arg !== "--apply");
if (unknown.length > 0) {
  console.error(`Tham số không hỗ trợ: ${unknown.join(" ")}. Dùng: [--apply]`);
  process.exit(1);
}
const apply = args.includes("--apply");

/** Tên văn phòng lấy đúng chuỗi web dùng cho văn phòng dự phòng (`page.contact.v2.fallbackOfficeName`). */
async function loadNameTemplates(): Promise<OfficeNameTemplates> {
  const read = async (locale: "vi" | "en") => {
    const messages = JSON.parse(await readFile(path.resolve(process.cwd(), `src/i18n/messages/${locale}.json`), "utf8")) as { page: { contact: { v2: { fallbackOfficeName: string } } } };
    return messages.page.contact.v2.fallbackOfficeName;
  };
  return { vi: await read("vi"), en: await read("en") };
}

const now = new Date();
const ranAt = `${new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short" }).format(now)} (giờ VN)`;

const payload = await getPayload({ config });
try {
  payload.logger.info(`backfill:offices — ${apply ? "GHI THẬT (--apply)" : "chạy thử (không ghi)"}`);
  const result = await runOfficesBackfill(payload, { apply }, await loadNameTemplates());
  const reportPath = await writeBackfillReport(path.resolve(process.cwd(), "docs/reports"), now, apply, renderOfficesReport(result, ranAt), "backfill-offices");
  payload.logger.info(`Kết quả: ${result.plan.status}${apply ? ` · VI ${result.written.vi ? "đã ghi" : "không ghi"} · EN ${result.written.en ? "đã ghi" : "không ghi"} · lỗi ${result.errors.length}` : ""}`);
  payload.logger.info(`Báo cáo: ${path.relative(process.cwd(), reportPath)}`);
  if (result.errors.length > 0) process.exitCode = 1;
} finally {
  await payload.destroy();
}
