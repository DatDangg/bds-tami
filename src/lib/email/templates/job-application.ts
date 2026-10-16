import { z } from "zod";

import { buildEmail, LANGUAGE_LABEL, type RenderedEmail } from "./layout";

export const jobApplicationDataSchema = z.object({
  applicantName: z.string().min(1),
  jobTitle: z.string().min(1),
  language: z.enum(["vi", "en"]),
  applicationUrl: z.url({ protocol: /^https?$/ }),
});

/** BR-21: có hồ sơ ứng tuyển mới -> email báo admin. CV chỉ xem trong trang quản trị, không đính kèm. */
export function renderJobApplication(rawData: unknown): RenderedEmail {
  const data = jobApplicationDataSchema.parse(rawData);
  return buildEmail({
    subject: `[TAMI] Hồ sơ ứng tuyển mới: ${data.jobTitle}`,
    heading: "Có hồ sơ ứng tuyển mới",
    rows: [
      { label: "Ứng viên", value: data.applicantName },
      { label: "Vị trí", value: data.jobTitle },
      { label: "Ngôn ngữ ứng viên dùng", value: LANGUAGE_LABEL[data.language] },
    ],
    linkUrl: data.applicationUrl,
  });
}
