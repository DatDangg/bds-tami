import { commitTransaction, initTransaction, killTransaction, type PayloadRequest, type TaskConfig } from "payload";

import { ROLES } from "../access/roles";
import { asSystemActivity } from "../hooks/leads/lead-activity-hooks";
import { businessMinutesBetween, isBusinessHour } from "../lib/leads/business-hours";
import { getEnv } from "../lib/env";

export const REMIND_UNASSIGNED_LEADS_SLUG = "remind-unassigned-leads";

/** BR-14: nhắc khi lead `new` chưa có sale sau chừng này phút GIỜ HÀNH CHÍNH. */
export const REMIND_AFTER_BUSINESS_MINUTES = 30;
/** Số lead tối đa xét mỗi lần chạy (10 phút/lần); lead còn lại được nhắc ở lần sau. Dư xa so với lượng lead thực tế của Tami. */
const MAX_LEADS_PER_RUN = 200;
/** Số lead liệt kê trong email; phần dư chỉ báo số lượng để email gọn. */
const MAX_LEADS_IN_EMAIL = 50;

export interface RemindUnassignedLeadsOutcome {
  /** Số lead vừa được nhắc (và đánh dấu `remindedAt`) trong lần chạy này. */
  reminded: number;
}

/**
 * Nhắc admin các lead `new` chưa giao quá 30 phút làm việc (BR-14). Chỉ chạy trong giờ hành chính; ngoài giờ trả 0 và lead chờ tới giờ làm.
 * Mỗi lead nhắc ĐÚNG MỘT LẦN: `leads.remindedAt` được đặt cùng transaction với việc xếp email vào hàng đợi (commit cùng, rollback cùng),
 * nên chạy lại không gửi trùng và lỗi giữa chừng không làm mất lời nhắc. Một email gộp cho mọi lead trong lần chạy, chỉ có mã lead + link
 * admin (không SĐT/email khách). Mỗi lead ghi một activity `email_sent` (không PII) để lịch sử chăm sóc thấy đã nhắc.
 */
export async function remindUnassignedLeads(args: { req: PayloadRequest; now?: Date }): Promise<RemindUnassignedLeadsOutcome> {
  const { req, now = new Date() } = args;
  const { payload } = req;
  if (!isBusinessHour(now)) return { reminded: 0 };

  const candidates = await payload.find({
    collection: "leads",
    where: {
      and: [
        { status: { equals: "new" } },
        { assignedTo: { exists: false } },
        { remindedAt: { exists: false } },
        { anonymizedAt: { exists: false } },
        { createdAt: { less_than_equal: new Date(now.getTime() - REMIND_AFTER_BUSINESS_MINUTES * 60_000).toISOString() } },
      ],
    },
    sort: "createdAt",
    limit: MAX_LEADS_PER_RUN,
    pagination: false,
    depth: 0,
    select: { code: true, createdAt: true },
    overrideAccess: true,
    req,
  });
  const due = candidates.docs.filter((lead) => businessMinutesBetween(new Date(lead.createdAt), now) >= REMIND_AFTER_BUSINESS_MINUTES);
  if (due.length === 0) return { reminded: 0 };

  const admins = await payload.find({
    collection: "staff",
    where: { and: [{ role: { equals: ROLES.admin } }, { active: { equals: true } }] },
    limit: 50,
    pagination: false,
    depth: 0,
    select: { email: true },
    overrideAccess: true,
    req,
  });
  const recipients = admins.docs.map((admin) => admin.email);
  if (recipients.length === 0) {
    // Không đánh dấu: có admin thì lần chạy sau vẫn nhắc.
    payload.logger.warn({ leads: due.length }, "Nhắc lead: không có admin hoạt động để nhận email");
    return { reminded: 0 };
  }

  const siteUrl = getEnv().NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  const ownsTransaction = await initTransaction(req);
  try {
    for (const lead of due) {
      await payload.update({ collection: "leads", id: lead.id, data: { remindedAt: now.toISOString() }, depth: 0, overrideAccess: true, req });
      await asSystemActivity(req, () =>
        payload.create({
          collection: "lead-activities",
          data: { lead: lead.id, type: "email_sent", content: `Đã nhắc admin: chưa giao sau ${REMIND_AFTER_BUSINESS_MINUTES} phút làm việc` },
          depth: 0,
          overrideAccess: true,
          req,
        }),
      );
    }
    const listed = due.slice(0, MAX_LEADS_IN_EMAIL);
    await payload.jobs.queue({
      task: "send-notification-email",
      input: {
        template: "unassigned-reminder",
        to: recipients,
        data: {
          leads: listed.map((lead) => ({ code: lead.code, leadUrl: `${siteUrl}/admin/collections/leads/${lead.id}` })),
          moreCount: due.length - listed.length,
          waitMinutes: REMIND_AFTER_BUSINESS_MINUTES,
        },
      },
      req,
    });
    if (ownsTransaction) await commitTransaction(req);
  } catch (error) {
    if (ownsTransaction) await killTransaction(req);
    throw error;
  }
  if (candidates.docs.length >= MAX_LEADS_PER_RUN) {
    payload.logger.warn({ limit: MAX_LEADS_PER_RUN }, "Nhắc lead: số lead chờ chạm trần mỗi lần chạy, phần còn lại được nhắc ở lần sau");
  }
  return { reminded: due.length };
}

/**
 * 10 phút/lần trong giờ hành chính. `schedule` không có múi giờ riêng (container `jobs` chạy UTC): giờ làm 08:00–17:30 VN = 01:00–10:30 UTC
 * cùng ngày, thứ 2–thứ 7 VN cũng là thứ 2–thứ 7 UTC. Cron phủ 01:00–10:50 UTC (6 trường: giây phút giờ ngày tháng thứ); lần 10:30/40/50 UTC
 * bị `remindUnassignedLeads` bỏ qua vì đã hết giờ làm (nguồn đúng duy nhất là `isBusinessHour`).
 */
export const remindUnassignedLeadsTask: TaskConfig<"remind-unassigned-leads"> = {
  slug: REMIND_UNASSIGNED_LEADS_SLUG,
  label: "Nhắc admin lead mới chưa giao quá 30 phút làm việc",
  retries: { attempts: 3, backoff: { type: "exponential", delay: 60_000 } },
  schedule: [{ cron: "0 */10 1-10 * * 1-6", queue: "default" }],
  outputSchema: [{ name: "reminded", type: "number", required: true }],
  handler: async ({ req }) => {
    const output = await remindUnassignedLeads({ req });
    // Chỉ số lượng: không log mã/tên/SĐT lead.
    if (output.reminded > 0) req.payload.logger.info({ ...output }, "Nhắc lead: đã nhắc admin lead chưa giao");
    return { output };
  },
};
