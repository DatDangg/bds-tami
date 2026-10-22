import { forEachBlockTextSlot } from "../../blocks/news/text-fields";

/** Tốc độ đọc ước tính (từ/phút) cho tiếng Việt và tiếng Anh; chỉ để hiện "5 phút đọc", không cần chính xác. */
const WORDS_PER_MINUTE = 200;
const MAX_DEPTH = 40;

function collectText(node: unknown, parts: string[], depth: number): void {
  if (depth > MAX_DEPTH || typeof node !== "object" || node === null) return;
  const { type, text, children, fields } = node as { type?: unknown; text?: unknown; children?: unknown; fields?: unknown };
  if (type === "text" && typeof text === "string") parts.push(text);
  // Chữ trong khối chèn Tin tức (Số liệu nổi bật, Ảnh cạnh chữ — BL-054) cũng là chữ người đọc phải đọc.
  if (type === "block") forEachBlockTextSlot(fields, (holder, key) => parts.push(holder[key] as string));
  if (Array.isArray(children)) for (const child of children) collectText(child, parts, depth + 1);
}

/** Chữ thuần của một giá trị richText (Lexical); thiếu/sai dạng → chuỗi rỗng. */
export function lexicalPlainText(content: unknown): string {
  const parts: string[] = [];
  collectText((content as { root?: unknown } | null | undefined)?.root, parts, 0);
  return parts.join(" ");
}

/** Số phút đọc ước tính, tối thiểu 1. */
export function estimateReadMinutes(content: unknown): number {
  const words = lexicalPlainText(content).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
