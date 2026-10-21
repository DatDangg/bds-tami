/** Tiện ích chữ cho bộ trích dữ liệu cũ (BL-052): chuẩn hoá, tìm cụm từ khoá tiếng Việt, cắt đoạn nguồn, đọc số kiểu VN. */

const SNIPPET_RADIUS = 45;
const MAX_DEPTH = 40;
const INLINE_NODES = new Set(["text", "link", "autolink", "linebreak", "tab"]);

/** Chuẩn hoá để so khớp: NFC + chữ thường + gộp khoảng trắng (giữ dấu tiếng Việt; NFC/lowercase không đổi độ dài với chữ Việt). */
export const normalizeText = (value: string): string => value.normalize("NFC").toLowerCase();

/** Chữ thuần của richText (Lexical), mỗi khối (đoạn, tiêu đề, mục danh sách) một dòng để cắt đoạn nguồn theo câu. */
export function richTextToPlain(content: unknown): string {
  const parts: string[] = [];
  const walk = (node: unknown, depth: number) => {
    if (depth > MAX_DEPTH || typeof node !== "object" || node === null) return;
    const { type, text, children } = node as { type?: unknown; text?: unknown; children?: unknown };
    if (type === "text" && typeof text === "string") parts.push(text);
    if (type === "linebreak") parts.push("\n");
    if (Array.isArray(children)) for (const child of children) walk(child, depth + 1);
    if (Array.isArray(children) && typeof type === "string" && !INLINE_NODES.has(type)) parts.push("\n");
  };
  walk((content as { root?: unknown } | null | undefined)?.root, 0);
  return parts.join("").replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
}

/** Biểu thức khớp nguyên cụm (không dính chữ/số hai bên); `pattern` là regex con, viết chữ thường. */
export const phraseRegex = (pattern: string, flags = "u"): RegExp => new RegExp(`(?<![\\p{L}\\p{N}])(?:${pattern})(?![\\p{L}\\p{N}])`, flags);

/** Vị trí khớp đầu tiên của một trong các mẫu trong `text` (đã chuẩn hoá), hoặc `null`. */
export function findPhrase(text: string, patterns: readonly string[]): { index: number; length: number } | null {
  const lowered = normalizeText(text);
  let best: { index: number; length: number } | null = null;
  for (const pattern of patterns) {
    const match = phraseRegex(pattern).exec(lowered);
    if (match && (!best || match.index < best.index)) best = { index: match.index, length: match[0].length };
  }
  return best;
}

/** Đoạn nguồn ngắn quanh vị trí khớp (một dòng, có "…" khi bị cắt). */
export function snippetAround(text: string, index: number, length: number, radius = SNIPPET_RADIUS): string {
  const source = text.normalize("NFC");
  const start = Math.max(0, index - radius);
  const end = Math.min(source.length, index + length + radius);
  const body = source.slice(start, end).replace(/\s+/g, " ").trim();
  return `${start > 0 ? "…" : ""}${body}${end < source.length ? "…" : ""}`;
}

/** Số kiểu VN: "1.200" → 1200, "493,9" → 493.9, "9.456" → 9456. Không đọc được → `null`. */
export function parseViNumber(raw: string): number | null {
  const thousands = /^\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(raw);
  const normalized = thousands ? raw.replace(/\./g, "").replace(",", ".") : raw.replace(",", ".");
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/** Viết hoa chữ đầu ("biệt thự song lập" → "Biệt thự song lập"). */
export const capitalize = (value: string): string => value.charAt(0).toLocaleUpperCase("vi") + value.slice(1);
