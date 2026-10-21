import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { CollectionResult } from "./run";
import type { DocPlan } from "./types";

/**
 * Báo cáo Markdown cho admin soát. Tin đang xuất bản: tên + trường + giá trị + đoạn nội dung công khai. Tin chưa xuất bản: chỉ id +
 * trường + giá trị (không tên, không đoạn nội dung chưa công bố). Không có chuỗi kết nối hay thông tin môi trường.
 */

/**
 * Tên file theo chế độ + thời điểm (giờ VN, tới phút): `backfill-listing-fields-<YYYY-MM-DD>-<HHmm>-<apply|dry-run>.md`.
 * Lần chạy sau (kể cả dry-run kiểm tra) KHÔNG đè báo cáo `--apply` — danh sách "cần soát" của giá trị đã ghi luôn còn.
 * Trùng phút → script thêm hậu tố `-2`, `-3`... (`attempt`).
 */
export function backfillReportFileName(now: Date, apply: boolean, attempt = 1): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  const suffix = attempt > 1 ? `-${attempt}` : "";
  return `backfill-listing-fields-${parts.year}-${parts.month}-${parts.day}-${parts.hour}${parts.minute}-${apply ? "apply" : "dry-run"}${suffix}.md`;
}

const MAX_SAME_MINUTE = 50;

/** Ghi báo cáo vào FILE MỚI trong `dir` (cờ `wx`: tồn tại → thử hậu tố kế tiếp, không bao giờ ghi đè). Trả đường dẫn đã ghi. */
export async function writeBackfillReport(dir: string, now: Date, apply: boolean, content: string): Promise<string> {
  await mkdir(dir, { recursive: true });
  for (let attempt = 1; attempt <= MAX_SAME_MINUTE; attempt += 1) {
    const file = path.join(dir, backfillReportFileName(now, apply, attempt));
    try {
      await writeFile(file, content, { encoding: "utf8", flag: "wx" });
      return file;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
  }
  throw new Error(`Quá ${MAX_SAME_MINUTE} báo cáo trong cùng một phút`);
}

const cell = (value: string) => value.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim() || "—";
const docName = (plan: DocPlan) => (plan.isPublic ? cell(plan.title) : `(chưa xuất bản) id \`${plan.id}\``);
const docSnippet = (plan: DocPlan, snippet: string | undefined) => (plan.isPublic ? cell(snippet ?? "") : "(ẩn — tin chưa xuất bản)");

const hasPatch = (plan: DocPlan) => Object.keys(plan.patch).length > 0;
/** Tin có giá trị "đã điền / sẽ điền": có dữ liệu ghi và (khi `--apply`) ghi không lỗi — tin ghi lỗi chỉ nằm ở "Lỗi khi ghi" + "Cần admin soát". */
const isWritten = (plan: DocPlan, apply: boolean) => hasPatch(plan) && !(apply && plan.error);

function summaryTable({ adapter, plans }: CollectionResult, apply: boolean, fillVerb: string): string[] {
  const states = (plan: DocPlan) => adapter.fields.map((f) => plan.fieldStates[f.name]);
  const skipped = plans.filter((p) => p.skipped);
  const noFill = plans.filter((p) => !p.skipped && !hasPatch(p));
  const complete = noFill.filter((p) => states(p).every((s) => s === "has-value"));
  const written = plans.filter((p) => isWritten(p, apply));
  const skipReasons = [...new Set(skipped.map((p) => p.skipped ?? ""))].join(", ");
  return [
    "| Chỉ số | Số tin |",
    "|---|---|",
    `| Tin quét | ${plans.length} |`,
    `| ${fillVerb} (ít nhất 1 ô) | ${written.length} |`,
    `| Không điền — mọi ô đã có giá trị | ${complete.length} |`,
    `| Không điền — có ô trống nhưng không trích được | ${noFill.length - complete.length} |`,
    ...(skipped.length > 0 ? [`| Bỏ qua (${cell(skipReasons)}) | ${skipped.length} |`] : []),
    ...(apply ? [`| Lỗi khi ghi | ${plans.filter((p) => p.error).length} |`] : []),
    "",
    `| Trường | ${fillVerb} | Đã có giá trị (giữ nguyên) | Ô trống, không trích được |`,
    "|---|---|---|---|",
    ...adapter.fields.map((f) => {
      const count = (state: string) => plans.filter((p) => p.fieldStates[f.name] === state).length;
      const filled = written.filter((p) => p.fieldStates[f.name] === "fill").length;
      return `| ${f.label} (\`${f.name}\`) | ${filled} | ${count("has-value")} | ${count("not-found")} |`;
    }),
    "",
  ];
}

function collectionSection(result: CollectionResult, apply: boolean): string[] {
  const { adapter, plans } = result;
  const fillVerb = apply ? "Đã điền" : "Sẽ điền";
  const label = (name: string) => adapter.fields.find((f) => f.name === name)?.label ?? name;
  const rows = plans
    .filter((p) => isWritten(p, apply))
    .flatMap((p) => p.filled.map((v) => `| ${docName(p)} | ${cell(label(v.field))} | ${cell(v.value)} | ${docSnippet(p, v.snippet)} | ${cell(v.source)} | ${v.confidence} |`));
  const notes = plans.flatMap((p) => [
    ...(p.error ? [`- **${docName(p)}** — ghi lỗi, chưa điền: ${cell(p.error)}`] : []),
    ...p.review.map((r) => `- **${docName(p)}** · ${cell(label(r.field))} — ${cell(r.note)}${r.snippet ? ` — “${docSnippet(p, r.snippet)}”` : ""}`),
  ]);
  return [
    `## ${adapter.label} (\`${adapter.collection}\`)`,
    "",
    ...summaryTable(result, apply, fillVerb),
    `### Chi tiết giá trị ${fillVerb.toLowerCase()}`,
    "",
    ...(rows.length > 0 ? ["| Tin | Trường | Giá trị | Đoạn nguồn | Nguồn | Độ tin cậy |", "|---|---|---|---|---|---|", ...rows] : ["Không có giá trị nào."]),
    "",
    "### Cần admin soát",
    "",
    ...(notes.length > 0 ? notes : ["Không có mục cần soát."]),
    "",
  ];
}

export function renderBackfillReport(results: readonly CollectionResult[], options: { apply: boolean; ranAt: string }): string {
  return [
    "# Báo cáo điền dữ liệu cũ — listing fields (BL-052)",
    "",
    `- Thời điểm chạy: ${options.ranAt}`,
    `- Chế độ: ${options.apply ? "**Ghi thật (`--apply`)**" : "**Chạy thử (dry-run) — KHÔNG ghi DB**; chạy lại với `--apply` để ghi"}`,
    `- Collection: ${results.map((r) => `\`${r.adapter.collection}\``).join(", ")}`,
    "- Quy tắc: chỉ điền ô đang trống (không ghi đè giá trị admin đã nhập), trích từ nội dung tiếng Việt; không xuất bản / đổi trạng thái tin; không xếp job dịch tự động.",
    "- Độ tin cậy: **cao** = từ tên / tiêu đề / danh mục / bảng giá / danh sách tiện ích; **trung bình** = từ mô tả ngắn / tóm tắt / tổng quan / nội dung (cần soát).",
    "- Giá trị mơ hồ (nhiều giá trị khác nhau, chỉ có khoảng, hướng ban công…) không điền — ghi ở \"Cần admin soát\". Tin BĐS ưu đãi / voucher bỏ qua cả tin.",
    "- Tin chưa xuất bản chỉ ghi id + trường + giá trị (không tên, không đoạn nội dung).",
    "",
    ...results.flatMap((r) => collectionSection(r, options.apply)),
  ].join("\n");
}
