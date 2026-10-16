import { nodemailerAdapter } from "@payloadcms/email-nodemailer";

import type { Env } from "../env";

const SMTPS_PORT = 465;

/**
 * Adapter email của Payload qua SMTP Brevo (nodemailer). Giá trị bí mật chỉ lấy từ env, không log.
 * `skipVerify`: không mở kết nối SMTP lúc nạp config (next build và web app không cần SMTP);
 * lỗi cấu hình SMTP lộ ra khi job gửi thật và được retry.
 */
export function createEmailAdapter(env: Pick<Env, "SMTP_HOST" | "SMTP_PORT" | "SMTP_USER" | "SMTP_PASS" | "EMAIL_FROM_ADDRESS">) {
  return nodemailerAdapter({
    defaultFromAddress: env.EMAIL_FROM_ADDRESS ?? env.SMTP_USER,
    defaultFromName: "TAMI",
    skipVerify: true,
    transportOptions: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === SMTPS_PORT,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    },
  });
}
