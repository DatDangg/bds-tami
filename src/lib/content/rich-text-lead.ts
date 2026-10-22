import { renderableUploadImage } from "./rich-text-upload";

const MAX_DEPTH = 20;
/** Block mà `RichText` dựng được dù không có chữ (bảng, đường kẻ); ảnh `upload` xét riêng qua `renderableUploadImage`. */
const NON_TEXT_BLOCKS = new Set(["table", "horizontalrule"]);

interface LexicalNodeLike {
  type?: unknown;
  text?: unknown;
  children?: unknown;
  relationTo?: unknown;
  value?: unknown;
}

const asNodes = (value: unknown): LexicalNodeLike[] =>
  Array.isArray(value) ? value.filter((child): child is LexicalNodeLike => typeof child === "object" && child !== null) : [];

/** Chữ của một node inline: nối text node bằng "" (chữ đậm / link là node riêng, đã mang sẵn khoảng trắng), `linebreak`/`tab` → " ", đệ quy qua link. */
function inlineText(node: LexicalNodeLike, depth: number): string {
  if (depth > MAX_DEPTH) return "";
  if (node.type === "text") return typeof node.text === "string" ? node.text : "";
  if (node.type === "linebreak" || node.type === "tab") return " ";
  return asNodes(node.children)
    .map((child) => inlineText(child, depth + 1))
    .join("");
}

const collapseSpaces = (text: string): string => text.replace(/\s+/g, " ").trim();
const blockText = (block: LexicalNodeLike): string => collapseSpaces(inlineText(block, 0));

/**
 * Block có hiển thị được không: có chữ, là bảng / đường kẻ, hoặc là ảnh `upload` mà `RichText` dựng được
 * (BL-057: media đã xoá / chưa populate / không phải ảnh → không tính; block lạ `RichText` bỏ → coi là không hiển thị).
 */
function isVisibleBlock(block: LexicalNodeLike): boolean {
  if (blockText(block) !== "") return true;
  if (block.type === "upload") return renderableUploadImage(block) !== null;
  return typeof block.type === "string" && NON_TEXT_BLOCKS.has(block.type);
}

const rootBlocks = (content: unknown): LexicalNodeLike[] => asNodes((content as { root?: { children?: unknown } } | null | undefined)?.root?.children);

/** Đoạn văn (paragraph) đầu tiên có chữ của richText Lexical, trích thành text thuần; không có → `null`. Bỏ heading / list / quote / bảng. */
export function firstParagraphText(content: unknown): string | null {
  for (const block of rootBlocks(content)) {
    if (block.type !== "paragraph") continue;
    const text = blockText(block);
    if (text !== "") return text;
  }
  return null;
}

export interface OverviewSplit {
  /** Đoạn dẫn: `summary` nếu có, không thì đoạn đầu của richText. */
  lead: string | null;
  /** Phần richText còn hiển thị được ngoài đoạn đã dùng làm đoạn dẫn; `null` khi không còn gì (→ không có nút "Xem thêm"). */
  rest: unknown;
}

/**
 * Tách khối Tổng quan (BL-056): đoạn dẫn + phần mở rộng. Lấy đoạn dẫn từ richText thì bỏ đúng block đó khỏi phần mở rộng (không lặp);
 * mọi block hiển thị được còn lại (kể cả ảnh / bảng không chữ) đều tính là nội dung thêm.
 */
export function splitOverview(content: unknown, summary?: string | null): OverviewSplit {
  const blocks = rootBlocks(content);
  const summaryText = summary ? collapseSpaces(summary) : "";
  let leadBlock: LexicalNodeLike | null = null;
  let lead: string | null = summaryText || null;
  if (lead === null) {
    leadBlock = blocks.find((block) => block.type === "paragraph" && blockText(block) !== "") ?? null;
    lead = leadBlock ? blockText(leadBlock) : null;
  }
  const remaining = blocks.filter((block) => block !== leadBlock && isVisibleBlock(block));
  return { lead, rest: remaining.length > 0 ? { root: { type: "root", children: remaining } } : null };
}
