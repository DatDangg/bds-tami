import type { PayloadRequest } from "payload";

import { getEnv } from "../lib/env";
import { ROLES } from "../access/roles";
import { claimBudgetAlert, monthKey, releaseBudgetAlert } from "../lib/translation/budget";
import type { TranslationErrorCode } from "../lib/translation/errors";
import { type Context, patchTranslationGroup, readDoc } from "./translate-content-context";

async function adminEmails(req: PayloadRequest): Promise<string[]> {
  const admins = await req.payload.find({
    collection: "staff",
    where: { and: [{ role: { equals: ROLES.admin } }, { active: { equals: true } }] },
    limit: 50,
    pagination: false,
    depth: 0,
    select: { email: true },
    overrideAccess: true,
  });
  return admins.docs.map((admin) => admin.email);
}

/**
 * Email báo admin khi chạm hạn mức tháng (chỉ tháng + link admin; không nội dung bài, không PII). Chỉ MỘT email mỗi tháng cho cả hệ thống:
 * `claimBudgetAlert` là câu SQL nguyên tử nên N bản ghi/N job song song cùng chạm hạn mức vẫn chỉ gửi một. Xếp email lỗi thì nhả lại quyền gửi.
 */
async function notifyBudgetExceeded(ctx: Context): Promise<void> {
  const recipients = await adminEmails(ctx.req);
  if (recipients.length === 0) return;
  const month = monthKey(ctx.now);
  if (!(await claimBudgetAlert(ctx.req.payload, month))) return;
  try {
    const adminUrl = `${getEnv().NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "")}/admin`;
    await ctx.req.payload.jobs.queue({
      task: "send-notification-email",
      input: { template: "translation-budget-exceeded", to: recipients, data: { month, adminUrl } },
    });
  } catch (error) {
    await releaseBudgetAlert(ctx.req.payload, month);
    throw error;
  }
}

/**
 * Ghi lỗi lên bản ghi: `status = failed`, `lastError = <mã cố định>` (không bao giờ message/nội dung). Hết hạn mức → thêm email admin (1 lần/tháng toàn hệ thống,
 * xem `notifyBudgetExceeded`). Lỗi khi ghi lỗi chỉ được log: không che lỗi gốc.
 */
export async function recordFailure(ctx: Context, code: TranslationErrorCode): Promise<void> {
  try {
    const vi = await readDoc(ctx, "vi");
    if (!vi) return;
    await patchTranslationGroup(ctx, vi, { status: "failed", lastError: code });
    if (code === "budget_exceeded") await notifyBudgetExceeded(ctx);
  } catch (error) {
    ctx.req.payload.logger.error({ errorName: error instanceof Error ? error.name : "UnknownError", code }, "Dịch: không ghi được trạng thái lỗi lên bản ghi");
  }
}
