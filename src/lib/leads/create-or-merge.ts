import type { PostgresAdapter } from "@payloadcms/db-postgres";
import { commitTransaction, createLocalReq, initTransaction, killTransaction, type Payload, type PayloadRequest } from "payload";

import { asSystemActivity } from "@/hooks/leads/lead-activity-hooks";
import { logger } from "@/lib/logger";
import type { LeadInput } from "@/shared/types/api";

import { resolveAutoAssignee } from "./assign";
import { hasSourceRecord } from "./lead-values";
import { type DedupeKey, dedupeLockKey, duplicateLeadWhere, SOURCE_REF_FIELD } from "./dedupe";

const log = logger.child({ component: "lead-create-or-merge" });

export interface LeadRequestContext {
  ipHash: string;
  userAgent?: string;
  consentVersion: string;
  /** Người nhận email "khách mới" (BR-13); trống thì bỏ qua email. */
  notificationEmails: string[];
  /** Gốc URL site (không có `/` cuối) để dựng link vào trang quản trị trong email. */
  siteUrl: string;
  now: Date;
}

export type LeadOutcome = "created" | "merged";

/** Chỉ transaction của `req` mới giữ được khoá: lấy khoá trên kết nối của chính transaction đó, tự nhả khi commit/rollback. */
async function lockSubmission(req: PayloadRequest, key: DedupeKey): Promise<void> {
  const transactionId = await req.transactionID;
  const adapter = req.payload.db as unknown as PostgresAdapter;
  const session = transactionId ? adapter.sessions[String(transactionId)] : undefined;
  if (!session) throw new Error("Không có transaction để khoá chống trùng lead");
  await adapter.execute({ db: session.db, raw: `SELECT pg_advisory_xact_lock(${dedupeLockKey(key)})` });
}

/** BR-15: gộp = +1 `mergedCount` và 1 activity `merged` (hook của activity đẩy `lastActivityAt`); không tạo lead mới. */
async function mergeIntoLead(
  payload: Payload,
  req: PayloadRequest,
  existing: { id: string; mergedCount?: number | null },
  input: LeadInput,
): Promise<void> {
  await payload.update({
    collection: "leads",
    id: existing.id,
    data: { mergedCount: (existing.mergedCount ?? 0) + 1 },
    req,
    overrideAccess: true,
    depth: 0,
  });
  await asSystemActivity(req, () =>
    payload.create({
      collection: "lead-activities",
      data: { lead: existing.id, type: "merged", content: input.message },
      req,
      overrideAccess: true,
      depth: 0,
    }),
  );
}

async function createLead(
  payload: Payload,
  req: PayloadRequest,
  input: LeadInput,
  context: LeadRequestContext,
): Promise<{ id: string }> {
  const assignedTo = await resolveAutoAssignee(payload, { source: input.source, sourceId: input.sourceId ?? null, req });
  const sourceRef = !hasSourceRecord(input.source) || !input.sourceId ? {} : { [SOURCE_REF_FIELD[input.source]]: input.sourceId };
  const created = await payload.create({
    collection: "leads",
    data: {
      source: input.source,
      ...sourceRef,
      status: "new",
      fullName: input.fullName,
      phone: input.phone,
      email: input.email,
      message: input.message,
      locale: input.locale,
      ...(assignedTo ? { assignedTo } : {}),
      consentAt: context.now.toISOString(),
      consentVersion: context.consentVersion,
      utm: input.utm,
      pageUrl: input.pageUrl,
      referrer: input.referrer,
      ipHash: context.ipHash,
      userAgent: context.userAgent,
    } as never, // `code` bắt buộc theo kiểu sinh ra nhưng do hook `assignLeadCode` cấp (cùng cách các test tạo lead)
    req,
    // Collection không cho ai tạo qua API (PERMISSION §3.3): khách chỉ vào được bằng endpoint công khai, sau Turnstile + rate limit.
    overrideAccess: true,
    depth: 0,
  });
  return { id: created.id };
}

/** Cùng transaction với lead: lưu lead lỗi thì không có job. Lỗi hàng đợi làm rollback cả lead để khách nộp lại được (không mất lead âm thầm). */
async function queueNewLeadEmail(payload: Payload, req: PayloadRequest, leadId: string, input: LeadInput, context: LeadRequestContext): Promise<void> {
  if (context.notificationEmails.length === 0) {
    log.warn({ leadId }, "site-settings.notificationEmails trống, bỏ qua email lead mới");
    return;
  }
  await payload.jobs.queue({
    task: "send-notification-email",
    input: {
      template: "new-lead",
      to: context.notificationEmails,
      data: {
        leadName: input.fullName,
        phone: input.phone,
        email: input.email,
        need: input.message,
        language: input.locale,
        leadUrl: `${context.siteUrl}/admin/collections/leads/${leadId}`,
      },
    },
    req,
  });
}

/**
 * Nhận lead từ form công khai trong MỘT transaction: khoá theo (SĐT, nguồn, bản ghi) -> tìm lead trùng 7 ngày -> gộp, hoặc tạo
 * lead `new` (tự giao BR-12 do hook `recordAssignmentChange` sinh activity/email) + xếp email BR-13. Hai request đồng thời cùng
 * khoá nên không sinh hai lead; kết quả trả cho khách do caller làm giống nhau cho cả hai nhánh.
 */
export async function createOrMergeLead(payload: Payload, input: LeadInput, context: LeadRequestContext): Promise<LeadOutcome> {
  const key: DedupeKey = { phoneNormalized: input.phone, source: input.source, sourceId: input.sourceId ?? null };
  const req = await createLocalReq({}, payload);
  const ownsTransaction = await initTransaction(req);
  try {
    await lockSubmission(req, key);
    const found = await payload.find({
      collection: "leads",
      where: duplicateLeadWhere(key, context.now),
      sort: "-createdAt",
      limit: 1,
      depth: 0,
      select: { mergedCount: true },
      req,
      overrideAccess: true,
    });
    const existing = found.docs[0];
    let outcome: LeadOutcome = "merged";
    if (existing) {
      await mergeIntoLead(payload, req, existing, input);
    } else {
      // Nhánh tạo chạy thêm vài truy vấn so với gộp nên chậm hơn chút; không đệm thời gian phản hồi vì endpoint có rate limit 5/10 phút/IP
      // và cùng một response cho cả hai nhánh (rủi ro dò SĐT qua độ trễ được chấp nhận, residual L9-T02).
      const created = await createLead(payload, req, input, context);
      await queueNewLeadEmail(payload, req, created.id, input, context);
      outcome = "created";
    }
    if (ownsTransaction) await commitTransaction(req);
    return outcome;
  } catch (error) {
    if (ownsTransaction) await killTransaction(req);
    throw error;
  }
}
