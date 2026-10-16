/** Khung HTML + hàm escape dùng chung cho mọi email nội bộ (luôn tiếng Việt, BRD BR-17). */

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Mọi giá trị do khách nhập đều phải đi qua hàm này trước khi vào HTML. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}

/** Subject một dòng: xuống dòng trong dữ liệu khách nhập có thể bị lợi dụng chèn header email. */
export function toSingleLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** Nhãn ngôn ngữ khách đã dùng (BR-17) hiện trong email nội bộ. */
export const LANGUAGE_LABEL = { vi: "Tiếng Việt", en: "Tiếng Anh" } as const;

export interface EmailRow {
  label: string;
  value: string;
}

/** Dựng email dạng: tiêu đề + bảng nhãn/giá trị + liên kết vào trang quản trị. */
export function buildEmail(args: {
  subject: string;
  heading: string;
  rows: EmailRow[];
  linkUrl: string;
}): RenderedEmail {
  const { heading, rows, linkUrl } = args;
  const subject = toSingleLine(args.subject);
  const rowsHtml = rows
    .map(
      (row) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#555">${escapeHtml(row.label)}</td><td style="padding:4px 0"><strong>${escapeHtml(row.value)}</strong></td></tr>`,
    )
    .join("");
  const html = [
    `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111">`,
    `<h2 style="margin:0 0 12px">${escapeHtml(heading)}</h2>`,
    `<table style="border-collapse:collapse">${rowsHtml}</table>`,
    `<p style="margin:16px 0 0"><a href="${escapeHtml(linkUrl)}">Mở trong trang quản trị</a></p>`,
    `</div>`,
  ].join("");
  const text = [
    heading,
    "",
    ...rows.map((row) => `${row.label}: ${row.value}`),
    "",
    `Mở trong trang quản trị: ${linkUrl}`,
  ].join("\n");
  return { subject, html, text };
}
