import { z } from "zod";

import { buildEmail, LANGUAGE_LABEL, type RenderedEmail } from "./layout";

export const leadAssignedDataSchema = z.object({
  leadName: z.string().min(1),
  phone: z.string().min(1),
  assignedToName: z.string().min(1),
  language: z.enum(["vi", "en"]),
  leadUrl: z.url({ protocol: /^https?$/ }),
});

/** BR-13: admin giao (giao lại) lead -> email sale mới. */
export function renderLeadAssigned(rawData: unknown): RenderedEmail {
  const data = leadAssignedDataSchema.parse(rawData);
  return buildEmail({
    subject: `[TAMI] Bạn được giao khách hàng: ${data.leadName}`,
    heading: `${data.assignedToName}, bạn vừa được giao một khách hàng`,
    rows: [
      { label: "Họ tên", value: data.leadName },
      { label: "Số điện thoại", value: data.phone },
      { label: "Ngôn ngữ khách dùng", value: LANGUAGE_LABEL[data.language] },
    ],
    linkUrl: data.leadUrl,
  });
}
