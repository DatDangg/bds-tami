import { nodemailerAdapter } from "@payloadcms/email-nodemailer";
import type { SendEmailOptions } from "payload";

import type { Env } from "../env";
import { logger as appLogger } from "../logger";
import { filterRecipients, parseEmailAllowlist, type AppEnvironment } from "./allowlist";

const SMTPS_PORT = 465;
const RECIPIENT_FIELDS = ["to", "cc", "bcc"] as const;

type SendEmail = (message: SendEmailOptions) => Promise<unknown>;
type EmailLogger = { warn: (fields: object, message: string) => void };
type EmailAdapterEnv = Pick<
  Env,
  "SMTP_HOST" | "SMTP_PORT" | "SMTP_USER" | "SMTP_PASS" | "EMAIL_FROM_ADDRESS" | "APP_ENV" | "EMAIL_ALLOWLIST"
>;

interface RecipientEntry {
  original: unknown;
  address: string;
}

/**
 * "Tên <a@x.vn>" -> "a@x.vn"; object Address -> address; "a@x.vn, b@y.vn" tách thành từng mục; mảng lồng nhau trải phẳng.
 * Mục không đọc được địa chỉ (vd nhóm) bị coi là không có người nhận (fail-safe: không gửi).
 */
function toRecipientEntries(value: unknown): RecipientEntry[] {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value.flatMap(toRecipientEntries);
  if (typeof value === "object") {
    const address = (value as { address?: unknown }).address;
    return typeof address === "string" && address.length > 0 ? [{ original: value, address }] : [];
  }
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .map((trimmed) => ({ original: trimmed, address: /<([^>]+)>/.exec(trimmed)?.[1] ?? trimmed }))
    .filter((entry) => entry.address.length > 0);
}

interface GuardArgs {
  send: SendEmail;
  appEnv: AppEnvironment;
  allowlistRaw: string | undefined;
  log: EmailLogger;
}

/**
 * Chốt chặn duy nhất cho mọi email Payload gửi (quên mật khẩu, job thông báo): lọc to/cc/bcc theo EMAIL_ALLOWLIST ở môi
 * trường không-production. Không còn người nhận -> không gọi transport.
 */
export function guardSendEmail({ send, appEnv, allowlistRaw, log }: GuardArgs): SendEmail {
  const allowlist = parseEmailAllowlist(allowlistRaw);
  return async (message) => {
    const filtered: SendEmailOptions = { ...message };
    let allowedCount = 0;
    let droppedCount = 0;
    for (const field of RECIPIENT_FIELDS) {
      if (message[field] === undefined) continue;
      const entries = toRecipientEntries(message[field]);
      const result = filterRecipients({ appEnv, allowlist, recipients: entries.map((entry) => entry.address) });
      const kept = entries.filter((entry) => result.allowed.includes(entry.address));
      allowedCount += kept.length;
      droppedCount += entries.length - kept.length;
      filtered[field] = kept.map((entry) => entry.original) as NonNullable<SendEmailOptions["to"]>;
    }
    if (droppedCount > 0) log.warn({ dropped: droppedCount, appEnv }, "Email: bỏ người nhận ngoài danh sách cho phép");
    if (allowedCount === 0) return undefined;

    return send(filtered);
  };
}

/**
 * Adapter email của Payload qua SMTP Brevo (nodemailer). Giá trị bí mật chỉ lấy từ env, không log.
 * `skipVerify`: không mở kết nối SMTP lúc nạp config (next build và web app không cần SMTP);
 * lỗi cấu hình SMTP lộ ra khi job gửi thật và được retry.
 */
export async function createEmailAdapter(env: EmailAdapterEnv) {
  const createAdapter = await nodemailerAdapter({
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
  return ({ payload }: Parameters<typeof createAdapter>[0]) => {
    const adapter = createAdapter({ payload });
    return {
      ...adapter,
      sendEmail: guardSendEmail({
        send: adapter.sendEmail,
        appEnv: env.APP_ENV,
        allowlistRaw: env.EMAIL_ALLOWLIST,
        log: appLogger,
      }),
    };
  };
}
