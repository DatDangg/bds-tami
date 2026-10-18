import { z } from "zod";

import { escapeHtml, type RenderedEmail } from "./layout";

export const translationBudgetExceededDataSchema = z.object({
  /** Tháng tính hạn mức, `YYYY-MM` (UTC). */
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  adminUrl: z.url({ protocol: /^https?$/ }),
});

/** BR-08: dịch AI dừng vì chạm hạn mức chi phí tháng. Chỉ nêu tháng + link admin: không nội dung bài, không số liệu khách. */
export function renderTranslationBudgetExceeded(rawData: unknown): RenderedEmail {
  const data = translationBudgetExceededDataSchema.parse(rawData);
  const heading = `Dịch tự động đã dừng: chạm hạn mức chi phí tháng ${data.month}`;
  const html = [
    `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111">`,
    `<h2 style="margin:0 0 12px">${escapeHtml(heading)}</h2>`,
    `<p>Các bài đăng mới/đã sửa sẽ chưa có bản tiếng Anh cho đến khi sang tháng mới hoặc admin tăng hạn mức (biến môi trường <code>TRANSLATION_MONTHLY_BUDGET_USD</code>).</p>`,
    `<p>Bản ghi bị ảnh hưởng có trạng thái dịch "failed" trong <a href="${escapeHtml(data.adminUrl)}">trang quản trị</a>; lưu lại bản ghi hoặc bấm "Dịch lại bằng AI" khi đã có hạn mức.</p>`,
    `</div>`,
  ].join("");
  const text = [
    heading,
    "",
    "Các bài đăng mới/đã sửa sẽ chưa có bản tiếng Anh cho đến khi sang tháng mới hoặc admin tăng hạn mức (TRANSLATION_MONTHLY_BUDGET_USD).",
    `Trang quản trị: ${data.adminUrl}`,
  ].join("\n");
  return { subject: `[TAMI] Dịch tự động dừng: hết hạn mức tháng ${data.month}`, html, text };
}
