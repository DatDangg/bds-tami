import type { PayloadRequest } from "payload";

import { tryWriteAuditLog } from "../../lib/audit/write-audit-log";

/**
 * Đặt lại mật khẩu bằng token email: `resetPassword` của Payload không chạy `afterChange` nên phải ghi audit
 * ở endpoint, sau khi handler mặc định đã thành công. Mật khẩu đã đổi xong nên ghi hỏng chỉ log (fail-open),
 * không được biến thành lỗi cho người vừa đổi thành công. Không có actor: người đặt lại chưa đăng nhập.
 */
export async function auditTokenPasswordReset(response: Response, req: PayloadRequest): Promise<void> {
  if (!response.ok) return;
  try {
    const body = (await response.clone().json()) as { user?: { id?: string; email?: string } };
    const user = body.user;
    if (!user?.id) return;
    await tryWriteAuditLog({
      action: "staff.reset_password",
      collection: "staff",
      docId: user.id,
      summary: `Đặt lại mật khẩu bằng liên kết email: ${user.email ?? user.id}`,
      meta: { via: "email_token" },
      req,
    });
  } catch (error) {
    req.payload.logger.error({ err: error }, "Không ghi được audit đặt lại mật khẩu");
  }
}
