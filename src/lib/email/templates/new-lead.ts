import { z } from "zod";

import { buildEmail, LANGUAGE_LABEL, type RenderedEmail } from "./layout";

export const newLeadDataSchema = z.object({
  leadName: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().optional(),
  need: z.string().optional(),
  language: z.enum(["vi", "en"]),
  leadUrl: z.url({ protocol: /^https?$/ }),
});

/** BR-13: lead mới -> email admin (và sale được tự giao). Hiện ngôn ngữ khách đã dùng (BR-17). */
export function renderNewLead(rawData: unknown): RenderedEmail {
  const data = newLeadDataSchema.parse(rawData);
  const rows = [
    { label: "Họ tên", value: data.leadName },
    { label: "Số điện thoại", value: data.phone },
    ...(data.email ? [{ label: "Email", value: data.email }] : []),
    ...(data.need ? [{ label: "Nhu cầu", value: data.need }] : []),
    { label: "Ngôn ngữ khách dùng", value: LANGUAGE_LABEL[data.language] },
  ];
  return buildEmail({
    subject: `[TAMI] Khách hàng mới: ${data.leadName}`,
    heading: "Có khách hàng mới để lại thông tin",
    rows,
    linkUrl: data.leadUrl,
  });
}
