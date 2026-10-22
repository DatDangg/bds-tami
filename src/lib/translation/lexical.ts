import { forEachBlockTextSlot } from "../../blocks/news/text-fields";
import { TranslationError } from "./errors";

/** Node Lexical tối thiểu mà ta cần biết; mọi trường khác (format, tag, url, giá trị upload...) đi qua nguyên vẹn. */
export interface LexicalNode {
  type: string;
  text?: unknown;
  children?: unknown;
  [key: string]: unknown;
}
export interface LexicalRoot {
  root: LexicalNode;
  [key: string]: unknown;
}

const MAX_DEPTH = 40;
/** Trần số ô chữ (text node + chữ trong khối) của một richText. */
const MAX_TEXT_NODES = 2_000;

type Holder = Record<string, unknown>;
/** Một ô chữ: `holder[key]` là chuỗi cần dịch (text node: `node.text`; khối: `fields.text`, `fields.items[i].label`...). */
type VisitSlot = (holder: Holder, key: string) => void;

const isRecord = (value: unknown): value is Holder => typeof value === "object" && value !== null && !Array.isArray(value);

function isNode(value: unknown): value is LexicalNode {
  return isRecord(value) && typeof value.type === "string";
}

export function isLexicalRoot(value: unknown): value is LexicalRoot {
  return typeof value === "object" && value !== null && isNode((value as { root?: unknown }).root);
}

/**
 * Gọi `visit` cho từng ô chữ theo thứ tự tài liệu: `text` của text node, và chữ trong khối chèn (`block`) theo `NEWS_BLOCK_TEXT_FIELDS`
 * (`src/blocks/news/text-fields.ts`; id, quan hệ, ảnh, select của khối đi nguyên). Chỉ đi theo `children`; `fields` của link/upload và
 * của khối lạ KHÔNG được duyệt.
 */
function walkSlots(node: LexicalNode, visit: VisitSlot, depth = 0): void {
  if (depth > MAX_DEPTH) throw new TranslationError("invalid_input");
  if (node.type === "text") {
    if (typeof node.text !== "string") throw new TranslationError("invalid_input");
    visit(node, "text");
    return;
  }
  if (node.type === "block") {
    forEachBlockTextSlot(node.fields, visit);
    return;
  }
  if (node.children === undefined) return;
  if (!Array.isArray(node.children)) throw new TranslationError("invalid_input");
  for (const child of node.children) {
    if (!isNode(child)) throw new TranslationError("invalid_input");
    walkSlots(child, visit, depth + 1);
  }
}

/** Chữ của mọi ô chữ, theo thứ tự. Đây là phần DUY NHẤT của richText được gửi đi. */
export function extractTextNodes(content: LexicalRoot): string[] {
  const texts: string[] = [];
  walkSlots(content.root, (holder, key) => {
    texts.push(holder[key] as string);
    if (texts.length > MAX_TEXT_NODES) throw new TranslationError("invalid_input");
  });
  return texts;
}

/** Cây giữ nguyên mọi thứ trừ các ô chữ (che thành ""); dùng để so cấu trúc trước/sau khi dịch. */
function skeletonOf(content: LexicalRoot): string {
  const masked = structuredClone(content);
  walkSlots(masked.root, (holder, key) => {
    holder[key] = "";
  });
  return JSON.stringify(masked);
}

/**
 * Ghép bản dịch (đúng thứ tự `extractTextNodes`) vào BẢN SAO của cây gốc; chỉ ô chữ đổi. Sau đó kiểm lại bằng so sánh khung cây:
 * số lượng/loại node, format, link, ảnh, trường không phải chữ của khối... phải y hệt, lệch là lỗi `invalid_output` và không có gì được lưu.
 */
export function applyTextNodes(content: LexicalRoot, translated: readonly string[]): LexicalRoot {
  const rebuilt = structuredClone(content);
  let index = 0;
  walkSlots(rebuilt.root, (holder, key) => {
    const next = translated[index++];
    if (typeof next !== "string") throw new TranslationError("invalid_output");
    holder[key] = next;
  });
  if (index !== translated.length || skeletonOf(rebuilt) !== skeletonOf(content)) {
    throw new TranslationError("invalid_output");
  }
  return rebuilt;
}
