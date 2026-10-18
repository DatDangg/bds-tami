import { commitTransaction, initTransaction, killTransaction, type PayloadRequest, type TaskConfig } from "payload";

import { ROLES } from "../access/roles";
import { asSystemActivity } from "../hooks/leads/lead-activity-hooks";
import { businessMinutesBetween, isBusinessHour } from "../lib/leads/business-hours";
import { lockForTransaction } from "../lib/db/advisory-lock";
import { ADVISORY_LOCK_KEYS } from "../lib/db/advisory-lock-keys";
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

/** Khoá advisory của job này (id riêng trong registry `ADVISORY_LOCK_KEYS`): tuần tự hoá các lần chạy chồng nhau. */
const REMIND_LOCK_KEY = ADVISORY_LOCK_KEYS.remindUnassignedLeads;

/**
 * Nhắc admin các lead `new` chưa giao quá 30 phút làm việc (BR-14). Chỉ chạy trong giờ hành chính; ngoài giờ trả 0 và lead chờ tới giờ làm.
 * Mỗi lead nhắc ĐÚNG MỘT LẦN: `leads.remindedAt` được đặt cùng transaction với việc xếp email vào hàng đợi (commit cùng, rollback cùng),
 * nên chạy lại không gửi trùng và lỗi giữa chừng không làm mất lời nhắc. Hai lần chạy chồng nhau (job treo/retry trùng lịch, hai process)
 * cũng không nhắc trùng: transaction giữ khoá advisory rồi MỚI chọn ứng viên, nên bên chờ khoá thấy `remindedAt` bên kia vừa đặt.
 * Một email gộp cho mọi lead trong lần chạy, chỉ có mã lead + link admin (không SĐT/email khách). Mỗi lead ghi một activity
 * `email_sent` (không PII) để lịch sử chăm sóc thấy đã nhắc.
 */
export async function remindUnassignedLeads(args: { req: PayloadRequest; now?: Date }): Promise<RemindUnassignedLeadsOutcome> {
  const { req, now = new Date() } = args;
  if (!isBusinessHour(now)) return { reminded: 0 };

  const ownsTransaction = await initTransaction(req);
  try {
    await lockForTransaction(req, REMIND_LOCK_KEY);
    const outcome = await remindDueLeads(req, now);
    if (ownsTransaction) await commitTransaction(req);
    if (outcome.capped) {
      req.payload.logger.warn({ limit: MAX_LEADS_PER_RUN }, "Nhắc lead: số lead chờ chạm trần mỗi lần chạy, phần còn lại được nhắc ở lần sau");
    }
    return { reminded: outcome.reminded };
  } catch (error) {
    if (ownsTransaction) await killTransaction(req);
    throw error;
  }
}

interface DueLead {
  id: string;
  code: string;
  createdAt: string;
}

/** Lead `new` chưa giao, chưa nhắc, đã chờ đủ `REMIND_AFTER_BUSINESS_MINUTES` phút làm việc. Gọi SAU khi có khoá. `capped`: chạm trần `MAX_LEADS_PER_RUN`. */
async function findDueLeads(req: PayloadRequest, now: Date): Promise<{ due: DueLead[]; capped: boolean }> {
  const candidates = await req.payload.find({
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
  return { due, capped: candidates.docs.length >= MAX_LEADS_PER_RUN };
}

async function findActiveAdminEmails(req: PayloadRequest): Promise<string[]> {
  const admins = await req.payload.find({
    collection: "staff",
    where: { and: [{ role: { equals: ROLES.admin } }, { active: { equals: true } }] },
    limit: 50,
    pagination: false,
    depth: 0,
    select: { email: true },
    overrideAccess: true,
    req,
  });
  return admins.docs.map((admin) => admin.email);
}

/** Đặt `remindedAt` và ghi activity `email_sent` (không PII) cho từng lead, cùng transaction với việc xếp email. */
async function markLeadsReminded(req: PayloadRequest, due: DueLead[], now: Date): Promise<void> {
  const { payload } = req;
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
}

/** Xếp MỘT email gộp cho mọi lead đến hạn: chỉ mã lead + link admin (không SĐT/email khách), liệt kê tối đa `MAX_LEADS_IN_EMAIL`. */
async function queueReminderEmail(req: PayloadRequest, due: DueLead[], recipients: string[]): Promise<void> {
  const siteUrl = getEnv().NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  const listed = due.slice(0, MAX_LEADS_IN_EMAIL);
  await req.payload.jobs.queue({
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
}

/** Phần việc trong transaction đã giữ khoá: chọn lead đến hạn (đọc SAU khi có khoá), đánh dấu + activity, xếp email gộp. */
async function remindDueLeads(req: PayloadRequest, now: Date): Promise<RemindUnassignedLeadsOutcome & { capped: boolean }> {
  const { due, capped } = await findDueLeads(req, now);
  if (due.length === 0) return { reminded: 0, capped: false };

  const recipients = await findActiveAdminEmails(req);
  if (recipients.length === 0) {
    // Không đánh dấu: có admin thì lần chạy sau vẫn nhắc.
    req.payload.logger.warn({ leads: due.length }, "Nhắc lead: không có admin hoạt động để nhận email");
    return { reminded: 0, capped: false };
  }
  await markLeadsReminded(req, due, now);
  await queueReminderEmail(req, due, recipients);
  return { reminded: due.length, capped };
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
