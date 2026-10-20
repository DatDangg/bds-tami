import { appendUniqueSuffix, slugify } from "@/lib/slug";

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

/**
 * Mục lục bài dài có `h2` + `h3` (chi tiết tin tức, BL-033). Khác `collectSectionHeadings` (`muc-N`, chỉ h2, trang pháp lý): id là slug bỏ dấu của chữ tiêu đề
 * (đọc được trên URL), chống trùng bằng `-2`, `-3`... và tránh cả `reservedIds` (id có sẵn trên trang như `related-news`); tiêu đề không ra chữ nào thì `muc-<thứ tự>`.
 * `RichText` (prop `headingIds`) gắn đúng danh sách id này lên heading cấp gốc theo thứ tự, nên mục lục và nội dung luôn khớp.
 */
export interface TocHeading {
  id: string;
  text: string;
  /** `h1`/`h2` → 2, `h3`–`h6` → 3 (cùng quy tắc `headingTag` của `RichText`). */
  level: 2 | 3;
}

const TOC_ID_MAX_LENGTH = 60;

/** Heading cấp gốc có chữ: đúng tập node mà `RichText` gắn id ở chế độ `headingIds`. */
export const isTocHeading = (node: LexicalLike): boolean => node.type === "heading" && nodePlainText(node) !== "";

export function collectTocHeadings(data: unknown, reservedIds: readonly string[] = []): TocHeading[] {
  const root = typeof data === "object" && data !== null ? (data as { root?: LexicalLike }).root : undefined;
  const taken = new Set(reservedIds);
  const headings: TocHeading[] = [];
  for (const node of asNodes(root?.children)) {
    if (!isTocHeading(node)) continue;
    const text = nodePlainText(node);
    const id = appendUniqueSuffix(slugify(text, TOC_ID_MAX_LENGTH) || `muc-${headings.length + 1}`, taken, TOC_ID_MAX_LENGTH);
    taken.add(id);
    headings.push({ id, text, level: node.tag === "h1" || node.tag === "h2" ? 2 : 3 });
  }
  return headings;
}
