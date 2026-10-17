import { Fragment, type ReactNode } from "react";
import { type MediaImage, ResponsiveImage } from "@/components/media/ResponsiveImage";
import { cn } from "@/lib/utils";

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
  h2: "mt-10 mb-4 font-display text-h2 first:mt-0",
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

function renderLink(node: LexicalNode, key: number, depth: number): ReactNode {
  const fields = (typeof node.fields === "object" && node.fields !== null ? node.fields : {}) as { url?: unknown; newTab?: unknown; linkType?: unknown };
  const target = fields.linkType === "internal" ? null : safeHref(fields.url);
  const inner = renderChildren(node.children, depth + 1);
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

function renderList(node: LexicalNode, key: number, depth: number): ReactNode {
  const items = renderChildren(node.children, depth + 1);
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

function renderTable(node: LexicalNode, key: number, depth: number): ReactNode {
  return (
    <div key={key} className={TEXT_CLASS.tableWrap} tabIndex={0}>
      <table className={TEXT_CLASS.table}>
        <tbody>{renderChildren(node.children, depth + 1)}</tbody>
      </table>
    </div>
  );
}

function renderCell(node: LexicalNode, key: number, depth: number): ReactNode {
  const Tag = typeof node.headerState === "number" && node.headerState > 0 ? "th" : "td";
  return (
    <Tag key={key} className={cn(TEXT_CLASS.cell, Tag === "th" && "bg-surface-muted font-semibold")}>
      {renderChildren(node.children, depth + 1)}
    </Tag>
  );
}

function headingTag(tag: unknown): "h2" | "h3" {
  // Trang đã có `h1` là tiêu đề bài: `h1`/`h2` trong nội dung thành `h2`, cấp sâu hơn thành `h3` (không nhảy cấp, không thêm `h1`).
  return tag === "h1" || tag === "h2" ? "h2" : "h3";
}

function renderNode(node: LexicalNode, key: number, depth: number): ReactNode {
  if (depth > MAX_DEPTH) return null;
  switch (node.type) {
    case "text":
      return renderText(node, key);
    case "linebreak":
      return <br key={key} />;
    case "link":
    case "autolink":
      return renderLink(node, key, depth);
    case "paragraph": {
      const children = renderChildren(node.children, depth + 1);
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
      return (
        <Tag key={key} className={TEXT_CLASS[Tag]}>
          {renderChildren(node.children, depth + 1)}
        </Tag>
      );
    }
    case "quote":
      return (
        <blockquote key={key} className={TEXT_CLASS.quote}>
          {renderChildren(node.children, depth + 1)}
        </blockquote>
      );
    case "list":
      return renderList(node, key, depth);
    case "listitem":
      return <li key={key}>{renderChildren(node.children, depth + 1)}</li>;
    case "horizontalrule":
      return <hr key={key} className="my-8 border-border" />;
    case "upload":
      return renderUpload(node, key);
    case "table":
      return renderTable(node, key, depth);
    case "tablerow":
      return <tr key={key}>{renderChildren(node.children, depth + 1)}</tr>;
    case "tablecell":
      return renderCell(node, key, depth);
    default:
      // Node không có trong danh sách (html, block, relationship...) bị bỏ cả nhánh: không bao giờ render nội dung tuỳ ý.
      return null;
  }
}

function renderChildren(children: unknown, depth: number): ReactNode {
  return asNodes(children).map((child, index) => renderNode(child, index, depth));
}

interface RichTextProps {
  /** Giá trị trường richText: `{ root: { children: [...] } }`. Thiếu/sai dạng thì không render gì. */
  data: unknown;
  className?: string;
}

export function RichText({ data, className }: RichTextProps) {
  const root = typeof data === "object" && data !== null ? (data as { root?: LexicalNode }).root : undefined;
  if (!root || typeof root !== "object") return null;
  return <div className={className}>{renderChildren(root.children, 0)}</div>;
}
