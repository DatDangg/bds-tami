import { AuthenticationError, LockedAuth } from "payload";
import type { CollectionAfterErrorHook } from "payload";

import { tryWriteAuditLog } from "../../lib/audit/write-audit-log";

const MAX_EMAIL_LENGTH = 254;
// Chỉ ghi email "trông như email": người dùng hay gõ nhầm mật khẩu vào ô email, không được lưu nó vào nhật ký.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function attemptedEmail(data: unknown): string | undefined {
  const raw = (data as { email?: unknown } | undefined)?.email;
  if (typeof raw !== "string") return undefined;
  const email = raw.trim().toLowerCase();
  return email.length <= MAX_EMAIL_LENGTH && EMAIL_SHAPE.test(email) ? email : undefined;
}

/**
 * Ghi `auth.login_failed` khi `POST /api/staff/login` trả lỗi xác thực hoặc tài khoản đang bị khoá.
 * `payload.login` của Local API không đi qua hook này (Payload chỉ gọi `afterError` ở lớp REST); form /admin
 * dùng REST nên đủ cho mục tiêu "dấu vết dò mật khẩu". Fail-open (`tryWriteAuditLog`): hook không được
 * làm đổi phản hồi đăng nhập, và không ném lỗi.
 */
export const auditFailedLogin: CollectionAfterErrorHook = async ({ error, req }) => {
  const isLoginRequest = req.method?.toUpperCase() === "POST" && req.pathname?.endsWith("/staff/login");
  if (!isLoginRequest || !(error instanceof AuthenticationError || error instanceof LockedAuth)) return;
  try {
    const email = attemptedEmail(req.data);
    const account = email
      ? await req.payload.db.findOne({ collection: "staff", where: { email: { equals: email } }, select: { id: true } })
      : null;
    const locked = error instanceof LockedAuth;
    await tryWriteAuditLog({
      action: "auth.login_failed",
      collection: "staff",
      docId: account?.id as string | undefined,
      summary: locked ? "Đăng nhập khi tài khoản đang bị khoá" : "Đăng nhập thất bại",
      meta: { email, reason: locked ? "locked" : "invalid_credentials" },
      req,
    });
  } catch (lookupError) {
    req.payload.logger.error({ err: lookupError }, "Không ghi được audit đăng nhập thất bại");
  }
};
