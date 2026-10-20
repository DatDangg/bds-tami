import { Fragment, type ReactNode } from "react";
import { type MediaImage, ResponsiveImage } from "@/components/media/ResponsiveImage";
import { resolveInternalDocHref } from "@/lib/content/doc-link";
import { isSectionHeading, isTocHeading, sectionHeadingId } from "@/lib/content/section-headings";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";

/**
 * Render nội dung Lexical (trường `richText` của Payload) bằng danh sách node ĐƯỢC PHÉP, không dùng HTML thô:
 * mọi chữ đi qua React nên bị escape; node lạ (`html`, `block`, `script`...) bị bỏ cả nhánh chứ không render. Link chỉ nhận
 * `http(s)`, `mailto`, `tel` hoặc đường dẫn nội bộ (chặn `javascript:`, `data:`); link ra ngoài luôn `rel="noopener noreferrer"`.
 * Dùng chung cho mọi trang chi tiết có nội dung dài (tin tức, dự án, dịch vụ...). Server Component; khung rộng do nơi dùng đặt.
 */

interface LexicalNode {
  type?: unknown;
  children?: unknown;
  [key: string]: unknown;
}

/** Chặn cây lồng quá sâu (dữ liệu bẩn ghi thẳng DB) làm tràn stack khi render. */
const MAX_DEPTH = 20;

// Bit `format` của text node Lexical.
const FORMAT_BOLD = 1;
const FORMAT_ITALIC = 2;
const FORMAT_STRIKETHROUGH = 4;
const FORMAT_UNDERLINE = 8;
const FORMAT_CODE = 16;
const FORMAT_SUBSCRIPT = 32;
const FORMAT_SUPERSCRIPT = 64;

const BLOCK_SPACING = "mb-5 last:mb-0";

const TEXT_CLASS = {
  p: cn("text-body", BLOCK_SPACING),
  h2: "mt-10 mb-4 font-display text-h2-sm first:mt-0",
  h3: "mt-8 mb-3 font-display text-h3 first:mt-0",
  quote: cn("border-l-2 border-primary pl-6 text-lead italic", BLOCK_SPACING),
  list: cn("ml-6 text-body marker:text-accent-text", BLOCK_SPACING),
  link: "text-accent-text underline underline-offset-4 hover:text-text",
  code: "rounded-sm bg-surface-muted px-1 py-0.5 font-mono text-[0.9em]",
  figure: cn("my-8", "first:mt-0"),
  caption: "mt-2 text-small text-text-muted",
  tableWrap: cn("overflow-x-auto", BLOCK_SPACING),
  table: "w-full border-collapse text-small",
  cell: "border border-border px-3 py-2 text-left align-top",
} as const;

const asNodes = (value: unknown): LexicalNode[] =>
  Array.isArray(value) ? value.filter((child): child is LexicalNode => typeof child === "object" && child !== null) : [];

/** URL cho `href`: chuỗi đã bỏ khoảng trắng nếu thuộc nhóm cho phép, ngược lại `null` (link bị bỏ, giữ chữ). */
export function safeHref(raw: unknown): { href: string; external: boolean } | null {
  if (typeof raw !== "string") return null;
  const href = raw.trim();
  if (href === "" || /[\u0000-\u001f\u007f\s]/.test(href)) return null;
  // `//host` là URL tuyệt đối theo giao thức hiện tại: coi là ra ngoài và không nhận (không rõ đích).
  if (href.startsWith("/") && !href.startsWith("//") && !href.startsWith("/\\")) return { href, external: false };
  if (href.startsWith("#")) return { href, external: false };
  try {
    const { protocol } = new URL(href);
    if (protocol === "http:" || protocol === "https:") return { href, external: true };
    if (protocol === "mailto:" || protocol === "tel:") return { href, external: false };
  } catch {
    return null;
  }
  return null;
}

function renderText(node: LexicalNode, key: number): ReactNode {
  if (typeof node.text !== "string" || node.text === "") return null;
  const format = typeof node.format === "number" ? node.format : 0;
  let content: ReactNode = node.text;
  if (format & FORMAT_CODE) content = <code className={TEXT_CLASS.code}>{content}</code>;
  if (format & FORMAT_BOLD) content = <strong>{content}</strong>;
  if (format & FORMAT_ITALIC) content = <em>{content}</em>;
  if (format & FORMAT_UNDERLINE) content = <u>{content}</u>;
  if (format & FORMAT_STRIKETHROUGH) content = <s>{content}</s>;
  if (format & FORMAT_SUBSCRIPT) content = <sub>{content}</sub>;
  if (format & FORMAT_SUPERSCRIPT) content = <sup>{content}</sup>;
  return <Fragment key={key}>{content}</Fragment>;
}

function renderLink(node: LexicalNode, key: number, depth: number, ctx: RenderContext): ReactNode {
  const fields = (typeof node.fields === "object" && node.fields !== null ? node.fields : {}) as { url?: unknown; newTab?: unknown; linkType?: unknown };
  const target = fields.linkType === "internal" ? resolveInternalTarget(node, ctx) : safeHref(fields.url);
  const inner = renderChildren(node.children, depth + 1, ctx);
  if (!target) return <Fragment key={key}>{inner}</Fragment>;
  const opensNewTab = fields.newTab === true;
  return (
    <a
      key={key}
      href={target.href}
      className={TEXT_CLASS.link}
      {...(opensNewTab ? { target: "_blank" } : {})}
      {...(target.external || opensNewTab ? { rel: "noopener noreferrer" } : {})}
    >
      {inner}
    </a>
  );
}

/** Link nội bộ (`doc`): chỉ thành link khi biết ngôn ngữ và doc đã populate có trang công khai (xem `resolveInternalDocHref`); không thì giữ chữ. */
function resolveInternalTarget(node: LexicalNode, ctx: RenderContext): { href: string; external: false } | null {
  const fields = (typeof node.fields === "object" && node.fields !== null ? node.fields : {}) as { doc?: unknown };
  const href = ctx.locale ? resolveInternalDocHref(fields.doc, ctx.locale) : null;
  return href ? { href, external: false } : null;
}

/** Ảnh upload từ `media` đã populate (depth ≥ 1); id chưa populate hoặc không phải ảnh thì bỏ qua. */
function renderUpload(node: LexicalNode, key: number): ReactNode {
  const value = node.value as (MediaImage & { caption?: string | null; mimeType?: string | null }) | string | null | undefined;
  if (node.relationTo !== "media" || !value || typeof value !== "object" || !value.url) return null;
  if (value.mimeType && !value.mimeType.startsWith("image/")) return null;
  const aspectRatio = value.width && (value as { height?: number | null }).height ? `${value.width}/${(value as { height?: number | null }).height}` : undefined;
  return (
    <figure key={key} className={TEXT_CLASS.figure}>
      <ResponsiveImage media={value} sizes="(min-width: 1024px) 768px, 100vw" aspectRatio={aspectRatio ?? "16/9"} />
      {value.caption && <figcaption className={TEXT_CLASS.caption}>{value.caption}</figcaption>}
    </figure>
  );
}

function renderList(node: LexicalNode, key: number, depth: number, ctx: RenderContext): ReactNode {
  const items = renderChildren(node.children, depth + 1, ctx);
  return node.listType === "number" ? (
    <ol key={key} className={cn(TEXT_CLASS.list, "list-decimal")}>
      {items}
    </ol>
  ) : (
    <ul key={key} className={cn(TEXT_CLASS.list, "list-disc")}>
      {items}
    </ul>
  );
}

function renderTable(node: LexicalNode, key: number, depth: number, ctx: RenderContext): ReactNode {
  return (
    // Vùng cuộn ngang tới được bằng bàn phím: cần role + tên để trình đọc màn hình biết đó là gì (nhãn do nơi dùng dịch).
    <div
      key={key}
      className={TEXT_CLASS.tableWrap}
      tabIndex={0}
      {...(ctx.tableLabel ? { role: "region", "aria-label": ctx.tableLabel } : {})}
    >
      <table className={TEXT_CLASS.table}>
        <tbody>{renderChildren(node.children, depth + 1, ctx)}</tbody>
      </table>
    </div>
  );
}

function renderCell(node: LexicalNode, key: number, depth: number, ctx: RenderContext): ReactNode {
  const Tag = typeof node.headerState === "number" && node.headerState > 0 ? "th" : "td";
  return (
    <Tag key={key} className={cn(TEXT_CLASS.cell, Tag === "th" && "bg-surface-muted font-semibold")}>
      {renderChildren(node.children, depth + 1, ctx)}
    </Tag>
  );
}

function headingTag(tag: unknown): "h2" | "h3" {
  // Trang đã có `h1` là tiêu đề bài: `h1`/`h2` trong nội dung thành `h2`, cấp sâu hơn thành `h3` (không nhảy cấp, không thêm `h1`).
  return tag === "h1" || tag === "h2" ? "h2" : "h3";
}

function renderNode(node: LexicalNode, key: number, depth: number, ctx: RenderContext): ReactNode {
  if (depth > MAX_DEPTH) return null;
  switch (node.type) {
    case "text":
      return renderText(node, key);
    case "linebreak":
      return <br key={key} />;
    case "link":
    case "autolink":
      return renderLink(node, key, depth, ctx);
    case "paragraph": {
      const children = renderChildren(node.children, depth + 1, ctx);
      // Đoạn rỗng (Enter thừa trong editor) không render khoảng cách trống.
      const empty = asNodes(node.children).every((child) => child.type === "text" && !child.text);
      return empty ? null : (
        <p key={key} className={TEXT_CLASS.p}>
          {children}
        </p>
      );
    }
    case "heading": {
      const Tag = headingTag(node.tag);
      const tocId = ctx.toc && depth === 0 && isTocHeading(node) ? ctx.toc.ids[ctx.toc.count++] : undefined;
      if (tocId) {
        // Trang chi tiết dùng `--sticky-top` (BL-027) chứ không phải `--header-offset`; `tabIndex=-1` để mục lục chuyển focus vào heading.
        return (
          <Tag key={key} id={tocId} tabIndex={-1} className={cn(TEXT_CLASS[Tag], "scroll-mt-[calc(var(--sticky-top)+1rem)] focus:outline-none")}>
            {renderChildren(node.children, depth + 1, ctx)}
          </Tag>
        );
      }
      const id = ctx.sections && depth === 0 && isSectionHeading(node) ? sectionHeadingId(ctx.sections.count++) : undefined;
      return (
        <Tag key={key} id={id} className={cn(TEXT_CLASS[Tag], id && "scroll-mt-[calc(var(--header-offset)+1rem)]")}>
          {renderChildren(node.children, depth + 1, ctx)}
        </Tag>
      );
    }
    case "quote":
      return (
        <blockquote key={key} className={TEXT_CLASS.quote}>
          {renderChildren(node.children, depth + 1, ctx)}
        </blockquote>
      );
    case "list":
      return renderList(node, key, depth, ctx);
    case "listitem":
      return <li key={key}>{renderChildren(node.children, depth + 1, ctx)}</li>;
    case "horizontalrule":
      return <hr key={key} className="my-8 border-border" />;
    case "upload":
      return renderUpload(node, key);
    case "table":
      return renderTable(node, key, depth, ctx);
    case "tablerow":
      return <tr key={key}>{renderChildren(node.children, depth + 1, ctx)}</tr>;
    case "tablecell":
      return renderCell(node, key, depth, ctx);
    default:
      // Node không có trong danh sách (html, block, relationship...) bị bỏ cả nhánh: không bao giờ render nội dung tuỳ ý.
      return null;
  }
}

function renderChildren(children: unknown, depth: number, ctx: RenderContext): ReactNode {
  return asNodes(children).map((child, index) => renderNode(child, index, depth, ctx));
}

/** Thông tin ngoài cây Lexical mà node cần khi render (đi xuyên mọi cấp). */
interface RenderContext {
  locale: Locale | undefined;
  tableLabel: string | undefined;
  /** Có giá trị khi bật `anchorSections`: đếm `h2` cấp gốc đã gắn `id` (khớp `collectSectionHeadings`). */
  sections: { count: number } | undefined;
  /** Có giá trị khi truyền `headingIds`: `id` gắn lần lượt lên heading cấp gốc có chữ (khớp `collectTocHeadings`). */
  toc: { ids: readonly string[]; count: number } | undefined;
}

interface RichTextProps {
  /** Giá trị trường richText: `{ root: { children: [...] } }`. Thiếu/sai dạng thì không render gì. */
  data: unknown;
  className?: string;
  /** Ngôn ngữ trang: cần để link nội bộ (`doc`) thành link thật; thiếu thì link nội bộ giữ chữ. */
  locale?: Locale;
  /** Tên (đã dịch) của vùng cuộn bảng cho trình đọc màn hình; thiếu thì vùng cuộn không có role. */
  tableLabel?: string;
  /** Gắn `id` (`muc-1`, `muc-2`...) lên các `h2` cấp gốc để mục lục (`collectSectionHeadings`) trỏ tới. */
  anchorSections?: boolean;
  /** Gắn `id` lên heading cấp gốc có chữ (h2 + h3) theo thứ tự, từ `collectTocHeadings` (mục lục chi tiết tin tức); thiếu thì không gắn. */
  headingIds?: readonly string[];
}

export function RichText({ data, className, locale, tableLabel, anchorSections = false, headingIds }: RichTextProps) {
  const root = typeof data === "object" && data !== null ? (data as { root?: LexicalNode }).root : undefined;
  if (!root || typeof root !== "object") return null;
  // `break-words` + `overflow-wrap:anywhere`: URL/chuỗi dài không đẩy trang cuộn ngang ở 375px.
  return <div className={cn("break-words [overflow-wrap:anywhere]", className)}>{renderChildren(root.children, 0, { locale, tableLabel, sections: anchorSections ? { count: 0 } : undefined, toc: headingIds ? { ids: headingIds, count: 0 } : undefined })}</div>;
}
