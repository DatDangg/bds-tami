import path from "node:path";

/**
 * Phần thuần (không đụng DB/đĩa) của `pnpm content:import` (BL-072): kiểm confirm, đọc frontmatter/markdown của tin, đường dẫn ảnh, báo cáo kế hoạch.
 * Engine ghi nằm ở `import.ts`; xem `seed/content/README.md`.
 */

/** Tên bộ dữ liệu = tên thư mục `seed/content/<tên>/` = giá trị `IMPORT_CONFIRM` phải đặt để `apply`. */
export const CONTENT_DATASET = "2026-10-23";
export const IMPORT_CONFIRM_ENV = "IMPORT_CONFIRM";

/** Lý do KHÔNG được ghi, hoặc `null`. Dry-run không cần confirm; `apply` cần env bằng đúng tên bộ dữ liệu (kể cả production). */
export function importConfirmProblem(dataset: string, apply: boolean, env: Record<string, string | undefined>): string | null {
  if (!apply) return null;
  return env[IMPORT_CONFIRM_ENV] === dataset ? null : `apply cần ${IMPORT_CONFIRM_ENV}=${dataset} (hiện: ${env[IMPORT_CONFIRM_ENV] ? "khác tên bộ dữ liệu" : "chưa đặt"})`;
}

/** `apply` là tham số vị trí (`payload run` nuốt cờ `--x`); tham số khác → `unknown` để từ chối thay vì lặng lẽ chạy dry-run. */
export function parseImportArgs(argv: readonly string[]): { apply: boolean; unknown: string[] } {
  return { apply: argv.includes("apply"), unknown: argv.filter((arg) => arg !== "apply") };
}

/** Đường dẫn trong `manifest.json` / `news-covers.json` tính từ `IMPORT_IMG_DIR` (tiền tố `img/` của bản cũ được bỏ qua); đường dẫn tuyệt đối giữ nguyên. */
export function resolveImagePath(imgDir: string, file: string): string {
  if (path.isAbsolute(file)) return file;
  return path.join(imgDir, file.replace(/^img[\\/]/, ""));
}

/** Bảng markdown → danh sách (editor không có Table feature). Checklist "- [ ]" → gạch đầu dòng. */
export function normaliseMarkdown(md: string): string {
  const lines = md.replace(/\r/g, "").split("\n");
  const out: string[] = [];
  const isRow = (line: string | undefined) => !!line && /^\s*\|.*\|\s*$/.test(line);
  const cells = (line: string) => line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (isRow(line) && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] ?? "")) {
      const raw = cells(line);
      // Cột số thứ tự ("#", "STT") không mang nghĩa khi thành danh sách: bỏ đi.
      const skip = /^(#|stt|tt)$/i.test(raw[0] ?? "") ? 1 : 0;
      const head = raw.slice(skip);
      i += 2;
      for (; isRow(lines[i]); i++) {
        const row = cells(lines[i]!).slice(skip);
        const rest = row.slice(1).map((cell, k) => (cell && cell !== "—" ? `${head[k + 1]}: ${cell}` : "")).filter(Boolean);
        out.push(`- **${row[0]}**${rest.length ? ` — ${rest.join("; ")}` : ""}`);
      }
      i--;
      out.push("");
      continue;
    }
    out.push(line.replace(/^(\s*)- \[[ x]\] /, "$1- "));
  }
  return out.join("\n");
}

export function parseFrontmatter(md: string): { meta: Record<string, string>; body: string } {
  const match = md.replace(/\r/g, "").match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error("Thiếu frontmatter");
  const meta: Record<string, string> = {};
  for (const line of match[1]!.split("\n")) {
    const pair = line.match(/^(\w+):\s*(.*)$/);
    if (pair) meta[pair[1]!] = pair[2]!.replace(/^"(.*)"$/, "$1");
  }
  return { meta, body: match[2]!.trim() };
}

/** `tags: [a, "b"]` → `["a", "b"]`. */
export const parseTags = (raw: string | undefined): string[] =>
  (raw ?? "").replace(/^\[|\]$/g, "").split(",").map((tag) => tag.trim().replace(/^"|"$/g, "")).filter(Boolean);

/** Lỗi dữ liệu của một tin trước khi ghi: thiếu slug/tiêu đề, còn `[CẦN KIỂM TRA]`, thiếu ảnh bìa khi xuất bản. Tin đã có trong DB sẽ bị bỏ qua nên không bị kiểm (không chặn apply). */
export function checkNewsEntry(entry: { file: string; meta: Record<string, string>; body: string; hasCover: boolean; status: "published" | "draft"; alreadyExists?: boolean }): string[] {
  if (entry.alreadyExists) return [];
  const problems: string[] = [];
  if (!entry.meta.slug) problems.push(`${entry.file}: thiếu slug`);
  if (!entry.meta.title) problems.push(`${entry.file}: thiếu title`);
  if (/CẦN KIỂM TRA/.test(entry.body)) problems.push(`${entry.file}: còn [CẦN KIỂM TRA]`);
  if (!entry.hasCover && entry.status === "published") problems.push(`${entry.file}: thiếu ảnh bìa (news-covers.json)`);
  return problems;
}

export type ImportKind = "developer" | "project" | "news-category" | "news" | "media";
export type ImportStatus = "create" | "exists" | "error";
export interface ImportLine {
  kind: ImportKind;
  key: string;
  status: ImportStatus;
  detail?: string;
}

export const countImportProblems = (lines: readonly ImportLine[]): number => lines.filter((line) => line.status === "error").length;

const STATUS_LABEL: Record<ImportStatus, string> = { create: "sẽ tạo", exists: "đã có, bỏ qua", error: "LỖI" };
export const formatImportLine = (line: ImportLine, applied: boolean): string => {
  const label = line.status === "create" && applied ? "đã tạo" : STATUS_LABEL[line.status];
  return `[${line.kind}] ${label}: ${line.key}${line.detail ? ` — ${line.detail}` : ""}`;
};
