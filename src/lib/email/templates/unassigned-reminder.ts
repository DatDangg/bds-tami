import { z } from "zod";

import { escapeHtml, type RenderedEmail } from "./layout";

export const unassignedReminderDataSchema = z.object({
  /** Chỉ mã lead + link admin: email nhắc không mang SĐT/email/tên khách (BR-14, PII). */
  leads: z.array(z.object({ code: z.string().min(1), leadUrl: z.url({ protocol: /^https?$/ }) })).min(1),
  /** Số lead chưa giao còn lại ngoài danh sách (khi quá dài), 0 nếu danh sách đủ. */
  moreCount: z.number().int().min(0).default(0),
  waitMinutes: z.number().int().min(1),
});

/** BR-14: lead `new` chưa có sale sau N phút giờ hành chính -> MỘT email gộp cho admin. */
export function renderUnassignedReminder(rawData: unknown): RenderedEmail {
  const data = unassignedReminderDataSchema.parse(rawData);
  const total = data.leads.length + data.moreCount;
  const heading = `${total} khách hàng chưa được giao quá ${data.waitMinutes} phút làm việc`;
  const items = data.leads.map((lead) => `<li><a href="${escapeHtml(lead.leadUrl)}">${escapeHtml(lead.code)}</a></li>`).join("");
  const moreHtml = data.moreCount > 0 ? `<p>Và ${data.moreCount} khách hàng khác, xem trong trang quản trị.</p>` : "";
  const html = [
    `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111">`,
    `<h2 style="margin:0 0 12px">${escapeHtml(heading)}</h2>`,
    `<p>Vui lòng giao cho sale phụ trách:</p>`,
    `<ul>${items}</ul>`,
    moreHtml,
    `</div>`,
  ].join("");
  const text = [
    heading,
    "",
    "Vui lòng giao cho sale phụ trách:",
    ...data.leads.map((lead) => `- ${lead.code}: ${lead.leadUrl}`),
    ...(data.moreCount > 0 ? [`Và ${data.moreCount} khách hàng khác, xem trong trang quản trị.`] : []),
  ].join("\n");
  return { subject: `[TAMI] ${total} khách hàng chưa được giao`, html, text };
}
