// Điền dữ liệu cũ cho trường mới của BL-052 từ nội dung sẵn có. CHỈ DB dev.
// Dự án: loại sản phẩm, tiện ích nổi bật, sản phẩm. Tin BĐS: loại hình, diện tích, phòng ngủ/tắm, hướng nhà, mặt tiền, số tầng, địa chỉ (bỏ qua tin ưu đãi/voucher).
// Chạy: `pnpm backfill:listing-fields` (chạy thử, không ghi, mọi collection) · `--apply` (ghi) · `--collection projects|property-posts` (chỉ một collection).
// (`payload run` chỉ chuyển tham số đứng sau `--` cho script, nên lệnh trong package.json kết thúc bằng `--`.)
// Chỉ điền ô trống, idempotent; mỗi lần chạy ghi 1 báo cáo MỚI `docs/reports/backfill-listing-fields-<YYYY-MM-DD>-<HHmm>-<apply|dry-run>.md` (không ghi đè; bản dry-run bị gitignore).
// Từ chối khi không phải DB dev cục bộ (`checkBackfillEnvironment`, chặn cả staging/prod — không có cờ mở).
import path from "node:path";
import { getPayload } from "payload";

import config from "../src/payload.config";
import { checkBackfillEnvironment } from "../src/lib/backfill/guard";
import { renderBackfillReport, writeBackfillReport } from "../src/lib/backfill/report";
import { parseBackfillArgs, runBackfill } from "../src/lib/backfill/run";

const guard = checkBackfillEnvironment(process.env);
if (!guard.allowed) {
  console.error(`backfill:listing-fields từ chối chạy: ${guard.reason}. Script này chỉ dành cho DB dev cục bộ.`);
  process.exit(1);
}

let options: ReturnType<typeof parseBackfillArgs>;
try {
  options = parseBackfillArgs(process.argv.slice(2));
} catch (error) {
  console.error((error as Error).message);
  process.exit(1);
}

const now = new Date();
const ranAt = `${new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short" }).format(now)} (giờ VN)`;

const payload = await getPayload({ config });
try {
  payload.logger.info(`backfill:listing-fields — ${options.apply ? "GHI THẬT (--apply)" : "chạy thử (không ghi)"} — ${options.collections.join(", ")}`);
  const results = await runBackfill(payload, options);
  const reportPath = await writeBackfillReport(path.resolve(process.cwd(), "docs/reports"), now, options.apply, renderBackfillReport(results, { apply: options.apply, ranAt }));
  for (const { adapter, plans } of results) {
    const fill = plans.filter((p) => Object.keys(p.patch).length > 0).length;
    const errors = plans.filter((p) => p.error).length;
    payload.logger.info(`${adapter.label}: quét ${plans.length}, ${options.apply ? "đã điền" : "sẽ điền"} ${fill - errors}, lỗi ${errors}`);
  }
  payload.logger.info(`Báo cáo: ${path.relative(process.cwd(), reportPath)}`);
} finally {
  await payload.destroy();
}
