import type { Where } from "payload";

/** Loại bản ghi `seo.noindex` (theo ngôn ngữ của truy vấn) cho khớp sitemap; `not_equals` giữ cả bản ghi chưa có giá trị. */
export const INDEXABLE_WHERE: Where = { "seo.noindex": { not_equals: true } };

export interface LlmsLink {
  title: string;
  url: string;
  description?: string | null;
}

export interface LlmsSection {
  heading: string;
  links: readonly LlmsLink[];
}

export interface LlmsInput {
  siteName: string;
  summary: string;
  /** Dòng liên hệ thật từ site-settings (hotline, email, địa chỉ); bỏ trống thì không in. */
  contactLines: readonly string[];
  sections: readonly LlmsSection[];
}

/** Một dòng văn bản: gộp xuống dòng/khoảng trắng để link markdown không bị vỡ. */
function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Tiêu đề trong `[...]` của markdown không được chứa `]`. */
function linkLabel(title: string): string {
  return oneLine(title).replace(/[[\]]/g, "");
}

/** `llms.txt` theo chuẩn llmstxt.org: H1 tên site, blockquote tóm tắt, rồi các mục H2 gồm danh sách link kèm mô tả một dòng. Mục không có link bị bỏ. */
export function renderLlmsTxt({ siteName, summary, contactLines, sections }: LlmsInput): string {
  const lines = [`# ${oneLine(siteName)}`, "", `> ${oneLine(summary)}`];
  if (contactLines.length > 0) lines.push("", ...contactLines.map((line) => oneLine(line)));
  for (const section of sections) {
    if (section.links.length === 0) continue;
    lines.push("", `## ${section.heading}`);
    for (const link of section.links) {
      const description = link.description ? oneLine(link.description) : "";
      lines.push(`- [${linkLabel(link.title)}](${link.url})${description ? `: ${description}` : ""}`);
    }
  }
  return `${lines.join("\n")}\n`;
}
