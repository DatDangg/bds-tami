/**
 * Mục lục tự sinh của trang dài (trang pháp lý, S16) từ các `h2` của richText Lexical. `RichText` (bật `anchorSections`) gắn đúng
 * `id` này lên từng `h2` cấp 1 theo THỨ TỰ xuất hiện, nên mục lục và nội dung luôn khớp mà không phụ thuộc chữ tiêu đề (không trùng id).
 * Chỉ xét heading ở cấp gốc của tài liệu, `h1`/`h2` đều thành `h2` (cùng quy tắc `headingTag` của `RichText`).
 */
export interface SectionHeading {
  id: string;
  text: string;
}

interface LexicalLike {
  type?: unknown;
  tag?: unknown;
  text?: unknown;
  children?: unknown;
}

const asNodes = (value: unknown): LexicalLike[] =>
  Array.isArray(value) ? value.filter((child): child is LexicalLike => typeof child === "object" && child !== null) : [];

const rawText = (node: LexicalLike): string => (typeof node.text === "string" ? node.text : "") + asNodes(node.children).map(rawText).join("");

/** Chữ thuần của một node (gộp mọi text con), đã bỏ khoảng trắng đầu/cuối. */
export const nodePlainText = (node: LexicalLike): string => rawText(node).trim();

export const isSectionHeading = (node: LexicalLike): boolean => node.type === "heading" && (node.tag === "h1" || node.tag === "h2") && nodePlainText(node) !== "";

export const sectionHeadingId = (index: number): string => `muc-${index + 1}`;

export function collectSectionHeadings(data: unknown): SectionHeading[] {
  const root = typeof data === "object" && data !== null ? (data as { root?: LexicalLike }).root : undefined;
  return asNodes(root?.children)
    .filter(isSectionHeading)
    .map((node, index) => ({ id: sectionHeadingId(index), text: nodePlainText(node) }));
}
