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
const MAX_TEXT_NODES = 2_000;

function isNode(value: unknown): value is LexicalNode {
  return typeof value === "object" && value !== null && typeof (value as { type?: unknown }).type === "string";
}

export function isLexicalRoot(value: unknown): value is LexicalRoot {
  return typeof value === "object" && value !== null && isNode((value as { root?: unknown }).root);
}

/** Gọi `visit` cho từng node `text` theo thứ tự tài liệu. Chỉ đi theo `children`; `fields` của link/upload/block KHÔNG được duyệt. */
function walkTextNodes(node: LexicalNode, visit: (textNode: LexicalNode) => void, depth = 0): void {
  if (depth > MAX_DEPTH) throw new TranslationError("invalid_input");
  if (node.type === "text") {
    if (typeof node.text !== "string") throw new TranslationError("invalid_input");
    visit(node);
    return;
  }
  if (node.children === undefined) return;
  if (!Array.isArray(node.children)) throw new TranslationError("invalid_input");
  for (const child of node.children) {
    if (!isNode(child)) throw new TranslationError("invalid_input");
    walkTextNodes(child, visit, depth + 1);
  }
}

/** Chữ của mọi text node, theo thứ tự. Đây là phần DUY NHẤT của richText được gửi đi. */
export function extractTextNodes(content: LexicalRoot): string[] {
  const texts: string[] = [];
  walkTextNodes(content.root, (node) => {
    texts.push(node.text as string);
    if (texts.length > MAX_TEXT_NODES) throw new TranslationError("invalid_input");
  });
  return texts;
}

/** Cây giữ nguyên mọi thứ trừ `text` của text node (che thành ""); dùng để so cấu trúc trước/sau khi dịch. */
function skeletonOf(content: LexicalRoot): string {
  return JSON.stringify(content, (key, value: unknown) => (key === "text" && typeof value === "string" ? "" : value));
}

/**
 * Ghép bản dịch (đúng thứ tự `extractTextNodes`) vào BẢN SAO của cây gốc; chỉ `text` đổi. Sau đó kiểm lại bằng so sánh
 * khung cây: số lượng/loại node, format, link, ảnh... phải y hệt, lệch là lỗi `invalid_output` và không có gì được lưu.
 */
export function applyTextNodes(content: LexicalRoot, translated: readonly string[]): LexicalRoot {
  const rebuilt = structuredClone(content);
  let index = 0;
  walkTextNodes(rebuilt.root, (node) => {
    const next = translated[index++];
    if (typeof next !== "string") throw new TranslationError("invalid_output");
    node.text = next;
  });
  if (index !== translated.length || skeletonOf(rebuilt) !== skeletonOf(content)) {
    throw new TranslationError("invalid_output");
  }
  return rebuilt;
}
