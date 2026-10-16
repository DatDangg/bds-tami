import { JobCancelledError, type Payload, type TaskConfig } from "payload";
import { z } from "zod";

import { getEnv } from "../lib/env";
import { filterRecipients, parseEmailAllowlist, type AppEnvironment } from "../lib/email/allowlist";
import { EMAIL_TEMPLATE_NAMES, renderEmailTemplate } from "../lib/email/templates";

export const SEND_NOTIFICATION_EMAIL_SLUG = "send-notification-email";

const inputSchema = z.object({
  template: z.enum(EMAIL_TEMPLATE_NAMES),
  to: z.array(z.email()).min(1),
  data: z.unknown(),
});

export interface DeliveryOutcome {
  sent: number;
  dropped: number;
}

type SendEmail = Payload["sendEmail"];
type JobLogger = Pick<Payload["logger"], "info" | "warn">;

/**
 * Lõi gửi email: kiểm input, lọc người nhận theo môi trường, render template tiếng Việt, gửi.
 * Gửi MỘT thư cho toàn bộ người nhận (một giao dịch SMTP) nên retry sau lỗi không gây gửi trùng từng phần.
 * Log chỉ có id job, template, số người nhận: nội dung thư và địa chỉ chứa dữ liệu cá nhân.
 */
export async function deliverNotificationEmail(args: {
  input: unknown;
  jobId: string | number;
  sendEmail: SendEmail;
  logger: JobLogger;
  appEnv: AppEnvironment;
  allowlistRaw: string | undefined;
}): Promise<DeliveryOutcome> {
  const { jobId, sendEmail, logger, appEnv } = args;
  const input = inputSchema.parse(args.input);
  const { allowed, droppedCount } = filterRecipients({
    appEnv,
    allowlist: parseEmailAllowlist(args.allowlistRaw),
    recipients: input.to,
  });
  if (droppedCount > 0) {
    logger.warn({ jobId, template: input.template, dropped: droppedCount, appEnv }, "Email: bỏ người nhận ngoài danh sách cho phép");
  }
  if (allowed.length === 0) {
    return { sent: 0, dropped: droppedCount };
  }
  const mail = renderEmailTemplate(input.template, input.data);
  await sendEmail({ to: allowed, subject: mail.subject, html: mail.html, text: mail.text });
  logger.info({ jobId, template: input.template, recipients: allowed.length }, "Email: đã gửi thông báo");
  return { sent: allowed.length, dropped: droppedCount };
}

/** Thử lại 5 lần, backoff mũ từ 30 giây (≈ 30s, 1m, 2m, 4m, 8m) cho lỗi SMTP tạm thời. */
export const sendNotificationEmailTask: TaskConfig<"send-notification-email"> = {
  slug: SEND_NOTIFICATION_EMAIL_SLUG,
  label: "Gửi email thông báo nội bộ",
  retries: { attempts: 5, backoff: { type: "exponential", delay: 30_000 } },
  inputSchema: [
    { name: "template", type: "select", required: true, options: EMAIL_TEMPLATE_NAMES },
    { name: "to", type: "text", hasMany: true, required: true },
    { name: "data", type: "json" },
  ],
  outputSchema: [
    { name: "sent", type: "number", required: true },
    { name: "dropped", type: "number", required: true },
  ],
  handler: async ({ input, job, req }) => {
    const env = getEnv();
    try {
      const output = await deliverNotificationEmail({
        input,
        jobId: job.id,
        sendEmail: (message) => req.payload.sendEmail(message),
        logger: req.payload.logger,
        appEnv: env.APP_ENV,
        allowlistRaw: env.EMAIL_ALLOWLIST,
      });
      return { output };
    } catch (error) {
      const permanent = error instanceof z.ZodError;
      // Log lỗi mặc định của Payload in cả input job (dữ liệu khách): runner tắt nó (silent.error), ở đây chỉ ghi định danh.
      req.payload.logger.error(
        { jobId: job.id, template: input.template, errorName: error instanceof Error ? error.name : "UnknownError" },
        permanent ? "Email: dữ liệu không hợp lệ, kết thúc job không thử lại" : "Email: gửi thất bại, sẽ thử lại theo backoff",
      );
      // Input/template sai là lỗi vĩnh viễn: huỷ job để không retry vô ích (và không lặp lại log). Thông điệp không chứa giá trị input.
      if (permanent) throw new JobCancelledError("Dữ liệu email không hợp lệ");
      throw error;
    }
  },
};
